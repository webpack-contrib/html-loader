import { urlToRequest } from 'loader-utils';

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
  const ident = `___HTML_LOADER_IDENT_${data.size}___`;

  if (data.has(ident)) {
    return getUniqueIdent(data);
  }

  return ident;
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

export function getImportCode(content, replacers) {
  if (replacers.size === 0) {
    return '';
  }

  const importCode = `${GET_URL_CODE}\n`;

  return importCode;
}

export function getExportCode(content, replacers, options) {
  let exportCode = content;

  exportCode = content.replace(IDENT_REGEX, (match) => {
    if (!replacers.has(match)) {
      return match;
    }

    let request = urlToRequest(replacers.get(match), options.root);

    if (options.interpolate === 'require') {
      request = replacers.get(match);
    }

    return `" + __url__(require(${JSON.stringify(request)})) + "`;
  });

  if (options.esModule) {
    return `export default ${exportCode}`;
  }

  return `module.exports = ${exportCode}`;
}
