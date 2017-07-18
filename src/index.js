/* eslint-disable
  import/order,
  import/first,
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

function randomIdent() {
  return `xxxHTMLLINKxxx${Math.random()}${Math.random()}xxx`;
}

export default function loader(html) {
  const options = loaderUtils.getOptions(this) || {};

  validateOptions(schema, options, 'HTML Loader');

  let attributes = ['img:src'];

  if (options.attrs === undefined) {
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

  const { root } = options;

  // eslint-disable-next-line
  const links = attrs(html, (tag, attr) => {
    return attributes.indexOf(`${tag}:${attr}`) >= 0;
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
    // eslint-disable-next-line
    var ident;
    do { ident = randomIdent(); } while (data[ident]);
    data[ident] = link.value;

    const item = html.pop();

    html.push(item.substr(link.start + link.length));
    html.push(ident);
    html.push(item.substr(0, link.start));
  });

  html = html.reverse().join('');

  if (options.interpolate === 'require') {
    const regex = /\$\{require\([^)]*\)\}/g;
    // eslint-disable-next-line
    var result;

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
      // eslint-disable-next-line
      var ident
      do { ident = randomIdent(); } while (data[ident]);
      data[ident] = link.value.substring(11, link.length - 3);

      html.push(item.substr(link.start + link.length));
      html.push(ident);
      html.push(item.substr(0, link.start));
    });

    html = html.reverse().join('');
  }

  if (typeof options.minimize === 'boolean' ? options.minimize : this.minimize) {
    const minimizeOptions = Object.assign({}, options);

    [
      'removeComments',
      'removeCommentsFromCDATA',
      'removeCDATASectionsFromCDATA',
      'collapseWhitespace',
      'conservativeCollapse',
      'removeAttributeQuotes',
      'useShortDoctype',
      'keepClosingSlash',
      'minifyJS',
      'minifyCSS',
      'removeScriptTypeAttributes',
      'removeStyleTypeAttributes',
    ].forEach((name) => {
      if (typeof minimizeOptions[name] === 'undefined') {
        minimizeOptions[name] = true;
      }
    });

    html = minifier.minify(html, minimizeOptions);
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

  return `export default ${html.replace(/xxxHTMLLINKxxx[0-9\.]+xxx/g, (match) => {
    if (!data[match]) return match;
    return `"require('${JSON.stringify(loaderUtils.urlToRequest(data[match], root))}')"`;
  })};`;
}
