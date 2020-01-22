<div align="center">
  <img width="200" height="200"
    src="https://worldvectorlogo.com/logos/html5.svg">
  <a href="https://github.com/webpack/webpack">
    <img width="200" height="200" vspace="" hspace="25"
      src="https://worldvectorlogo.com/logos/webpack.svg">
  </a>
</div>

[![npm][npm]][npm-url]
[![node][node]][node-url]
[![deps][deps]][deps-url]
[![tests][tests]][tests-url]
[![coverage][cover]][cover-url]
[![chat][chat]][chat-url]
[![size][size]][size-url]

# html-loader

Exports HTML as string. HTML is minimized when the compiler demands.

## Getting Started

To begin, you'll need to install `html-loader`:

```console
npm install --save-dev html-loader
```

Then add the plugin to your `webpack` config. For example:

**file.js**

```js
import html from './file.html';
```

**webpack.config.js**

```js
module.exports = {
  module: {
    rules: [
      {
        test: /\.html$/i,
        loader: 'html-loader',
      },
    ],
  },
};
```

By default every local `<img src="image.png">` is required (`require('./image.png')`).
You may need to specify loaders for images in your configuration (recommended `file-loader` or `url-loader`).

## Options

|               Name                |        Type         |                   Default                    | Description                              |
| :-------------------------------: | :-----------------: | :------------------------------------------: | :--------------------------------------- |
|  **[`attributes`](#attributes)**  |  `{Array\|String}`  |           `['img:src', ':srcset']`           | Enables/Disables attributes handling     |
|        **[`root`](#root)**        |     `{String}`      |                 `undefiend`                  | Allow to handle root-relative attributes |
| **[`interpolate`](#interpolate)** | `{Boolean\|String}` |                   `false`                    | Allow to use expressions in HTML syntax  |
|    **[`minimize`](#minimize)**    | `{Boolean\|Object}` | `true` in production mode, otherwise `false` | Tell `html-loader` to minimize HTML      |
|    **[`esModule`](#esmodule)**    |     `{Boolean}`     |                   `false`                    | Use ES modules syntax                    |

### `attributes`

Type: `Array|String`
Default: `['img:src', ':srcset']`

You can specify which tag-attribute combination should be processed by this loader via the query parameter `attributes`.
Pass an array or a space-separated list of `<tag>:<attribute>` combinations. (Default: `attributes=img:src`)

If you use `<custom-elements>`, and lots of them make use of a `custom-src` attribute, you don't have to specify each combination `<tag>:<attribute>`: just specify an empty tag like `attributes=:custom-src` and it will match every element.

**webpack.config.js**

```js
module.exports = {
  module: {
    rules: [
      {
        test: /\.html$/i,
        loader: 'html-loader',
        options: {
          attributes: [':data-src'],
        },
      },
    ],
  },
};
```

To completely disable tag-attribute processing (for instance, if you're handling image loading on the client side) you can pass set `false` value.

### `root`

Type: `String`
Default: `undefined`

For urls that start with a `/`, the default behavior is to not translate them.
If a `root` query parameter is set, however, it will be prepended to the url and then translated.

**webpack.config.js**

```js
module.exports = {
  module: {
    rules: [
      {
        test: /\.html$/i,
        loader: 'html-loader',
        options: {
          root: './file.html',
        },
      },
    ],
  },
};
```

### `interpolate`

Type: `Boolean|String`
Default: `false`

Allow to use expressions in HTML syntax.

#### `Boolean`

You can use `interpolate` flag to enable interpolation syntax for ES6 template strings, like so:

```js
require('html-loader?interpolate!./file.html');
```

```html
<img src="${require(`./images/gallery.png`)}" />

<div>${require('./components/gallery.html')}</div>
```

#### `Boolean`

**webpack.config.js**

```js
module.exports = {
  module: {
    rules: [
      {
        test: /\.html$/i,
        loader: 'html-loader',
        options: {
          interpolate: true,
        },
      },
    ],
  },
};
```

#### `String`

If you only want to use `require` in template and any other `${}` are not to be translated, you can set `interpolate` flag to `require`, like so:

**webpack.config.js**

```js
module.exports = {
  module: {
    rules: [
      {
        test: /\.html$/i,
        loader: 'html-loader',
        options: {
          interpolate: 'require',
        },
      },
    ],
  },
};
```

This may be useful for template syntaxes. For example:

```html
<#list list as list>
  <a href="${list.href!}" />${list.name}</a>
</#list>

<img src="${require(`./images/gallery.png`)}">

<div>${require('./components/gallery.html')}</div>
```

### `minimize`

Type: `Boolean|Object`
Default: `true` in production mode, otherwise `false`

Tell `html-loader` to minimize HTML.

#### `Boolean`

The enabled rules for minimizing by default are the following ones:

- collapseWhitespace
- conservativeCollapse
- keepClosingSlash
- minifyCSS
- minifyJS
- removeAttributeQuotes
- removeComments
- removeScriptTypeAttributes
- removeStyleTypeAttributes
- useShortDoctype

**webpack.config.js**

```js
module.exports = {
  module: {
    rules: [
      {
        test: /\.html$/i,
        loader: 'html-loader',
        options: {
          minimize: true,
        },
      },
    ],
  },
};
```

#### `Object`

**webpack.config.js**

See [html-minifier](https://github.com/kangax/html-minifier#options-quick-reference)'s documentation for more information on the available options.

The rules can be disabled using the following options in your `webpack.conf.js`

**webpack.config.js**

```js
module.exports = {
  module: {
    rules: [
      {
        test: /\.html$/i,
        loader: 'html-loader',
        options: {
          minimize: {
            removeComments: false,
            collapseWhitespace: false,
          },
        },
      },
    ],
  },
};
```

### `esModule`

Type: `Boolean`
Default: `false`

By default, `html-loader` generates JS modules that use the CommonJS modules syntax.
There are some cases in which using ES modules is beneficial, like in the case of [module concatenation](https://webpack.js.org/plugins/module-concatenation-plugin/) and [tree shaking](https://webpack.js.org/guides/tree-shaking/).

You can enable a ES module syntax using:

**webpack.config.js**

```js
module.exports = {
  module: {
    rules: [
      {
        test: /\.html$/i,
        loader: 'html-loader',
        options: {
          esModule: true,
        },
      },
    ],
  },
};
```

## Examples

### CDN

**webpack.config.js**

```js
module.exports = {
  module: {
    rules: [
      { test: /\.jpg$/, loader: 'file-loader' },
      { test: /\.png$/, loader: 'url-loader' },
    ],
  },
  output: {
    publicPath: 'http://cdn.example.com/[hash]/',
  },
};
```

```html
<!-- file.html -->
<img src="image.png" data-src="image2x.png" />
```

```js
require('html-loader!./file.html');

// => '<img src="http://cdn.example.com/49eba9f/a992ca.png" data-src="image2x.png">'
```

```js
require('html-loader?attributes=img:data-src!./file.html');

// => '<img src="image.png" data-src="data:image/png;base64,..." >'
```

```js
require('html-loader?attributes=img:src img:data-src!./file.html');
require('html-loader?attributes[]=img:src&attributes[]=img:data-src!./file.html');

// => '<img src="http://cdn.example.com/49eba9f/a992ca.png" data-src="data:image/png;base64,..." >'
```

```js
require('html-loader?-attributes!./file.html');

// => '<img src="image.jpg"  data-src="image2x.png" >'
```

```html
'<img src=http://cdn.example.com/49eba9f/a9f92ca.jpg
data-src=data:image/png;base64,...>'
```

### 'Root-relative' URLs

With the same configuration as above:

```html
<!-- file.html -->
<img src="/image.jpg" />
```

```js
require('html-loader!./file.html');

// => '<img src="/image.jpg">'
```

```js
require('html-loader?root=.!./file.html');

// => '<img src="http://cdn.example.com/49eba9f/a992ca.jpg">'
```

### Export into HTML files

A very common scenario is exporting the HTML into their own _.html_ file, to
serve them directly instead of injecting with javascript. This can be achieved
with a combination of 3 loaders:

- [file-loader](https://github.com/webpack/file-loader)
- [extract-loader](https://github.com/peerigon/extract-loader)
- html-loader

The html-loader will parse the URLs, require the images and everything you
expect. The extract loader will parse the javascript back into a proper html
file, ensuring images are required and point to proper path, and the file loader
will write the _.html_ file for you. Example:

**webpack.config.js**

```js
module.exports = {
  module: {
    rules: [
      {
        test: /\.html$/i,
        use: ['file-loader?name=[name].[ext]', 'extract-loader', 'html-loader'],
      },
    ],
  },
};
```

## Contributing

Please take a moment to read our contributing guidelines if you haven't yet done so.

[CONTRIBUTING](./.github/CONTRIBUTING.md)

## License

[MIT](./LICENSE)

[npm]: https://img.shields.io/npm/v/html-loader.svg
[npm-url]: https://npmjs.com/package/html-loader
[node]: https://img.shields.io/node/v/html-loader.svg
[node-url]: https://nodejs.org
[deps]: https://david-dm.org/webpack-contrib/html-loader.svg
[deps-url]: https://david-dm.org/webpack-contrib/html-loader
[tests]: https://dev.azure.com/webpack-contrib/html-loader/_apis/build/status/webpack-contrib.html-loader?branchName=master
[tests-url]: https://dev.azure.com/webpack-contrib/html-loader/_build/latest?definitionId=38&branchName=master
[cover]: https://codecov.io/gh/webpack-contrib/html-loader/branch/master/graph/badge.svg
[cover-url]: https://codecov.io/gh/webpack-contrib/html-loader
[chat]: https://img.shields.io/badge/gitter-webpack%2Fwebpack-brightgreen.svg
[chat-url]: https://gitter.im/webpack/webpack
[size]: https://packagephobia.now.sh/badge?p=html-loader
[size-url]: https://packagephobia.now.sh/result?p=html-loader
