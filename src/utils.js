import { urlToRequest, stringifyRequest } from 'loader-utils';

import parseAttributes from './parseAttributes';
import { GET_URL_CODE, IDENT_REGEX } from './constants';

export function getTagsAndAttributes(attributes) {
  const defaultAttributes = ['img:src'];

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

  importItems.push(GET_URL_CODE);

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

    return `" + __url__(${match}) + "`;
  });

  if (options.esModule) {
    return `// Exports\nexport default ${exportCode}`;
  }

  return `// Exports\nmodule.exports = ${exportCode}`;
}
