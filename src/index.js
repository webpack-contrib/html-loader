/* eslint-disable */
import loaderUtils from "loader-utils";
import validateOptions from 'schema-utils';

import url from "url";
import attrs from "./lib/attrs";
import minifier from "html-minifier";

const schema = require('./options');

function randomIdent() {
  return "xxxHTMLLINKxxx" + Math.random() + Math.random() + "xxx";
}

export default function loader (html) {
  var options = loaderUtils.getOptions(this) || {};

  validateOptions(schema, options, 'HTML Loader');

  var attributes = ["img:src"];

  if (options.attrs !== undefined) {
    if (typeof options.attrs === "string") attributes = options.attrs.split(" ");
    else if (Array.isArray(options.attrs)) attributes = options.attrs;
    else if (options.attrs === false)      attributes = [];
    else throw new Error("Invalid value to options parameter attrs");
  }

  var root = options.root;

  var links = attrs(html, (tag, attr) => {
    return attributes.indexOf(tag + ":" + attr) >= 0;
  });

  links.reverse();

  var data = {};

  html = [html];

  links.forEach((link) => {
    if(!loaderUtils.isUrlRequest(link.value, root)) return;

    var uri = url.parse(link.value);

    if (uri.hash !== null && uri.hash !== undefined) {
      uri.hash = null;

      link.value = uri.format();
      link.length = link.value.length;
    }

    do {
      var ident = randomIdent();
    } while(data[ident]);

    data[ident] = link.value;

    var x = html.pop();

    html.push(x.substr(link.start + link.length));
    html.push(ident);
    html.push(x.substr(0, link.start));
  });

  html.reverse();

  html = html.join("");

  if (options.interpolate === 'require') {
    var regex = /\$\{require\([^)]*\)\}/g;
    var result;

    var reqList = [];

    while(result = regex.exec(html)) {
      reqList.push({
        length : result[0].length,
        start : result.index,
        value : result[0]
      })
    }

    reqList.reverse();

    html = [html];

    reqList.forEach((link) => {
      var x = html.pop();

      do {
        var ident = randomIdent();
      } while(data[ident]);

      data[ident] = link.value.substring(11,link.length - 3)

      html.push(x.substr(link.start + link.length));
      html.push(ident);
      html.push(x.substr(0, link.start));
    });

    html.reverse();
    html = html.join("");
  }

  if (typeof options.minimize === "boolean" ? options.minimize : this.minimize) {
    var minimizeOptions = Object.assign({}, options);

    [
      "removeComments",
      "removeCommentsFromCDATA",
      "removeCDATASectionsFromCDATA",
      "collapseWhitespace",
      "conservativeCollapse",
      "removeAttributeQuotes",
      "useShortDoctype",
      "keepClosingSlash",
      "minifyJS",
      "minifyCSS",
      "removeScriptTypeAttributes",
      "removeStyleTypeAttributes",
    ].forEach((name) => {
      if (typeof minimizeOptions[name] === "undefined") {
        minimizeOptions[name] = true;
      }
    });

    html = minifier.minify(html, minimizeOptions);
  }

  // TODO
  // Support exporting a template function
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
    if(!data[match]) return match;
    return '" + require(' + JSON.stringify(loaderUtils.urlToRequest(data[match], root)) + ') + "';
  })};`;

}
