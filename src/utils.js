import { urlToRequest, stringifyRequest } from 'loader-utils';
import Parser from 'fastparse';

const IDENT_REGEX = /___HTML_LOADER_IDENT_[0-9.]+___/g;

function getTagsAndAttributes(attributes) {
  const defaultAttributes = ['img:src', 'source:srcset'];

  if (typeof attributes !== 'undefined') {
    if (typeof attributes === 'string') {
      return attributes.split(' ');
    }

    if (Array.isArray(attributes)) {
      return attributes;
    }

    if (attributes === false) {
      return [];
    }

    if (attributes === true) {
      return defaultAttributes;
    }

    throw new Error('Invalid value to options parameter attrs');
  }

  return defaultAttributes;
}

export function parseAttributes(html, isRelevantTagAttr) {
  function processMatch(match, strUntilValue, name, value, index) {
    if (!this.isRelevantTagAttr(this.currentTag, name)) {
      return;
    }

    this.results.push({
      start: index + strUntilValue.length,
      length: value.length,
      value,
    });
  }

  const parser = new Parser({
    outside: {
      '<!--.*?-->': true,
      '<![CDATA[.*?]]>': true,
      '<[!\\?].*?>': true,
      '</[^>]+>': true,
      '<([a-zA-Z\\-:]+)\\s*': function matchTag(match, tagName) {
        this.currentTag = tagName;

        return 'inside';
      },
    },
    inside: {
      // eat up whitespace
      '\\s+': true,
      // end of attributes
      '>': 'outside',
      '(([0-9a-zA-Z\\-:]+)\\s*=\\s*")([^"]*)"': processMatch,
      "(([0-9a-zA-Z\\-:]+)\\s*=\\s*')([^']*)'": processMatch,
      '(([0-9a-zA-Z\\-:]+)\\s*=\\s*)([^\\s>]+)': processMatch,
    },
  });

  return parser.parse('outside', html, {
    currentTag: null,
    results: [],
    isRelevantTagAttr,
  }).results;
}

export function getLinks(content, attributes) {
  const tagsAndAttributes = getTagsAndAttributes(attributes);

  return parseAttributes(content, (tag, attribute) => {
    const res = tagsAndAttributes.find((a) => {
      if (a.startsWith(':')) {
        return attribute === a.slice(1);
      }

      return `${tag}:${attribute}` === a;
    });

    return Boolean(res);
  });
}

export function getUniqueIdent(data) {
  return `___HTML_LOADER_IDENT_${data.size}___`;
}

export function replaceLinkWithIdent(source, link, ident, offset = 0) {
  return (
    source.substr(0, link.start + offset) +
    ident +
    source.substr(link.start + link.length + offset)
  );
}

export function isProductionMode(loaderContext) {
  return loaderContext.mode === 'production' || !loaderContext.mode;
}

export function getImportCode(loaderContext, content, replacers, options) {
  if (replacers.size === 0) {
    return '';
  }

  const importItems = [];

  importItems.push(
    options.esModule
      ? `import ___HTML_LOADER_GET_URL_IMPORT___ from ${stringifyRequest(
          loaderContext,
          require.resolve('./runtime/getUrl.js')
        )}`
      : `var ___HTML_LOADER_GET_URL_IMPORT___ = require(${stringifyRequest(
          loaderContext,
          require.resolve('./runtime/getUrl.js')
        )});`
  );

  const idents = replacers.keys();

  for (const ident of idents) {
    const url = replacers.get(ident);
    const request = urlToRequest(url, options.root);
    const stringifiedRequest = stringifyRequest(loaderContext, request);

    if (options.esModule) {
      importItems.push(`import ${ident} from ${stringifiedRequest};`);
    } else {
      importItems.push(`var ${ident} = require(${stringifiedRequest});`);
    }
  }

  const importCode = importItems.join('\n');

  return `// Imports\n${importCode}\n`;
}

export function getExportCode(content, replacers, options) {
  const exportCode = content.replace(IDENT_REGEX, (match) => {
    if (!replacers.has(match)) {
      return match;
    }

    return `" + ___HTML_LOADER_GET_URL_IMPORT___(${match}) + "`;
  });

  if (options.esModule) {
    return `// Exports\nexport default ${exportCode}`;
  }

  return `// Exports\nmodule.exports = ${exportCode}`;
}
