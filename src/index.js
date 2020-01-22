import { parse } from 'url';

import { compile } from 'es6-templates';
import { minify } from 'html-minifier-terser';
import { getOptions, isUrlRequest } from 'loader-utils';
import validateOptions from 'schema-utils';

import {
  getLinks,
  getUniqueIdent,
  replaceLinkWithIdent,
  isProductionMode,
  getImportCode,
  getExportCode,
} from './utils';

import schema from './options.json';

const REQUIRE_REGEX = /\${require\([^)]*\)}/g;

export const raw = true;

export default function htmlLoader(source) {
  const options = getOptions(this) || {};

  validateOptions(schema, options, {
    name: 'HTML Loader',
    baseDataPath: 'options',
  });

  let content = source.toString();

  const links = getLinks(content, options.attributes);
  const replacers = new Map();

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

      const ident = getUniqueIdent(replacers);

      replacers.set(ident, link.value);

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
      const ident = getUniqueIdent(replacers);

      replacers.set(ident, link.value.substring(11, link.length - 3));

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

    try {
      content = minify(content, minimizeOptions);
    } catch (error) {
      this.emitError(error);
    }
  }

  if (options.interpolate && options.interpolate !== 'require') {
    // Double escape quotes so that they are not unescaped completely in the template string
    content = content.replace(/\\"/g, '\\\\"');
    content = content.replace(/\\'/g, "\\\\\\'");

    content = compile(`\`${content}\``).code;
  } else {
    content = JSON.stringify(content);
  }

  const importCode = getImportCode(this, content, replacers, options);
  const exportCode = getExportCode(content, replacers, options);

  return `${importCode}${exportCode};`;
}
