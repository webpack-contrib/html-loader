import { parse } from 'url';

import { isUrlRequest } from 'loader-utils';

import { getLinks, getUniqueIdent, replaceLinkWithIdent } from '../utils';

export default (content, replacers, options) => {
  const links = getLinks(content, options.attributes);

  let offset = 0;

  for (const link of links) {
    if (link.value && isUrlRequest(link.value, options.root)) {
      const uri = parse(link.value);

      if (typeof uri.hash !== 'undefined') {
        uri.hash = null;
        link.value = uri.format();
        link.length = link.value.length;
      }

      const ident = getUniqueIdent(replacers);

      replacers.set(ident, link.value);

      // eslint-disable-next-line no-param-reassign
      content = replaceLinkWithIdent(content, link, ident, offset);

      offset += ident.length - link.length;
    }
  }

  return content;
};
