import parseAttributes from './parseAttributes';

function randomIdent() {
  return `xxxHTMLLINKxxx${Math.random()}${Math.random()}xxx`;
}

export function getAttributes(options) {
  if (typeof options.attributes !== 'undefined') {
    if (typeof options.attributes === 'string') {
      return options.attributes.split(' ');
    }

    if (Array.isArray(options.attributes)) {
      return options.attributes;
    }

    if (options.attributes === false) {
      return [];
    }

    throw new Error('Invalid value to options parameter attrs');
  }

  return ['img:src'];
}

export function getExportsString(options) {
  if (options.esModule) {
    return 'export default ';
  }

  return 'module.exports = ';
}

export function getLinks(content, attributes) {
  return parseAttributes(content, (tag, attribute) => {
    const res = attributes.find((a) => {
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
