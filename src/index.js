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
    if (link.value && isUrlRequest(link.value, options.root)) {
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

  if (options.interpolate) {
    try {
      // Double escape quotes so that they are not unescaped completely in the template string
      content = compile(
        `\`${content.replace(/\\"/g, '\\\\"').replace(/\\'/g, "\\\\\\'")}\``
      ).code;
    } catch (error) {
      this.emitError(error);

      content = JSON.stringify(content);
    }
  } else {
    content = JSON.stringify(content);
  }

  const importCode = getImportCode(this, content, replacers, options);
  const exportCode = getExportCode(content, replacers, options);

  return `${importCode}${exportCode};`;
}
