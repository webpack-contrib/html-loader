import { parse } from 'url';

import { Parser } from 'htmlparser2';
import { isUrlRequest, urlToRequest } from 'loader-utils';

import HtmlSourceError from '../HtmlSourceError';
import { getFilter, parseSrc, parseSrcset } from '../utils';

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
    filter: (tag, attribute, attributes) => {
      if (attributes.type) {
        const type = getAttributeValue(attributes, 'type').trim().toLowerCase();

        if (
          type !== 'module' &&
          type !== 'text/javascript' &&
          type !== 'application/javascript'
        ) {
          return false;
        }
      }

      return true;
    },
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
  // SVG
  {
    tag: 'image',
    attribute: 'xlink:href',
    type: 'src',
  },
  {
    tag: 'image',
    attribute: 'href',
    type: 'src',
  },
  {
    tag: 'use',
    attribute: 'xlink:href',
    type: 'src',
  },
  {
    tag: 'use',
    attribute: 'href',
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
  function process(html) {
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
      return attributeList.find((element) => {
        const foundTag =
          typeof element.tag === 'undefined' ||
          (typeof element.tag !== 'undefined' &&
            element.tag.toLowerCase() === tag.toLowerCase());
        const foundAttribute =
          element.attribute.toLowerCase() === attribute.toLowerCase();
        const isNotFiltered = element.filter
          ? element.filter(tag, attribute, attributes, resourcePath)
          : true;

        return foundTag && foundAttribute && isNotFiltered;
      });
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

      options.imports.push({ importName: name, source: key });

      return { key, name };
    };
    const replacements = new Map();
    const getReplacementItem = (importItem, unquoted, hash) => {
      const key = JSON.stringify({ key: importItem.key, unquoted, hash });

      let name = replacements.get(key);

      if (name) {
        return { key, name };
      }

      name = `___HTML_LOADER_REPLACEMENT_${replacements.size}___`;
      replacements.set(key, name);

      options.replacements.push({
        replacementName: name,
        importName: importItem.name,
        hash,
        unquoted,
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
                  options.errors.push(
                    new HtmlSourceError(
                      `Bad value for attribute "${attribute}" on element "${tag}": ${error.message}`,
                      parser.startIndex,
                      parser.endIndex,
                      html
                    )
                  );

                  return;
                }

                if (!urlFilter(attribute, source.value, resourcePath)) {
                  return;
                }

                const { sourceValue, hash } = parseSource(source.value);
                const importItem = getImportItem(sourceValue);
                const replacementItem = getReplacementItem(
                  importItem,
                  unquoted,
                  hash
                );
                const startIndex = valueStartIndex + source.startIndex;
                const endIndex = startIndex + source.value.length;

                sources.push({ replacementItem, startIndex, endIndex });

                break;
              }
              case 'srcset': {
                let sourceSet;

                try {
                  sourceSet = parseSrcset(value);
                } catch (error) {
                  options.errors.push(
                    new HtmlSourceError(
                      `Bad value for attribute "${attribute}" on element "${tag}": ${error.message}`,
                      parser.startIndex,
                      parser.endIndex,
                      html
                    )
                  );

                  return;
                }

                sourceSet.forEach((sourceItem) => {
                  const { source } = sourceItem;

                  if (!urlFilter(attribute, source.value, resourcePath)) {
                    return;
                  }

                  const { sourceValue, hash } = parseSource(source.value);
                  const importItem = getImportItem(sourceValue);
                  const replacementItem = getReplacementItem(
                    importItem,
                    unquoted,
                    hash
                  );
                  const startIndex = valueStartIndex + source.startIndex;
                  const endIndex = startIndex + source.value.length;

                  sources.push({ replacementItem, startIndex, endIndex });
                });

                break;
              }
              case 'include': {
                let source;

                try {
                  source = parseSrc(value);
                } catch (error) {
                  options.errors.push(
                    new HtmlSourceError(
                      `Bad value for attribute "${attribute}" on element "${tag}": ${error.message}`,
                      parser.startIndex,
                      parser.endIndex,
                      html
                    )
                  );

                  return;
                }

                if (!urlFilter(attribute, source.value, resourcePath)) {
                  return;
                }

                const { startIndex, endIndex } = parser;
                const importItem = getImportItem(source.value);
                const replacementItem = getReplacementItem(importItem);

                sources.push({
                  replacementItem,
                  startIndex,
                  endIndex: endIndex + 1,
                });

                break;
              }
            }
          });

          this.attributesMeta = {};
        },
        onerror(error) {
          options.errors.push(error);
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
      const { startIndex, endIndex, replacementItem } = source;

      // eslint-disable-next-line no-param-reassign
      html =
        html.slice(0, startIndex + offset) +
        replacementItem.name +
        html.slice(endIndex + offset);

      offset += startIndex + replacementItem.name.length - endIndex;
    }

    return html;
  };
