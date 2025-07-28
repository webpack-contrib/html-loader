import path from "node:path";

import HtmlSourceError from "./HtmlSourceError";

const HORIZONTAL_TAB = "\u0009".charCodeAt(0);
const NEWLINE = "\u000A".charCodeAt(0);
const FORM_FEED = "\u000C".charCodeAt(0);
const CARRIAGE_RETURN = "\u000D".charCodeAt(0);
const SPACE = "\u0020".charCodeAt(0);

function isASCIIWhitespace(character) {
  return (
    // Horizontal tab
    character === HORIZONTAL_TAB ||
    // New line
    character === NEWLINE ||
    // Form feed
    character === FORM_FEED ||
    // Carriage return
    character === CARRIAGE_RETURN ||
    // Space
    character === SPACE
  );
}

// (Don't use \s, to avoid matching non-breaking space)
// eslint-disable-next-line no-control-regex
const regexLeadingSpaces = /^[ \t\n\r\u000C]+/;
// eslint-disable-next-line no-control-regex
const regexLeadingCommasOrSpaces = /^[, \t\n\r\u000C]+/;
// eslint-disable-next-line no-control-regex
const regexLeadingNotSpaces = /^[^ \t\n\r\u000C]+/;
const regexTrailingCommas = /[,]+$/;
const regexNonNegativeInteger = /^\d+$/;
const COMMA = ",".charCodeAt(0);
const LEFT_PARENTHESIS = "(".charCodeAt(0);
const RIGHT_PARENTHESIS = ")".charCodeAt(0);
const SMALL_LETTER_W = "w".charCodeAt(0);
const SMALL_LETTER_X = "x".charCodeAt(0);
const SMALL_LETTER_H = "h".charCodeAt(0);

// ( Positive or negative or unsigned integers or decimals, without or without exponents.
// Must include at least one digit.
// According to spec tests any decimal point must be followed by a digit.
// No leading plus sign is allowed.)
// https://html.spec.whatwg.org/multipage/infrastructure.html#valid-floating-point-number
const regexFloatingPoint = /^-?(?:[0-9]+|[0-9]*\.[0-9]+)(?:[eE][+-]?[0-9]+)?$/;

function isASCIIC0group(character) {
  // C0 and &nbsp;
  // eslint-disable-next-line no-control-regex
  return /^[\u0001-\u0019\u00A0]/.test(character);
}

function c0ControlCodesExclude(source) {
  let { value } = source;

  if (!value) {
    throw new Error("Must be non-empty");
  }

  let start = 0;
  for (; start < value.length && isASCIIC0group(value[start]); start++);

  if (start === value.length) {
    throw new Error("Must be non-empty");
  }

  let end = value.length - 1;
  for (; end > -1 && isASCIIC0group(value[end]); end--);
  end += 1;

  if (start !== 0 || end !== value.length) {
    value = value.slice(start, end);

    if (!value) {
      throw new Error("Must be non-empty");
    }
  }

  return { value, startOffset: source.startOffset + start };
}

export function parseSrcset(input) {
  // 1. Let input be the value passed to this algorithm.
  const inputLength = input.length;

  let url;
  let descriptors;
  let currentDescriptor;
  let state;
  let charCode;
  let position = 0;
  let startOffset;
  const candidates = [];

  function collectCharacters(regEx) {
    let chars;
    const match = regEx.exec(input.slice(Math.max(0, position)));

    if (match) {
      [chars] = match;
      position += chars.length;

      return chars;
    }
  }

  function parseDescriptors() {
    // 9. Descriptor parser: Let error be no.
    let pError = false;

    // 10. Let width be absent.
    // 11. Let density be absent.
    // 12. Let future-compat-h be absent. (We're implementing it now as h)
    let width;
    let density;
    let height;
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

      lastChar = desc[desc.length - 1].charCodeAt(0);
      value = desc.slice(0, Math.max(0, desc.length - 1));
      intVal = Number.parseInt(value, 10);
      floatVal = Number.parseFloat(value);

      // If the descriptor consists of a valid non-negative integer followed by
      // a U+0077 LATIN SMALL LETTER W character
      if (regexNonNegativeInteger.test(value) && lastChar === SMALL_LETTER_W) {
        // If width and density are not both absent, then let error be yes.
        if (width || density) {
          pError = true;
        }

        // Apply the rules for parsing non-negative integers to the descriptor.
        // If the result is zero, let error be yes.
        // Otherwise, let width be the result.
        if (intVal === 0) {
          pError = true;
        } else {
          width = intVal;
        }
      }
      // If the descriptor consists of a valid floating-point number followed by
      // a U+0078 LATIN SMALL LETTER X character
      else if (regexFloatingPoint.test(value) && lastChar === SMALL_LETTER_X) {
        // If width, density and future-compat-h are not all absent, then let error
        // be yes.
        if (width || density || height) {
          pError = true;
        }

        // Apply the rules for parsing floating-point number values to the descriptor.
        // If the result is less than zero, let error be yes. Otherwise, let density
        // be the result.
        if (floatVal < 0) {
          pError = true;
        } else {
          density = floatVal;
        }
      }
      // If the descriptor consists of a valid non-negative integer followed by
      // a U+0068 LATIN SMALL LETTER H character
      else if (
        regexNonNegativeInteger.test(value) &&
        lastChar === SMALL_LETTER_H
      ) {
        // If height and density are not both absent, then let error be yes.
        if (height || density) {
          pError = true;
        }

        // Apply the rules for parsing non-negative integers to the descriptor.
        // If the result is zero, let error be yes. Otherwise, let future-compat-h
        // be the result.
        if (intVal === 0) {
          pError = true;
        } else {
          height = intVal;
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
      candidate.source = { value: url, startOffset };

      if (width) {
        candidate.width = { value: width };
      }

      if (density) {
        candidate.density = { value: density };
      }

      if (height) {
        candidate.height = { value: height };
      }

      candidates.push(candidate);
    } else {
      throw new Error(
        `Invalid srcset descriptor found in '${input}' at '${desc}'`,
      );
    }
  }

  function tokenize() {
    // 8.1. Descriptor tokenizer: Skip whitespace
    collectCharacters(regexLeadingSpaces);

    // 8.2. Let current descriptor be the empty string.
    currentDescriptor = "";

    // 8.3. Let state be in descriptor.
    state = "in descriptor";

    while (true) {
      // 8.4. Let charCode be the character at position.
      charCode = input.charCodeAt(position);

      //  Do the following depending on the value of state.
      //  For the purpose of this step, "EOF" is a special character representing
      //  that position is past the end of input.

      // In descriptor
      if (state === "in descriptor") {
        // Do the following, depending on the value of charCode:

        // Space character
        // If current descriptor is not empty, append current descriptor to
        // descriptors and let current descriptor be the empty string.
        // Set state to after descriptor.
        if (isASCIIWhitespace(charCode)) {
          if (currentDescriptor) {
            descriptors.push(currentDescriptor);
            currentDescriptor = "";
            state = "after descriptor";
          }
        }
        // U+002C COMMA (,)
        // Advance position to the next character in input. If current descriptor
        // is not empty, append current descriptor to descriptors. Jump to the step
        // labeled descriptor parser.
        else if (charCode === COMMA) {
          position += 1;

          if (currentDescriptor) {
            descriptors.push(currentDescriptor);
          }

          parseDescriptors();

          return;
        }
        // U+0028 LEFT PARENTHESIS (()
        // Append charCode to current descriptor. Set state to in parens.
        else if (charCode === LEFT_PARENTHESIS) {
          currentDescriptor += input.charAt(position);
          state = "in parens";
        }
        // EOF
        // If current descriptor is not empty, append current descriptor to
        // descriptors. Jump to the step labeled descriptor parser.
        else if (Number.isNaN(charCode)) {
          if (currentDescriptor) {
            descriptors.push(currentDescriptor);
          }

          parseDescriptors();

          return;

          // Anything else
          // Append charCode to current descriptor.
        } else {
          currentDescriptor += input.charAt(position);
        }
      }
      // In parens
      else if (state === "in parens") {
        // U+0029 RIGHT PARENTHESIS ())
        // Append charCode to current descriptor. Set state to in descriptor.
        if (charCode === RIGHT_PARENTHESIS) {
          currentDescriptor += input.charAt(position);
          state = "in descriptor";
        }
        // EOF
        // Append current descriptor to descriptors. Jump to the step labeled
        // descriptor parser.
        else if (Number.isNaN(charCode)) {
          descriptors.push(currentDescriptor);
          parseDescriptors();
          return;
        }
        // Anything else
        // Append charCode to current descriptor.
        else {
          currentDescriptor += input.charAt(position);
        }
      }
      // After descriptor
      else if (state === "after descriptor") {
        // Do the following, depending on the value of charCode:
        if (isASCIIWhitespace(charCode)) {
          // Space character: Stay in this state.
        }
        // EOF: Jump to the step labeled descriptor parser.
        else if (Number.isNaN(charCode)) {
          parseDescriptors();
          return;
        }
        // Anything else
        // Set state to in descriptor. Set position to the previous character in input.
        else {
          state = "in descriptor";
          position -= 1;
        }
      }

      // Advance position to the next character in input.
      position += 1;
    }
  }

  // 3. Let candidates be an initially empty source set.
  // const candidates = []; // Moved to top

  // 4. Splitting loop: Collect a sequence of characters that are space
  //    characters or U+002C COMMA characters. If any U+002C COMMA characters
  //    were collected, that is a parse error.

  while (true) {
    collectCharacters(regexLeadingCommasOrSpaces);

    // 5. If position is past the end of input, return candidates and abort these steps.
    if (position >= inputLength) {
      if (candidates.length === 0) {
        throw new Error("Must contain one or more image candidate strings");
      }

      // (we're done, this is the sole return path)
      return candidates;
    }

    // 6. Collect a sequence of characters that are not space characters,
    //    and let that be url.
    startOffset = position;
    url = collectCharacters(regexLeadingNotSpaces);

    // 7. Let descriptors be a new empty list.
    descriptors = [];

    // 8. If url ends with a U+002C COMMA character (,), follow these sub steps:
    //		(1). Remove all trailing U+002C COMMA characters from url. If this removed
    //         more than one character, that is a parse error.
    if (url.charCodeAt(url.length - 1) === COMMA) {
      url = url.replace(regexTrailingCommas, "");

      // (Jump ahead to step 9 to skip tokenization and just push the candidate).
      parseDescriptors();
    }
    //	Otherwise, follow these sub steps:
    else {
      tokenize();
    }

    // 16. Return to the step labeled splitting loop.
  }
}

export function parseSrc(input) {
  if (!input) {
    throw new Error("Must be non-empty");
  }

  let start = 0;
  for (
    ;
    start < input.length && isASCIIWhitespace(input.charCodeAt(start));
    start++
  );

  if (start === input.length) {
    throw new Error("Must be non-empty");
  }

  let end = input.length - 1;
  for (; end > -1 && isASCIIWhitespace(input.charCodeAt(end)); end--);
  end += 1;

  let value = input;
  if (start !== 0 || end !== value.length) {
    value = value.slice(start, end);

    if (!value) {
      throw new Error("Must be non-empty");
    }
  }

  return { value, startOffset: start };
}

const WINDOWS_ABS_PATH_REGEXP = /^[a-zA-Z]:[\\/]|^\\\\/;

function isDataUrl(url) {
  if (/^data:/i.test(url)) {
    return true;
  }

  return false;
}

export function isURLRequestable(url, options = {}) {
  // Protocol-relative URLs
  if (/^\/\//.test(url)) {
    return false;
  }

  // `file:` protocol
  if (/^file:/i.test(url)) {
    return true;
  }

  if (isDataUrl(url) && options.isSupportDataURL) {
    try {
      decodeURIComponent(url);
    } catch {
      return false;
    }

    return true;
  }

  if (/^file:/i.test(url)) {
    return true;
  }

  // Absolute URLs
  if (/^[a-z][a-z0-9+.-]*:/i.test(url) && !WINDOWS_ABS_PATH_REGEXP.test(url)) {
    if (/^https?:/i.test(url)) {
      return options.isSupportAbsoluteURL;
    }

    return false;
  }

  // It's some kind of url for a template
  if (/^[{}[\]#*;,'§$%&(=?`´^°<>]/.test(url)) {
    return false;
  }

  return true;
}

const WINDOWS_PATH_SEPARATOR_REGEXP = /\\/g;
const RELATIVE_PATH_REGEXP = /^\.\.?[/\\]/;
const SLASH = "/".charCodeAt(0);

const absoluteToRequest = (context, maybeAbsolutePath) => {
  if (maybeAbsolutePath.charCodeAt(0) === SLASH) {
    if (
      maybeAbsolutePath.length > 1 &&
      maybeAbsolutePath.charCodeAt(maybeAbsolutePath.length - 1) === SLASH
    ) {
      // this 'path' is actually a regexp generated by dynamic requires.
      // Don't treat it as an absolute path.
      return maybeAbsolutePath;
    }

    const querySplitPos = maybeAbsolutePath.indexOf("?");

    let resource =
      querySplitPos === -1
        ? maybeAbsolutePath
        : maybeAbsolutePath.slice(0, querySplitPos);
    resource = path.posix.relative(context, resource);

    if (!resource.startsWith("../")) {
      resource = `./${resource}`;
    }

    return querySplitPos === -1
      ? resource
      : resource + maybeAbsolutePath.slice(querySplitPos);
  }

  if (WINDOWS_ABS_PATH_REGEXP.test(maybeAbsolutePath)) {
    const querySplitPos = maybeAbsolutePath.indexOf("?");
    let resource =
      querySplitPos === -1
        ? maybeAbsolutePath
        : maybeAbsolutePath.slice(0, querySplitPos);

    resource = path.win32.relative(context, resource);

    if (!WINDOWS_ABS_PATH_REGEXP.test(resource)) {
      resource = resource.replaceAll(WINDOWS_PATH_SEPARATOR_REGEXP, "/");

      if (!resource.startsWith("../")) {
        resource = `./${resource}`;
      }
    }

    return querySplitPos === -1
      ? resource
      : resource + maybeAbsolutePath.slice(querySplitPos);
  }

  if (!RELATIVE_PATH_REGEXP.test(maybeAbsolutePath)) {
    return `./${maybeAbsolutePath.replaceAll(WINDOWS_PATH_SEPARATOR_REGEXP, "/")}`;
  }

  // not an absolute path
  return maybeAbsolutePath;
};

const contextify = (context, request) =>
  request
    .split("!")
    .map((r) => absoluteToRequest(context, r))
    .join("!");

const MODULE_REQUEST_REGEXP = /^[^?]*~/;

export function requestify(context, request) {
  const isWindowsAbsolutePath = WINDOWS_ABS_PATH_REGEXP.test(request);
  const newRequest = isWindowsAbsolutePath
    ? decodeURI(request).replaceAll(/[\t\n\r]/g, "")
    : decodeURI(request)
        .replaceAll(/[\t\n\r]/g, "")
        .replaceAll("\\", "/");

  if (isWindowsAbsolutePath || newRequest.charCodeAt(0) === SLASH) {
    return newRequest;
  }

  if (/^[a-z]+:/i.test(newRequest)) {
    return newRequest;
  }

  // A `~` makes the url an module
  if (MODULE_REQUEST_REGEXP.test(newRequest)) {
    return newRequest.replace(MODULE_REQUEST_REGEXP, "");
  }

  // every other url is threaded like a relative url
  return contextify(context, newRequest);
}

function isProductionMode(loaderContext) {
  return loaderContext.mode === "production" || !loaderContext.mode;
}

export const defaultMinimizerOptions = {
  caseSensitive: true,
  // `collapseBooleanAttributes` is not always safe, since this can break CSS attribute selectors and not safe for XHTML
  collapseWhitespace: true,
  conservativeCollapse: true,
  keepClosingSlash: true,
  // We need ability to use cssnano, or setup own function without extra dependencies
  minifyCSS: true,
  minifyJS: true,
  // `minifyURLs` is unsafe, because we can't guarantee what the base URL is
  // `removeAttributeQuotes` is not safe in some rare cases, also HTML spec recommends against doing this
  removeComments: true,
  // `removeEmptyAttributes` is not safe, can affect certain style or script behavior, look at https://github.com/webpack-contrib/html-loader/issues/323
  // `removeRedundantAttributes` is not safe, can affect certain style or script behavior, look at https://github.com/webpack-contrib/html-loader/issues/323
  removeScriptTypeAttributes: true,
  removeStyleLinkTypeAttributes: true,
  // `useShortDoctype` is not safe for XHTML
};

function getMinimizeOption(rawOptions, loaderContext) {
  if (typeof rawOptions.minimize === "undefined") {
    return isProductionMode(loaderContext) ? defaultMinimizerOptions : false;
  }

  if (typeof rawOptions.minimize === "boolean") {
    return rawOptions.minimize === true ? defaultMinimizerOptions : false;
  }

  return rawOptions.minimize;
}

function getAttributeValue(attributes, name) {
  const result = attributes.find((i) => i.name.toLowerCase() === name);

  return typeof result === "undefined" ? result : result.value;
}

function scriptSrcFilter(tag, attribute, attributes) {
  let type = getAttributeValue(attributes, "type");

  if (!type) {
    return true;
  }

  type = type.trim();

  if (!type) {
    return false;
  }

  if (
    type !== "module" &&
    type !== "text/javascript" &&
    type !== "application/javascript"
  ) {
    return false;
  }

  return true;
}

function linkHrefFilter(tag, attribute, attributes) {
  let rel = getAttributeValue(attributes, "rel");

  if (!rel) {
    return false;
  }

  rel = rel.trim();

  if (!rel) {
    return false;
  }

  rel = rel.toLowerCase();

  const usedRels = rel.split(" ").filter(Boolean);
  const allowedRels = [
    "stylesheet",
    "icon",
    "mask-icon",
    "apple-touch-icon",
    "apple-touch-icon-precomposed",
    "apple-touch-startup-image",
    "manifest",
    "prefetch",
    "preload",
  ];

  return allowedRels.some((value) => usedRels.includes(value));
}

const META = new Map([
  [
    "name",
    new Set([
      // msapplication-TileImage
      "msapplication-tileimage",
      "msapplication-square70x70logo",
      "msapplication-square150x150logo",
      "msapplication-wide310x150logo",
      "msapplication-square310x310logo",
      "msapplication-config",
      "msapplication-task",
      "twitter:image",
    ]),
  ],
  [
    "property",
    new Set([
      "og:image",
      "og:image:url",
      "og:image:secure_url",
      "og:audio",
      "og:audio:secure_url",
      "og:video",
      "og:video:secure_url",
      "vk:image",
    ]),
  ],
  [
    "itemprop",
    new Set([
      "image",
      "logo",
      "screenshot",
      "thumbnailurl",
      "contenturl",
      "downloadurl",
      "duringmedia",
      "embedurl",
      "installurl",
      "layoutimage",
    ]),
  ],
]);

function linkItempropFilter(tag, attribute, attributes) {
  let name = getAttributeValue(attributes, "itemprop");

  if (name) {
    name = name.trim();

    if (!name) {
      return false;
    }

    name = name.toLowerCase();

    return META.get("itemprop").has(name);
  }

  return false;
}

function linkUnionFilter(tag, attribute, attributes) {
  return (
    linkHrefFilter(tag, attribute, attributes) ||
    linkItempropFilter(tag, attribute, attributes)
  );
}

function metaContentFilter(tag, attribute, attributes) {
  for (const item of META) {
    const [key, allowedNames] = item;

    let name = getAttributeValue(attributes, key);

    if (name) {
      name = name.trim();

      if (!name) {
        continue;
      }

      name = name.toLowerCase();

      return allowedNames.has(name);
    }
  }

  return false;
}

export function srcType(options) {
  let source;

  try {
    source = parseSrc(options.value);
  } catch (error) {
    throw new HtmlSourceError(
      `Bad value for attribute "${options.attribute}" on element "${options.tag}": ${error.message}`,
      options.attributeStartOffset,
      options.attributeEndOffset,
      options.html,
    );
  }

  try {
    source = c0ControlCodesExclude(source);
  } catch (error) {
    throw new HtmlSourceError(
      `Bad value for attribute "${options.attribute}" on element "${options.tag}": ${error.message}`,
      options.attributeStartOffset,
      options.attributeEndOffset,
      options.html,
    );
  }

  if (
    !isURLRequestable(source.value, {
      isSupportDataURL: options.isSupportDataURL,
      isSupportAbsoluteURL: options.isSupportAbsoluteURL,
    })
  ) {
    return [];
  }

  const startOffset = options.valueStartOffset + source.startOffset;
  const endOffset = startOffset + source.value.length;

  return [{ value: source.value, startOffset, endOffset }];
}

export function srcsetType(options) {
  let sourceSet;

  try {
    sourceSet = parseSrcset(options.value);
  } catch (error) {
    throw new HtmlSourceError(
      `Bad value for attribute "${options.attribute}" on element "${options.tag}": ${error.message}`,
      options.attributeStartOffset,
      options.attributeEndOffset,
      options.html,
    );
  }

  const result = [];

  for (const sourceItem of sourceSet) {
    let { source } = sourceItem;

    try {
      source = c0ControlCodesExclude(source);
    } catch (error) {
      throw new HtmlSourceError(
        `Bad value for attribute "${options.attribute}" on element "${options.tag}": ${error.message}`,
        options.attributeStartOffset,
        options.attributeEndOffset,
        options.html,
      );
    }

    if (
      !isURLRequestable(source.value, {
        isSupportDataURL: options.isSupportDataURL,
        isSupportAbsoluteURL: options.isSupportAbsoluteURL,
      })
    ) {
      continue;
    }

    const startOffset = options.valueStartOffset + source.startOffset;
    const endOffset = startOffset + source.value.length;

    result.push({ value: source.value, startOffset, endOffset });
  }

  return result;
}

function metaContentType(options) {
  const isMsapplicationTask = options.attributes.find(
    (i) =>
      i.name.toLowerCase() === "name" &&
      i.value.toLowerCase() === "msapplication-task",
  );

  if (isMsapplicationTask) {
    let startOffset = options.valueStartOffset;
    let endOffset = options.valueStartOffset;
    let value;

    const parts = options.value.split(";");

    for (const [index, part] of parts.entries()) {
      const isLastIteration = index === parts.length - 1;

      if (/^icon-uri/i.test(part.trim())) {
        const [name, src] = part.split("=");

        startOffset += name.length + 1;

        let source;

        try {
          source = parseSrc(src);
        } catch (error) {
          throw new HtmlSourceError(
            `Bad value for attribute "icon-uri" on element "${options.tag}": ${error.message}`,
            options.attributeStartOffset,
            options.attributeEndOffset,
            options.html,
          );
        }

        try {
          source = c0ControlCodesExclude(source);
        } catch (error) {
          throw new HtmlSourceError(
            `Bad value for attribute "icon-uri" on element "${options.tag}": ${error.message}`,
            options.attributeStartOffset,
            options.attributeEndOffset,
            options.html,
          );
        }

        ({ value } = source);
        startOffset += source.startOffset;
        endOffset = startOffset + value.length;

        break;
      }

      // +1 because of ";"
      startOffset += part.length + (isLastIteration ? 0 : 1);
    }

    if (!value) {
      return [];
    }

    return [{ startOffset, endOffset, value }];
  }

  return srcType(options);
}

const defaultSources = new Map([
  [
    "audio",
    new Map([
      [
        "src",
        {
          type: srcType,
        },
      ],
    ]),
  ],
  [
    "embed",
    new Map([
      [
        "src",
        {
          type: srcType,
        },
      ],
    ]),
  ],
  [
    "img",
    new Map([
      [
        "src",
        {
          type: srcType,
        },
      ],
      [
        "srcset",
        {
          type: srcsetType,
        },
      ],
    ]),
  ],
  [
    "input",
    new Map([
      [
        "src",
        {
          type: srcType,
        },
      ],
    ]),
  ],
  [
    "link",
    new Map([
      [
        "href",
        {
          type: srcType,
          filter: linkUnionFilter,
        },
      ],
      [
        "imagesrcset",
        {
          type: srcsetType,
          filter: linkHrefFilter,
        },
      ],
    ]),
  ],
  [
    "meta",
    new Map([
      [
        "content",
        {
          type: metaContentType,
          filter: metaContentFilter,
        },
      ],
    ]),
  ],
  [
    "object",
    new Map([
      [
        "data",
        {
          type: srcType,
        },
      ],
    ]),
  ],
  [
    "script",
    new Map([
      [
        "src",
        {
          type: srcType,
          filter: scriptSrcFilter,
        },
      ],
      // Using href with <script> is described here: https://developer.mozilla.org/en-US/docs/Web/SVG/Element/script
      [
        "href",
        {
          type: srcType,
          filter: scriptSrcFilter,
        },
      ],
      [
        "xlink:href",
        {
          type: srcType,
          filter: scriptSrcFilter,
        },
      ],
    ]),
  ],
  [
    "source",
    new Map([
      [
        "src",
        {
          type: srcType,
        },
      ],
      [
        "srcset",
        {
          type: srcsetType,
        },
      ],
    ]),
  ],
  [
    "track",
    new Map([
      [
        "src",
        {
          type: srcType,
        },
      ],
    ]),
  ],
  [
    "video",
    new Map([
      [
        "poster",
        {
          type: srcType,
        },
      ],
      [
        "src",
        {
          type: srcType,
        },
      ],
    ]),
  ],
  // SVG
  [
    "image",
    new Map([
      [
        "xlink:href",
        {
          type: srcType,
        },
      ],
      [
        "href",
        {
          type: srcType,
        },
      ],
    ]),
  ],
  [
    "use",
    new Map([
      [
        "xlink:href",
        {
          type: srcType,
        },
      ],
      [
        "href",
        {
          type: srcType,
        },
      ],
    ]),
  ],
  // [
  //   'webpack-import',
  //   new Map([
  //     [
  //       'src',
  //       {
  //         type: webpackImportType,
  //       },
  //     ],
  //   ]),
  // ],
]);

function normalizeSourcesList(sources) {
  if (typeof sources === "undefined") {
    return defaultSources;
  }

  const result = new Map();

  for (const source of sources) {
    if (source === "...") {
      for (const [tag, attributes] of defaultSources.entries()) {
        const existingAttributes = result.get(tag);

        if (existingAttributes) {
          for (const [k, v] of attributes) existingAttributes.set(k, v);
        } else {
          result.set(tag, new Map(attributes));
        }
      }

      continue;
    }

    let { tag = "*", attribute = "*" } = source;

    tag = tag.toLowerCase();
    attribute = attribute.toLowerCase();

    let typeFn;

    switch (source.type) {
      case "src":
        typeFn = srcType;
        break;
      case "srcset":
        typeFn = srcsetType;
        break;
    }

    let attrMap = result.get(tag);

    if (!attrMap) {
      attrMap = new Map();
      result.set(tag, attrMap);
    }

    attrMap.set(attribute, {
      type: typeFn,
      filter: source.filter,
    });
  }

  return result;
}

function getSourcesOption(rawOptions) {
  if (typeof rawOptions.sources === "undefined") {
    return { list: normalizeSourcesList() };
  }

  if (typeof rawOptions.sources === "boolean") {
    return rawOptions.sources === true
      ? { list: normalizeSourcesList() }
      : false;
  }

  const sources = normalizeSourcesList(rawOptions.sources.list);

  return {
    list: sources,
    urlFilter: rawOptions.sources.urlFilter,
    scriptingEnabled:
      typeof rawOptions.sources.scriptingEnabled === "undefined"
        ? true
        : rawOptions.sources.scriptingEnabled,
  };
}

export function normalizeOptions(rawOptions, loaderContext) {
  return {
    preprocessor: rawOptions.preprocessor,
    postprocessor: rawOptions.postprocessor,
    sources: getSourcesOption(rawOptions),
    minimize: getMinimizeOption(rawOptions, loaderContext),
    esModule:
      typeof rawOptions.esModule === "undefined" ? true : rawOptions.esModule,
  };
}

export function pluginRunner(plugins) {
  return {
    async process(content) {
      const result = {};

      for (const plugin of plugins) {
        content = await plugin(content, result);
      }

      result.html = content;

      return result;
    },
  };
}

export function getFilter(filter) {
  return (attribute, value, resourcePath) => {
    if (typeof filter === "function") {
      return filter(attribute, value, resourcePath);
    }

    return true;
  };
}

export function getImportCode(html, imports, options) {
  if (imports.length === 0) {
    return "";
  }

  let code = "";

  for (const item of imports) {
    const { importName, request } = item;

    code += options.esModule
      ? `var ${importName} = new URL(${JSON.stringify(
          request,
        )}, import.meta.url);\n`
      : `var ${importName} = require(${JSON.stringify(request)});\n`;
  }

  return `// Imports\n${code}`;
}

const BACKSLASH = "\\".charCodeAt(0);
const BACKTICK = "`".charCodeAt(0);
const DOLLAR = "$".charCodeAt(0);

export function convertToTemplateLiteral(str) {
  let escapedString = "";

  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);

    escapedString +=
      code === BACKSLASH || code === BACKTICK || code === DOLLAR
        ? `\\${str[i]}`
        : str[i];
  }

  return `\`${escapedString}\``;
}

const GET_SOURCE_FROM_IMPORT_NAME = "___HTML_LOADER_GET_SOURCE_FROM_IMPORT___";

export function getModuleCode(html, replacements, loaderContext, options) {
  let code = html;

  const { isTemplateLiteralSupported } = options;

  let needHelperImport = false;

  for (const item of replacements) {
    const { importName, replacementName, isValueQuoted, hash } = item;

    if (!isValueQuoted && !needHelperImport) {
      needHelperImport = true;
    }

    const name = !isValueQuoted
      ? `${GET_SOURCE_FROM_IMPORT_NAME}(${importName}${!isValueQuoted ? ", true" : ""})`
      : importName;

    code = code.replaceAll(new RegExp(replacementName, "g"), () =>
      isTemplateLiteralSupported
        ? `\${${name}}${typeof hash !== "undefined" ? hash : ""}`
        : `" + ${name}${typeof hash !== "undefined" ? ` + ${JSON.stringify(hash)}` : ""} + "`,
    );
  }

  // Replaces "<script>" or "</script>" to "<" + "script>" or "<" + "/script>".
  code = code.replaceAll(/<(\/\?script)/g, (_, scriptTag) =>
    isTemplateLiteralSupported ? `\${"<${scriptTag}"}` : `<" + "${scriptTag}`,
  );

  code = `// Module\nvar code = ${code};\n`;

  if (needHelperImport) {
    // TODO simplify in the next major release
    const getURLRuntime = require.resolve("./runtime/getUrl.js");
    const context = loaderContext.context || loaderContext.rootContext;
    const fileURLToHelper =
      typeof loaderContext.utils !== "undefined" &&
      typeof loaderContext.utils.contextify === "function"
        ? loaderContext.utils.contextify(context, getURLRuntime)
        : contextify(context, getURLRuntime);
    code = options.esModule
      ? `import ${GET_SOURCE_FROM_IMPORT_NAME} from "${fileURLToHelper}";\n${code}`
      : `var ${GET_SOURCE_FROM_IMPORT_NAME} = require("${fileURLToHelper}");\n${code}`;
  }

  return code;
}

export function getExportCode(html, options) {
  if (options.esModule) {
    return "// Exports\nexport default code;";
  }

  return "// Exports\nmodule.exports = code;";
}

export function traverse(root, callback) {
  const visit = (node, parent) => {
    let res;

    if (callback) {
      res = callback(node, parent);
    }

    let { childNodes } = node;

    // in case a <template> tag is in the middle of the HTML: https://github.com/JPeer264/node-rcs-core/issues/58
    if (node.content && Array.isArray(node.content.childNodes)) {
      ({ childNodes } = node.content);
    }

    if (res !== false && Array.isArray(childNodes) && childNodes.length >= 0) {
      for (const child of childNodes) {
        visit(child, node);
      }
    }
  };

  visit(root, null);
}

export function supportTemplateLiteral(loaderContext) {
  if (loaderContext.environment && loaderContext.environment.templateLiteral) {
    return true;
  }

  // TODO remove in the next major release
  if (
    loaderContext._compilation &&
    loaderContext._compilation.options &&
    loaderContext._compilation.options.output &&
    loaderContext._compilation.options.output.environment &&
    loaderContext._compilation.options.output.environment.templateLiteral
  ) {
    return true;
  }

  return false;
}

export const webpackIgnoreCommentRegexp = /webpackIgnore:(\s+)?(true|false)/;
