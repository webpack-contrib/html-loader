<div align="center">
  <img width="200" height="200" src="https://worldvectorlogo.com/logos/html5.svg" alt="html-loader">
  <a href="https://github.com/webpack/webpack">
    <img width="200" height="200" vspace="" hspace="25" src="https://worldvectorlogo.com/logos/webpack.svg" alt="webpack">
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

## Options

|                Name                 |            Type            |                   Default                    | Description                                      |
| :---------------------------------: | :------------------------: | :------------------------------------------: | :----------------------------------------------- |
| **[`preprocessor`](#preprocessor)** |        `{Function}`        |                 `undefined`                  | Allows pre-processing of content before handling |
|   **[`attributes`](#attributes)**   | `{Boolean\/Array\/Object}` |                    `true`                    | Enables/Disables attributes handling             |
|         **[`root`](#root)**         |         `{String}`         |                 `undefiend`                  | Allow to handle root-relative attributes         |
|     **[`minimize`](#minimize)**     |    `{Boolean\|Object}`     | `true` in production mode, otherwise `false` | Tell `html-loader` to minimize HTML              |
|     **[`esModule`](#esmodule)**     |        `{Boolean}`         |                   `false`                    | Use ES modules syntax                            |

### `preprocessor`

Type: `Function`
Default: `undefined`

Allows pre-processing of content before handling.

> ⚠ You should always return valid HTML

**file.hbs**

```hbs
<div>
  <p>{{firstname}} {{lastname}}</p>
  <img src="image.png" alt="alt" />
<div>
```

**webpack.config.js**

```js
const Handlebars = require('handlebars');

module.exports = {
  module: {
    rules: [
      {
        test: /\.hbs$/i,
        loader: 'html-loader',
        options: {
          preprocessor: (content, loaderContext) => {
            let result;

            try {
              result = Handlebars.compile(content)({
                firstname: 'Value',
                lastname: 'OtherValue',
              });
            } catch (error) {
              loaderContext.emitError(error);

              return content;
            }

            return result;
          },
        },
      },
    ],
  },
};
```

### `attributes`

Type: `Boolean|Array|Object`
Default: `true`

By default every loadable attributes (for example - `<img src="image.png">`) is imported (`const img = require('./image.png')` or `import img from "./image.png""`).
You may need to specify loaders for images in your configuration (recommended `file-loader` or `url-loader`).

Supported tags and attributes:

- `audio:src`
- `embed:src`
- `img:src`
- `img:srcset`
- `input:src`
- `link:href`
- `object:data`
- `script:src`
- `source:src`
- `source:srcset`
- `track:src`
- `video:poster`
- `video:src`

#### `Boolean`

The `true` value enables processing of all default elements and attributes, the `false` disable processing of all attributes.

**webpack.config.js**

```js
module.exports = {
  module: {
    rules: [
      {
        test: /\.html$/i,
        loader: 'html-loader',
        options: {
          // Disables tags and attributes processing
          attributes: false,
        },
      },
    ],
  },
};
```

#### `Array`

Allows you to specify which tags and attributes to process.
Pass an array of `<tag>:<attribute>` or `:<attribute>` combinations.
You can specify which tag-attribute combination should be processed by this loader via the query parameter `attributes`, for example:

**webpack.config.js**

```js
module.exports = {
  module: {
    rules: [
      {
        test: /\.html$/i,
        loader: 'html-loader',
        options: {
          attributes: [':data-src', 'custom-elements:data-src'],
        },
      },
    ],
  },
};
```

#### `Object`

Allows you to specify which tags and attributes to process, filter them and process sources starts with `/`.
For example:

**webpack.config.js**

```js
module.exports = {
  module: {
    rules: [
      {
        test: /\.html$/i,
        loader: 'html-loader',
        options: {
          attributes: {
            list: [':data-src', 'custom-elements:data-src'],
            filter: (attribute, value, resourcePath) => {
              // The `attribute` argument contains a name of the HTML attribute.
              // The `value` argument contains a value of the HTML attribute.
              // The `resourcePath` argument contains a path to the loaded HTML file.

              if (value.includes('example')) {
                return false;
              }

              return true;
            },
            root: '.',
          },
        },
      },
    ],
  },
};
```

#### `list`

Type: `String`
Default: https://github.com/webpack-contrib/html-loader#attributes

For example:

**webpack.config.js**

```js
module.exports = {
  module: {
    rules: [
      {
        test: /\.html$/i,
        loader: 'html-loader',
        options: {
          attributes: {
            list: [':data-src', 'custom-elements:data-src'],
          },
        },
      },
    ],
  },
};
```

#### `filter`

Type: `Function`
Default: `undefined`

Allow to filter sources. All filtered sources will not be resolved (left in the code as they were written).
All non requestable sources (for example `<img src="javascript:void(0)">`) do not handle by default.

```js
module.exports = {
  module: {
    rules: [
      {
        test: /\.html$/i,
        loader: 'html-loader',
        options: {
          attributes: {
            filter: (attribute, value, resourcePath) => {
              // The `attribute` argument contains a name of the HTML attribute.
              // The `value` argument contains a value of the HTML attribute.
              // The `resourcePath` argument contains a path to the loaded HTML file.

              if (value.includes('example')) {
                return false;
              }

              return true;
            },
          },
        },
      },
    ],
  },
};
```

#### `root`

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
          attributes: {
            root: '.',
          },
        },
      },
    ],
  },
};
```

### `minimize`

Type: `Boolean|Object`
Default: `true` in production mode, otherwise `false`

Tell `html-loader` to minimize HTML.

#### `Boolean`

The enabled rules for minimizing by default are the following ones:

- `collapseWhitespace`
- `conservativeCollapse`
- `keepClosingSlash`
- `minifyCSS`
- `minifyJS`
- `removeAttributeQuotes`
- `removeComments`
- `removeScriptTypeAttributes`
- `removeStyleTypeAttributes`
- `useShortDoctype`

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

See [html-minifier-terser](https://github.com/DanielRuf/html-minifier-terser)'s documentation for more information on the available options.

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
require('html-loader?attributes[]=img:data-src!./file.html');

// => '<img src="image.png" data-src="data:image/png;base64,..." >'
```

```js
require('html-loader?attributes[]=img:src&attributes[]=img:data-src!./file.html');

// => '<img src="http://cdn.example.com/49eba9f/a992ca.png" data-src="data:image/png;base64,..." >'
```

```js
require('html-loader?-attributes!./file.html');

// => '<img src="image.jpg"  data-src="image2x.png" >'
```

> :warning: `-attributes` it is set attributes: false

```html
'<img src=http://cdn.example.com/49eba9f/a9f92ca.jpg
data-src=data:image/png;base64,...>'
```

### Process `script` and `link` tags

**script.file.js**

```js
console.log(document);
```

**style.file.css**

```css
a {
  color: red;
}
```

**file.html**

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>Title of the document</title>
    <link rel="stylesheet" type="text/css" href="./style.file.css" />
  </head>
  <body>
    Content of the document......
    <script src="./script.file.js"></script>
  </body>
</html>
```

**webpack.config.js**

```js
module.exports = {
  module: {
    rules: [
      {
        test: /\.html$/i,
        use: ['file-loader?name=[name].[ext]', 'extract-loader', 'html-loader'],
      },
      {
        test: /\.js$/i,
        exclude: /\.file.js$/i,
        loader: 'babel-loader',
      },
      {
        test: /\.file.js$/i,
        loader: 'file-loader',
      },
      {
        test: /\.css$/i,
        exclude: /\.file.css$/i,
        loader: 'css-loader',
      },
      {
        test: /\.file.css$/i,
        loader: 'file-loader',
      },
    ],
  },
};
```

### 'Root-relative' URLs

With the same configuration as above:

**file.html**

```html
<img src="/image.jpg" />
```

**scripts.js**

```js
require('html-loader!./file.html');

// => '<img src="/image.jpg">'
```

**other-scripts.js**

```js
require('html-loader?root=.!./file.html');

// => '<img src="http://cdn.example.com/49eba9f/a992ca.jpg">'
```

### Templating

You can use any template system. Below is an example for [handlebars](https://handlebarsjs.com/).

**file.hbs**

```hbs
<div>
  <p>{{firstname}} {{lastname}}</p>
  <img src="image.png" alt="alt" />
<div>
```

**webpack.config.js**

```js
const Handlebars = require('handlebars');

module.exports = {
  module: {
    rules: [
      {
        test: /\.hbs$/i,
        loader: 'html-loader',
        options: {
          preprocessor: (content, loaderContext) => {
            let result;

            try {
              result = Handlebars.compile(content)({
                firstname: 'Value',
                lastname: 'OtherValue',
              });
            } catch (error) {
              loaderContext.emitError(error);

              return content;
            }

            return result;
          },
        },
      },
    ],
  },
};
```

### PostHTML

You can use [PostHTML](https://github.com/posthtml/posthtml) without any additional loaders.

**file.html**

```html
<img src="image.jpg" />
```

**webpack.config.js**

```js
const posthtml = require('posthtml');
const posthtmlWebp = require('posthtml-webp');

module.exports = {
  module: {
    rules: [
      {
        test: /\.hbs$/i,
        loader: 'html-loader',
        options: {
          preprocessor: () => {
            let result;

            try {
              result = posthtml()
                .use(plugin)
                .process(content, { sync: true });
            } catch (error) {
              loaderContext.emitError(error);

              return content;
            }

            return result.html;
          },
        },
      },
    ],
  },
};
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
