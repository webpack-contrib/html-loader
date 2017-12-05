/* eslint-disable
  import/order,
  import/first,
  arrow-parens,
  no-undefined,
  no-param-reassign,
  no-useless-escape,
*/
import LoaderError from './Error';
import loaderUtils from 'loader-utils';
import validateOptions from 'schema-utils';

import url from 'url';
import attrs from './lib/attrs';
import minifier from 'html-minifier';

const schema = require('./options');

function randomize() {
  return `link__${Math.random()}`;
}

export default function loader(html) {
  const options = loaderUtils.getOptions(this) || {};

  validateOptions(schema, options, 'HTML Loader');

  // eslint-disable-next-line
  const root = options.root;

  let attributes = ['img:src'];

  if (options.attrs !== undefined) {
    if (typeof options.attrs === 'string') attributes = options.attrs.split(' ');
    else if (Array.isArray(options.attrs)) attributes = options.attrs;
    else if (options.attrs === false) attributes = [];
    else {
      throw new LoaderError({
        name: 'AttributesError',
        message: 'Invalid attribute value found',
      });
    }
  }

  const links = attrs(html, (tag, attr) => {
    const item = `${tag}:${attr}`;

    const result = attributes.find((a) => item.indexOf(a) >= 0);

    return !!result;
  });

  links.reverse();

  const data = {};

  html = [html];

  links.forEach((link) => {
    if (!loaderUtils.isUrlRequest(link.value, root)) return;

    const uri = url.parse(link.value);

    if (uri.hash !== null && uri.hash !== undefined) {
      uri.hash = null;

      link.value = uri.format();
      link.length = link.value.length;
    }

    let ident;
    do { ident = randomize(); } while (data[ident]);
    data[ident] = link.value;

    const item = html.pop();

    html.push(item.substr(link.start + link.length));
    // eslint-disable-next-line
    html.push(ident);
    html.push(item.substr(0, link.start));
  });

  html = html.reverse().join('');

  if (options.interpolate === 'require') {
    const regex = /\$\{require\([^)]*\)\}/g;
    // eslint-disable-next-line
    let result;

    const requires = [];

    // eslint-disable-next-line
    while (result = regex.exec(html)) {
      requires.push({
        length: result[0].length,
        start: result.index,
        value: result[0],
      });
    }

    requires.reverse();

    html = [html];

    requires.forEach((link) => {
      const item = html.pop();

      let ident;
      do { ident = randomize(); } while (data[ident]);
      data[ident] = link.value.substring(11, link.length - 3);

      html.push(item.substr(link.start + link.length));
      // eslint-disable-next-line
      html.push(ident);
      html.push(item.substr(0, link.start));
    });

    html = html.reverse().join('');
  }

  if (options.minimize || this.minimize) {
    let minimize = Object.create({
      collapseWhitespace: true,
      conservativeCollapse: true,
      useShortDoctype: true,
      keepClosingSlash: true,
      minifyJS: true,
      minifyCSS: true,
      removeComments: true,
      removeAttributeQuotes: true,
      removeStyleTypeAttributes: true,
      removeScriptTypeAttributes: true,
      removeCommentsFromCDATA: true,
      removeCDATASectionsFromCDATA: true,
    });

    if (typeof options.minimize === 'object') {
      minimize = Object.assign(minimize, options.minimize);
    }

    html = minifier.minify(html, minimize);
  }

  // TODO
  // #120 - Support exporting a template function
  //
  // import template from 'file.html'
  //
  // const html = template({...locals})
  if (options.interpolate && options.interpolate !== 'require') {
    html = `${html}`;
  } else {
    html = JSON.stringify(html);
  }

  html = html.replace(/link__[0-9\.]+/g, (match) => {
    if (!data[match]) return match;
    return `"require('${JSON.stringify(loaderUtils.urlToRequest(data[match], root))}')"`;
  });

  return `export default ${html};`;
}
