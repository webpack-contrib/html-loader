import { parse } from 'url';

import { Parser } from 'htmlparser2';
import { isUrlRequest, urlToRequest } from 'loader-utils';

import HtmlSourceError from '../HtmlSourceError';
import { getFilter } from '../utils';

function isASCIIWhitespace(character) {
  return (
    // Horizontal tab
    character === '\u0009' ||
    // New line
    character === '\u000A' ||
    // Form feed
    character === '\u000C' ||
    // Carriage return
    character === '\u000D' ||
    // Space
    character === '\u0020'
  );
}

// (Don't use \s, to avoid matching non-breaking space)
// eslint-disable-next-line no-control-regex
const regexLeadingSpaces = /^[ \t\n\r\u000c]+/;
// eslint-disable-next-line no-control-regex
const regexLeadingCommasOrSpaces = /^[, \t\n\r\u000c]+/;
// eslint-disable-next-line no-control-regex
const regexLeadingNotSpaces = /^[^ \t\n\r\u000c]+/;
const regexTrailingCommas = /[,]+$/;
const regexNonNegativeInteger = /^\d+$/;

// ( Positive or negative or unsigned integers or decimals, without or without exponents.
// Must include at least one digit.
// According to spec tests any decimal point must be followed by a digit.
// No leading plus sign is allowed.)
// https://html.spec.whatwg.org/multipage/infrastructure.html#valid-floating-point-number
const regexFloatingPoint = /^-?(?:[0-9]+|[0-9]*\.[0-9]+)(?:[eE][+-]?[0-9]+)?$/;

function parseSrcset(input) {
  // 1. Let input be the value passed to this algorithm.
  const inputLength = input.length;

  let url;
  let descriptors;
  let currentDescriptor;
  let state;
  let c;

  // 2. Let position be a pointer into input, initially pointing at the start
  //    of the string.
  let position = 0;
  let startUrlPosition;

  // eslint-disable-next-line consistent-return
  function collectCharacters(regEx) {
    let chars;
    const match = regEx.exec(input.substring(position));

    if (match) {
      [chars] = match;
      position += chars.length;

      return chars;
    }
  }

  // 3. Let candidates be an initially empty source set.
  const candidates = [];

  // 4. Splitting loop: Collect a sequence of characters that are space
  //    characters or U+002C COMMA characters. If any U+002C COMMA characters
  //    were collected, that is a parse error.
  // eslint-disable-next-line no-constant-condition
  while (true) {
    collectCharacters(regexLeadingCommasOrSpaces);

    // 5. If position is past the end of input, return candidates and abort these steps.
    if (position >= inputLength) {
      if (candidates.length === 0) {
        throw new Error('Must contain one or more image candidate strings');
      }

      // (we're done, this is the sole return path)
      return candidates;
    }

    // 6. Collect a sequence of characters that are not space characters,
    //    and let that be url.
    startUrlPosition = position;
    url = collectCharacters(regexLeadingNotSpaces);

    // 7. Let descriptors be a new empty list.
    descriptors = [];

    // 8. If url ends with a U+002C COMMA character (,), follow these substeps:
    //		(1). Remove all trailing U+002C COMMA characters from url. If this removed
    //         more than one character, that is a parse error.
    if (url.slice(-1) === ',') {
      url = url.replace(regexTrailingCommas, '');

      // (Jump ahead to step 9 to skip tokenization and just push the candidate).
      parseDescriptors();
    }
    //	Otherwise, follow these substeps:
    else {
      tokenize();
    }

    // 16. Return to the step labeled splitting loop.
  }

  /**
   * Tokenizes descriptor properties prior to parsing
   * Returns undefined.
   */
  function tokenize() {
    // 8.1. Descriptor tokenizer: Skip whitespace
    collectCharacters(regexLeadingSpaces);

    // 8.2. Let current descriptor be the empty string.
    currentDescriptor = '';

    // 8.3. Let state be in descriptor.
    state = 'in descriptor';

    // eslint-disable-next-line no-constant-condition
    while (true) {
      // 8.4. Let c be the character at position.
      c = input.charAt(position);

      //  Do the following depending on the value of state.
      //  For the purpose of this step, "EOF" is a special character representing
      //  that position is past the end of input.

      // In descriptor
      if (state === 'in descriptor') {
        // Do the following, depending on the value of c:

        // Space character
        // If current descriptor is not empty, append current descriptor to
        // descriptors and let current descriptor be the empty string.
        // Set state to after descriptor.
        if (isASCIIWhitespace(c)) {
          if (currentDescriptor) {
            descriptors.push(currentDescriptor);
            currentDescriptor = '';
            state = 'after descriptor';
          }
        }
        // U+002C COMMA (,)
        // Advance position to the next character in input. If current descriptor
        // is not empty, append current descriptor to descriptors. Jump to the step
        // labeled descriptor parser.
        else if (c === ',') {
          position += 1;

          if (currentDescriptor) {
            descriptors.push(currentDescriptor);
          }

          parseDescriptors();

          return;
        }
        // U+0028 LEFT PARENTHESIS (()
        // Append c to current descriptor. Set state to in parens.
        else if (c === '\u0028') {
          currentDescriptor += c;
          state = 'in parens';
        }
        // EOF
        // If current descriptor is not empty, append current descriptor to
        // descriptors. Jump to the step labeled descriptor parser.
        else if (c === '') {
          if (currentDescriptor) {
            descriptors.push(currentDescriptor);
          }

          parseDescriptors();

          return;

          // Anything else
          // Append c to current descriptor.
        } else {
          currentDescriptor += c;
        }
      }
      // In parens
      else if (state === 'in parens') {
        // U+0029 RIGHT PARENTHESIS ())
        // Append c to current descriptor. Set state to in descriptor.
        if (c === ')') {
          currentDescriptor += c;
          state = 'in descriptor';
        }
        // EOF
        // Append current descriptor to descriptors. Jump to the step labeled
        // descriptor parser.
        else if (c === '') {
          descriptors.push(currentDescriptor);
          parseDescriptors();
          return;
        }
        // Anything else
        // Append c to current descriptor.
        else {
          currentDescriptor += c;
        }
      }
      // After descriptor
      else if (state === 'after descriptor') {
        // Do the following, depending on the value of c:
        if (isASCIIWhitespace(c)) {
          // Space character: Stay in this state.
        }
        // EOF: Jump to the step labeled descriptor parser.
        else if (c === '') {
          parseDescriptors();
          return;
        }
        // Anything else
        // Set state to in descriptor. Set position to the previous character in input.
        else {
          state = 'in descriptor';
          position -= 1;
        }
      }

      // Advance position to the next character in input.
      position += 1;
    }
  }

  /**
   * Adds descriptor properties to a candidate, pushes to the candidates array
   * @return undefined
   */
  // Declared outside of the while loop so that it's only created once.
  function parseDescriptors() {
    // 9. Descriptor parser: Let error be no.
    let pError = false;

    // 10. Let width be absent.
    // 11. Let density be absent.
    // 12. Let future-compat-h be absent. (We're implementing it now as h)
    let w;
    let d;
    let h;
    let i;
    const candidate = {};
    let desc;
    let lastChar;
    let value;
    let intVal;
    let floatVal;

    // 13. For each descriptor in descriptors, run the appropriate set of steps
    // from the following list:
    for (i = 0; i < descriptors.length; i++) {
      desc = descriptors[i];

      lastChar = desc[desc.length - 1];
      value = desc.substring(0, desc.length - 1);
      intVal = parseInt(value, 10);
      floatVal = parseFloat(value);

      // If the descriptor consists of a valid non-negative integer followed by
      // a U+0077 LATIN SMALL LETTER W character
      if (regexNonNegativeInteger.test(value) && lastChar === 'w') {
        // If width and density are not both absent, then let error be yes.
        if (w || d) {
          pError = true;
        }

        // Apply the rules for parsing non-negative integers to the descriptor.
        // If the result is zero, let error be yes.
        // Otherwise, let width be the result.
        if (intVal === 0) {
          pError = true;
        } else {
          w = intVal;
        }
      }
      // If the descriptor consists of a valid floating-point number followed by
      // a U+0078 LATIN SMALL LETTER X character
      else if (regexFloatingPoint.test(value) && lastChar === 'x') {
        // If width, density and future-compat-h are not all absent, then let error
        // be yes.
        if (w || d || h) {
          pError = true;
        }

        // Apply the rules for parsing floating-point number values to the descriptor.
        // If the result is less than zero, let error be yes. Otherwise, let density
        // be the result.
        if (floatVal < 0) {
          pError = true;
        } else {
          d = floatVal;
        }
      }
      // If the descriptor consists of a valid non-negative integer followed by
      // a U+0068 LATIN SMALL LETTER H character
      else if (regexNonNegativeInteger.test(value) && lastChar === 'h') {
        // If height and density are not both absent, then let error be yes.
        if (h || d) {
          pError = true;
        }

        // Apply the rules for parsing non-negative integers to the descriptor.
        // If the result is zero, let error be yes. Otherwise, let future-compat-h
        // be the result.
        if (intVal === 0) {
          pError = true;
        } else {
          h = intVal;
        }

        // Anything else, Let error be yes.
      } else {
        pError = true;
      }
    }

    // 15. If error is still no, then append a new image source to candidates whose
    // URL is url, associated with a width width if not absent and a pixel
    // density density if not absent. Otherwise, there is a parse error.
    if (!pError) {
      candidate.source = { value: url, startIndex: startUrlPosition };

      if (w) {
        candidate.width = { value: w };
      }

      if (d) {
        candidate.density = { value: d };
      }

      if (h) {
        candidate.height = { value: h };
      }

      candidates.push(candidate);
    } else {
      throw new Error(
        `Invalid srcset descriptor found in '${input}' at '${desc}'`
      );
    }
  }
}

function parseSrc(input) {
  if (!input) {
    throw new Error('Must be non-empty');
  }

  let startIndex = 0;
  let value = input;

  while (isASCIIWhitespace(value.substring(0, 1))) {
    startIndex += 1;
    value = value.substring(1, value.length);
  }

  while (isASCIIWhitespace(value.substring(value.length - 1, value.length))) {
    value = value.substring(0, value.length - 1);
  }

  if (!value) {
    throw new Error('Must be non-empty');
  }

  return { value, startIndex };
}

function getAttributeValue(attributes, name) {
  const lowercasedAttributes = Object.keys(attributes).reduce((keys, k) => {
    // eslint-disable-next-line no-param-reassign
    keys[k.toLowerCase()] = k;

    return keys;
  }, {});

  return attributes[lowercasedAttributes[name.toLowerCase()]];
}

const defaultAttributes = [
  {
    tag: 'audio',
    attribute: 'src',
    type: 'src',
  },
  {
    tag: 'embed',
    attribute: 'src',
    type: 'src',
  },
  {
    tag: 'img',
    attribute: 'src',
    type: 'src',
  },
  {
    tag: 'img',
    attribute: 'srcset',
    type: 'srcset',
  },
  {
    tag: 'input',
    attribute: 'src',
    type: 'src',
  },
  {
    tag: 'link',
    attribute: 'href',
    type: 'src',
    filter: (tag, attribute, attributes) => {
      if (!/stylesheet/i.test(getAttributeValue(attributes, 'rel'))) {
        return false;
      }

      if (
        attributes.type &&
        getAttributeValue(attributes, 'type').trim().toLowerCase() !==
          'text/css'
      ) {
        return false;
      }

      return true;
    },
  },
  {
    tag: 'object',
    attribute: 'data',
    type: 'src',
  },
  {
    tag: 'script',
    attribute: 'src',
    type: 'src',
  },
  {
    tag: 'source',
    attribute: 'src',
    type: 'src',
  },
  {
    tag: 'source',
    attribute: 'srcset',
    type: 'srcset',
  },
  {
    tag: 'track',
    attribute: 'src',
    type: 'src',
  },
  {
    tag: 'video',
    attribute: 'poster',
    type: 'src',
  },
  {
    tag: 'video',
    attribute: 'src',
    type: 'src',
  },
];

function parseSource(source) {
  const URLObject = parse(source);
  const { hash } = URLObject;

  if (!hash) {
    return { sourceValue: source };
  }

  URLObject.hash = null;

  const sourceWithoutHash = URLObject.format();

  return { sourceValue: sourceWithoutHash, hash };
}

export default (options) =>
  function process(html, result) {
    let attributeList;
    let maybeUrlFilter;
    let root;

    if (
      typeof options.attributes === 'undefined' ||
      options.attributes === true
    ) {
      attributeList = defaultAttributes;
    } else {
      attributeList = options.attributes.list || defaultAttributes;
      // eslint-disable-next-line no-undefined
      ({ urlFilter: maybeUrlFilter, root } = options.attributes);
    }

    const sources = [];
    const urlFilter = getFilter(maybeUrlFilter, (value) =>
      isUrlRequest(value, root)
    );
    const getAttribute = (tag, attribute, attributes, resourcePath) => {
      return attributeList.find(
        (element) =>
          (typeof element.tag === 'undefined' ||
            (typeof element.tag !== 'undefined' &&
              element.tag.toLowerCase() === tag.toLowerCase())) &&
          element.attribute.toLowerCase() === attribute.toLowerCase() &&
          (element.filter
            ? element.filter(tag, attribute, attributes, resourcePath)
            : true)
      );
    };
    const { resourcePath } = options;
    const imports = new Map();
    const getImportItem = (value) => {
      const key = urlToRequest(decodeURIComponent(value), root);

      let name = imports.get(key);

      if (name) {
        return { key, name };
      }

      name = `___HTML_LOADER_IMPORT_${imports.size}___`;
      imports.set(key, name);

      result.messages.push({
        type: 'import',
        value: {
          type: 'source',
          source: key,
          importName: name,
        },
      });

      return { key, name };
    };
    const replacements = new Map();
    const getReplacementItem = (importItem, unquoted, hash) => {
      const key = JSON.stringify({ key: importItem.key, unquoted, hash });

      let name = replacements.get(key);

      if (name) {
        return { key, name };
      }

      name = `___HTML_LOADER_REPLACER_${replacements.size}___`;
      replacements.set(key, name);

      result.messages.push({
        type: 'replacer',
        value: {
          type: 'source',
          hash,
          importName: importItem.name,
          replacerName: name,
          unquoted,
        },
      });

      return { key, name };
    };
    const parser = new Parser(
      {
        attributesMeta: {},
        onattribute(name, value) {
          // eslint-disable-next-line no-underscore-dangle
          const endIndex = parser._tokenizer._index;
          const startIndex = endIndex - value.length;
          const unquoted = html[endIndex] !== '"' && html[endIndex] !== "'";

          this.attributesMeta[name] = { startIndex, unquoted };
        },
        onopentag(tag, attributes) {
          Object.keys(attributes).forEach((attribute) => {
            const value = attributes[attribute];
            const {
              startIndex: valueStartIndex,
              unquoted,
            } = this.attributesMeta[attribute];

            const foundAttribute = getAttribute(
              tag,
              attribute,
              attributes,
              resourcePath
            );

            if (!foundAttribute) {
              return;
            }

            const { type } = foundAttribute;

            // eslint-disable-next-line default-case
            switch (type) {
              case 'src': {
                let source;

                try {
                  source = parseSrc(value);
                } catch (error) {
                  result.messages.push({
                    type: 'error',
                    value: new HtmlSourceError(
                      `Bad value for attribute "${attribute}" on element "${tag}": ${error.message}`,
                      parser.startIndex,
                      parser.endIndex,
                      html
                    ),
                  });

                  return;
                }

                if (!urlFilter(attribute, source.value, resourcePath)) {
                  return;
                }

                const startIndex = valueStartIndex + source.startIndex;
                const { sourceValue, hash } = parseSource(source.value);

                sources.push({
                  startIndex,
                  value: sourceValue,
                  hash,
                  unquoted,
                });

                break;
              }
              case 'srcset': {
                let sourceSet;

                try {
                  sourceSet = parseSrcset(value);
                } catch (error) {
                  result.messages.push({
                    type: 'error',
                    value: new HtmlSourceError(
                      `Bad value for attribute "${attribute}" on element "${tag}": ${error.message}`,
                      parser.startIndex,
                      parser.endIndex,
                      html
                    ),
                  });

                  return;
                }

                sourceSet.forEach((sourceItem) => {
                  const { source } = sourceItem;

                  if (!urlFilter(attribute, source.value, resourcePath)) {
                    return;
                  }

                  const startIndex = valueStartIndex + source.startIndex;
                  const { sourceValue, hash } = parseSource(source.value);

                  sources.push({
                    startIndex,
                    value: sourceValue,
                    hash,
                    unquoted,
                  });
                });

                break;
              }
            }
          });

          this.attributesMeta = {};
        },
        onerror(error) {
          result.messages.push({
            type: 'error',
            value: error,
          });
        },
      },
      {
        decodeEntities: false,
        lowerCaseTags: false,
        lowerCaseAttributeNames: false,
        recognizeCDATA: true,
        recognizeSelfClosing: true,
      }
    );

    parser.write(html);
    parser.end();

    let offset = 0;

    for (const source of sources) {
      const { startIndex, value, unquoted, hash } = source;
      const importItem = getImportItem(value);
      const replacementItem = getReplacementItem(importItem, unquoted, hash);
      const valueLength = hash ? value.length + hash.length : value.length;

      // eslint-disable-next-line no-param-reassign
      html =
        html.substr(0, startIndex + offset) +
        replacementItem.name +
        html.substr(startIndex + valueLength + offset);

      offset += replacementItem.name.length - valueLength;
    }

    return html;
  };
