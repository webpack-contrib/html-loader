import { parse } from 'url';

import { compile } from 'es6-templates';
import { minify } from 'html-minifier';
import { getOptions, isUrlRequest, urlToRequest } from 'loader-utils';

import validateOptions from 'schema-utils';

import { GET_URL_CODE, IDENT_REGEX, REQUIRE_REGEX } from './constants';
import {
  getExportsString,
  getLinks,
  getUniqueIdent,
  replaceLinkWithIdent,
  isProductionMode,
} from './utils';

import schema from './options.json';

export const raw = true;

export default function htmlLoader(source) {
  const options = getOptions(this) || {};

  validateOptions(schema, options, {
    name: 'HTML Loader',
    baseDataPath: 'options',
  });

  let content = source.toString();

  const links = getLinks(content, options.attributes);
  const data = new Map();

  let offset = 0;
  for (const link of links) {
    if (
      link.value &&
      isUrlRequest(link.value, options.root) &&
      !link.value.includes('mailto:')
    ) {
      const uri = parse(link.value);

      if (typeof uri.hash !== 'undefined') {
        uri.hash = null;
        link.value = uri.format();
        link.length = link.value.length;
      }

      const ident = getUniqueIdent(data);

      data.set(ident, link.value);

      content = replaceLinkWithIdent(content, link, ident, offset);

      offset += ident.length - link.length;
    }
  }

  if (options.interpolate === 'require') {
    const reqList = [];

    let result = REQUIRE_REGEX.exec(content);
    while (result) {
      reqList.push({
        length: result[0].length,
        start: result.index,
        value: result[0],
      });

      result = REQUIRE_REGEX.exec(content);
    }

    reqList.reverse();

    for (const link of reqList) {
      const ident = getUniqueIdent(data);

      data.set(ident, link.value.substring(11, link.length - 3));

      content = replaceLinkWithIdent(content, link, ident);
    }
  }

  const minimize =
    typeof options.minimize === 'undefined'
      ? isProductionMode(this)
      : options.minimize;

  if (minimize) {
    const minimizeOptions =
      typeof minimize === 'boolean'
        ? {
            collapseWhitespace: true,
            conservativeCollapse: true,
            keepClosingSlash: true,
            minifyCSS: true,
            minifyJS: true,
            removeAttributeQuotes: true,
            removeComments: true,
            removeScriptTypeAttributes: true,
            removeStyleLinkTypeAttributes: true,
            useShortDoctype: true,
          }
        : minimize;

    content = minify(content, minimizeOptions);
  }

  if (options.interpolate && options.interpolate !== 'require') {
    // Double escape quotes so that they are not unescaped completely in the template string
    content = content.replace(/\\"/g, '\\\\"');
    content = content.replace(/\\'/g, "\\\\\\'");

    content = compile(`\`${content}\``).code;
  } else {
    content = JSON.stringify(content);
  }

  const exportsString = getExportsString(options);

  return `${GET_URL_CODE +
    exportsString +
    content.replace(IDENT_REGEX, (match) => {
      if (!data.has(match)) {
        return match;
      }

      let request = urlToRequest(data.get(match), options.root);

      if (options.interpolate === 'require') {
        request = data.get(match);
      }

      return `" + __url__(require(${JSON.stringify(request)})) + "`;
    })};`;
}
