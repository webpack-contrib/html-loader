import parseAttributes from './parseAttributes';

function randomIdent() {
  return `xxxHTMLLINKxxx${Math.random()}${Math.random()}xxx`;
}

export function convertMapToObject(map) {
  const obj = {};

  for (const prop of map) {
    // eslint-disable-next-line prefer-destructuring
    obj[prop[0]] = prop[1];
  }

  return obj;
}

export function getAttributes(options) {
  if (typeof options.attrs !== 'undefined') {
    if (typeof options.attrs === 'string') {
      return options.attrs.split(' ');
    }

    if (Array.isArray(options.attrs)) {
      return options.attrs;
    }

    if (options.attrs === false) {
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
  return parseAttributes(content, (tag, attr) => {
    const res = attributes.find((a) => {
      if (a.startsWith(':')) {
        return attr === a.slice(1);
      }

      return `${tag}:${attr}` === a;
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
