import path from "path";

import HtmlSourceError from "./HtmlSourceError";

function isASCIIWhitespace(character) {
  return (
    // Horizontal tab
    character === "\u0009" ||
    // New line
    character === "\u000A" ||
    // Form feed
    character === "\u000C" ||
    // Carriage return
    character === "\u000D" ||
    // Space
    character === "\u0020"
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

export function parseSrcset(input) {
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
  let startOffset;

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
    if (url.slice(-1) === ",") {
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

  /**
   * Tokenizes descriptor properties prior to parsing
   * Returns undefined.
   */
  function tokenize() {
    // 8.1. Descriptor tokenizer: Skip whitespace
    collectCharacters(regexLeadingSpaces);

    // 8.2. Let current descriptor be the empty string.
    currentDescriptor = "";

    // 8.3. Let state be in descriptor.
    state = "in descriptor";

    // eslint-disable-next-line no-constant-condition
    while (true) {
      // 8.4. Let c be the character at position.
      c = input.charAt(position);

      //  Do the following depending on the value of state.
      //  For the purpose of this step, "EOF" is a special character representing
      //  that position is past the end of input.

      // In descriptor
      if (state === "in descriptor") {
        // Do the following, depending on the value of c:

        // Space character
        // If current descriptor is not empty, append current descriptor to
        // descriptors and let current descriptor be the empty string.
        // Set state to after descriptor.
        if (isASCIIWhitespace(c)) {
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
        else if (c === ",") {
          position += 1;

          if (currentDescriptor) {
            descriptors.push(currentDescriptor);
          }

          parseDescriptors();

          return;
        }
        // U+0028 LEFT PARENTHESIS (()
        // Append c to current descriptor. Set state to in parens.
        else if (c === "\u0028") {
          currentDescriptor += c;
          state = "in parens";
        }
        // EOF
        // If current descriptor is not empty, append current descriptor to
        // descriptors. Jump to the step labeled descriptor parser.
        else if (c === "") {
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
      else if (state === "in parens") {
        // U+0029 RIGHT PARENTHESIS ())
        // Append c to current descriptor. Set state to in descriptor.
        if (c === ")") {
          currentDescriptor += c;
          state = "in descriptor";
        }
        // EOF
        // Append current descriptor to descriptors. Jump to the step labeled
        // descriptor parser.
        else if (c === "") {
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
      else if (state === "after descriptor") {
        // Do the following, depending on the value of c:
        if (isASCIIWhitespace(c)) {
          // Space character: Stay in this state.
        }
        // EOF: Jump to the step labeled descriptor parser.
        else if (c === "") {
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
      if (regexNonNegativeInteger.test(value) && lastChar === "w") {
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
      else if (regexFloatingPoint.test(value) && lastChar === "x") {
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
      else if (regexNonNegativeInteger.test(value) && lastChar === "h") {
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
      candidate.source = { value: url, startOffset };

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

export function parseSrc(input) {
  if (!input) {
    throw new Error("Must be non-empty");
  }

  let start = 0;
  for (; start < input.length && isASCIIWhitespace(input[start]); start++);

  if (start === input.length) {
    throw new Error("Must be non-empty");
  }

  let end = input.length - 1;
  for (; end > -1 && isASCIIWhitespace(input[end]); end--);
  end += 1;

  let value = input;
  if (start !== 0 || end !== value.length) {
    value = value.substring(start, end);

    if (!value) {
      throw new Error("Must be non-empty");
    }
  }

  return { value, startOffset: start };
}

const WINDOWS_ABS_PATH_REGEXP = /^[a-zA-Z]:[\\/]|^\\\\/;

export function isUrlRequestable(url) {
  // Protocol-relative URLs
  if (/^\/\//.test(url)) {
    return false;
  }

  // `file:` protocol
  if (/^file:/i.test(url)) {
    return true;
  }

  // Absolute URLs
  if (/^[a-z][a-z0-9+.-]*:/i.test(url) && !WINDOWS_ABS_PATH_REGEXP.test(url)) {
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

const absoluteToRequest = (context, maybeAbsolutePath) => {
  if (maybeAbsolutePath[0] === "/") {
    if (
      maybeAbsolutePath.length > 1 &&
      maybeAbsolutePath[maybeAbsolutePath.length - 1] === "/"
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
      resource = resource.replace(WINDOWS_PATH_SEPARATOR_REGEXP, "/");

      if (!resource.startsWith("../")) {
        resource = `./${resource}`;
      }
    }

    return querySplitPos === -1
      ? resource
      : resource + maybeAbsolutePath.slice(querySplitPos);
  }

  if (!RELATIVE_PATH_REGEXP.test(maybeAbsolutePath)) {
    return `./${maybeAbsolutePath.replace(WINDOWS_PATH_SEPARATOR_REGEXP, "/")}`;
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
    ? decodeURI(request).replace(/[\t\n\r]/g, "")
    : decodeURI(request)
        .replace(/[\t\n\r]/g, "")
        .replace(/\\/g, "/");

  if (isWindowsAbsolutePath || newRequest[0] === "/") {
    return newRequest;
  }

  if (/^file:/i.test(newRequest)) {
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
  const [result] = attributes.filter((i) => i.name.toLowerCase() === name);

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
        // eslint-disable-next-line no-continue
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
      options.html
    );
  }

  try {
    source = c0ControlCodesExclude(source);
  } catch (error) {
    throw new HtmlSourceError(
      `Bad value for attribute "${options.attribute}" on element "${options.tag}": ${error.message}`,
      options.attributeStartOffset,
      options.attributeEndOffset,
      options.html
    );
  }

  if (!isUrlRequestable(source.value)) {
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
      options.html
    );
  }

  const result = [];

  sourceSet.forEach((sourceItem) => {
    let { source } = sourceItem;

    try {
      source = c0ControlCodesExclude(source);
    } catch (error) {
      throw new HtmlSourceError(
        `Bad value for attribute "${options.attribute}" on element "${options.tag}": ${error.message}`,
        options.attributeStartOffset,
        options.attributeEndOffset,
        options.html
      );
    }

    if (!isUrlRequestable(source.value)) {
      return false;
    }

    const startOffset = options.valueStartOffset + source.startOffset;
    const endOffset = startOffset + source.value.length;

    result.push({ value: source.value, startOffset, endOffset });

    return false;
  });

  return result;
}

function metaContentType(options) {
  const isMsapplicationTask = options.attributes.find(
    (i) =>
      i.name.toLowerCase() === "name" &&
      i.value.toLowerCase() === "msapplication-task"
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
            options.html
          );
        }

        try {
          source = c0ControlCodesExclude(source);
        } catch (error) {
          throw new HtmlSourceError(
            `Bad value for attribute "icon-uri" on element "${options.tag}": ${error.message}`,
            options.attributeStartOffset,
            options.attributeEndOffset,
            options.html
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

// function webpackImportType(options) {
//   let source;
//
//   try {
//     source = trimASCIIWhitespace(options.value);
//   } catch (error) {
//     throw new HtmlSourceError(
//       `Bad value for attribute "${options.attribute}" on element "${options.tag}": ${error.message}`,
//       options.attributeStartOffset,
//       options.attributeEndOffset,
//       options.html
//     );
//   }
//
//   try {
//     source = c0ControlCodesExclude(source);
//   } catch (error) {
//     throw new HtmlSourceError(
//       `Bad value for attribute "${options.attribute}" on element "${options.tag}": ${error.message}`,
//       options.attributeStartOffset,
//       options.attributeEndOffset,
//       options.html
//     );
//   }
//
//   if (!isUrlRequestable(source.value)) {
//     return [];
//   }
//
//   const { startOffset } = options.startTag;
//   let { endOffset } = options.startTag;
//
//   if (options.endTag) {
//     ({ endOffset } = options.endTag);
//   }
//
//   return [
//     {
//       format: 'import',
//       runtime: false,
//       value: source.value,
//       startOffset,
//       endOffset,
//     },
//   ];
// }

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
          attributes.forEach(([k, v]) => existingAttributes.set(k, v));
        } else {
          result.set(tag, new Map(attributes));
        }
      }

      // eslint-disable-next-line no-continue
      continue;
    }

    let { tag = "*", attribute = "*" } = source;

    tag = tag.toLowerCase();
    attribute = attribute.toLowerCase();

    let typeFn;

    // eslint-disable-next-line default-case
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
        // eslint-disable-next-line no-param-reassign, no-await-in-loop
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

const GET_SOURCE_FROM_IMPORT_NAME = "___HTML_LOADER_GET_SOURCE_FROM_IMPORT___";

export function getImportCode(html, loaderContext, imports, options) {
  if (imports.length === 0) {
    return "";
  }

  // TODO simplify in the next major release
  const getURLRuntime = require.resolve("./runtime/getUrl.js");
  const context = loaderContext.context || loaderContext.rootContext;
  const fileURLToHelper =
    typeof loaderContext.utils !== "undefined" &&
    typeof loaderContext.utils.contextify === "function"
      ? loaderContext.utils.contextify(context, getURLRuntime)
      : contextify(context, getURLRuntime);

  let code = options.esModule
    ? `import ${GET_SOURCE_FROM_IMPORT_NAME} from "${fileURLToHelper}";\n`
    : `var ${GET_SOURCE_FROM_IMPORT_NAME} = require("${fileURLToHelper}");\n`;

  for (const item of imports) {
    const { format, importName, request } = item;

    switch (format) {
      case "import":
        code += options.esModule
          ? `import ${importName} from ${JSON.stringify(request)};\n`
          : `var ${importName} = require(${JSON.stringify(request)});\n`;
        break;
      case "url":
      default:
        code += options.esModule
          ? `var ${importName} = new URL(${JSON.stringify(
              request
            )}, import.meta.url);\n`
          : `var ${importName} = require(${JSON.stringify(request)});\n`;
    }
  }

  return `// Imports\n${code}`;
}

export function getModuleCode(html, replacements) {
  let code = JSON.stringify(html)
    // Invalid in JavaScript but valid HTML
    .replace(/[\u2028\u2029]/g, (str) =>
      str === "\u2029" ? "\\u2029" : "\\u2028"
    );

  let replacersCode = "";

  for (const item of replacements) {
    const { runtime, importName, replacementName, isValueQuoted, hash } = item;

    if (typeof runtime === "undefined" || runtime === true) {
      const getUrlOptions = []
        .concat(hash ? [`hash: ${JSON.stringify(hash)}`] : [])
        .concat(isValueQuoted ? [] : "maybeNeedQuotes: true");
      const preparedOptions =
        getUrlOptions.length > 0 ? `, { ${getUrlOptions.join(", ")} }` : "";

      replacersCode += `var ${replacementName} = ${GET_SOURCE_FROM_IMPORT_NAME}(${importName}${preparedOptions});\n`;

      code = code.replace(
        new RegExp(replacementName, "g"),
        () => `" + ${replacementName} + "`
      );
    } else {
      code = code.replace(
        new RegExp(replacementName, "g"),
        () => `" + ${importName} + "`
      );
    }
  }

  // Replaces "<script>" or "</script>" to "<" + "script>" or "<" + "/script>".
  code = code.replace(/<(\/?script)/g, (_, s) => `<" + "${s}`);

  return `// Module\n${replacersCode}var code = ${code};\n`;
}

export function getExportCode(html, options) {
  if (options.esModule) {
    return `// Exports\nexport default code;`;
  }

  return `// Exports\nmodule.exports = code;`;
}

function isASCIIC0group(character) {
  // C0 and &nbsp;
  // eslint-disable-next-line no-control-regex
  return /^[\u0001-\u0019\u00a0]/.test(character);
}

export function c0ControlCodesExclude(source) {
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
    value = value.substring(start, end);

    if (!value) {
      throw new Error("Must be non-empty");
    }
  }

  return { value, startOffset: source.startOffset + start };
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
      childNodes.forEach((child) => {
        visit(child, node);
      });
    }
  };

  visit(root, null);
}

export const webpackIgnoreCommentRegexp = /webpackIgnore:(\s+)?(true|false)/;
