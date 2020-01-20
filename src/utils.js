import parseAttributes from './parseAttributes';

function randomIdent() {
  return `xxxHTMLLINKxxx${Math.random()}${Math.random()}xxx`;
}

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
  const ident = randomIdent();

  if (data.has(ident)) {
    return getUniqueIdent(data);
  }

  return ident;
}

export function getExportsString(options) {
  if (options.esModule) {
    return 'export default ';
  }

  return 'module.exports = ';
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
