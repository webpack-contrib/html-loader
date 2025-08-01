<div align="center">
  <img width="200" height="200" src="https://www.w3.org/html/logo/downloads/HTML5_Logo.svg" alt="html-loader">
  <a href="https://github.com/webpack/webpack">
    <img width="200" height="200" vspace="" hspace="25" src="https://webpack.js.org/assets/icon-square-big.svg" alt="webpack">
  </a>
</div>

[![npm][npm]][npm-url]
[![node][node]][node-url]
[![tests][tests]][tests-url]
[![coverage][cover]][cover-url]
[![discussion][discussion]][discussion-url]
[![size][size]][size-url]

# html-loader

Exports HTML as string. HTML is minimized when the compiler demands.

## Getting Started

To begin, you'll need to install `html-loader`:

```console
npm install --save-dev html-loader
```

or

```console
yarn add -D html-loader
```

or

```console
pnpm add -D html-loader
```

Then add the loader to your `webpack` configuration. For example:

**file.js**

```js
import html from "./file.html";
```

**webpack.config.js**

```js
module.exports = {
  module: {
    rules: [
      {
        test: /\.html$/i,
        loader: "html-loader",
      },
    ],
  },
};
```

## Options

- **[`sources`](#sources)**
- **[`preprocessor`](#preprocessor)**
- **[`postprocessor`](#postprocessor)**
- **[`minimize`](#minimize)**
- **[`esModule`](#esmodule)**

### `sources`

Type:

```ts
type sources =
  | boolean
  | {
      list?: {
        tag?: string;
        attribute?: string;
        type?: string;
        filter?: (
          tag: string,
          attribute: string,
          attributes: string,
          resourcePath: string,
        ) => boolean;
      }[];
      urlFilter?: (
        attribute: string,
        value: string,
        resourcePath: string,
      ) => boolean;
      scriptingEnabled?: boolean;
    };
```

Default: `true`

By default every loadable attribute (for example - `<img src="image.png">`) is imported (`const img = require('./image.png')` or `new URL("./image.png", import.meta.url)`).
You may need to specify loaders for images in your configuration (recommended [`asset modules`](https://webpack.js.org/guides/asset-modules/)).

Supported tags and attributes:

- The `src` attribute of the `audio` tag
- The `src` attribute of the `embed` tag
- The `src` attribute of the `img` tag
- The `srcset` attribute of the `img` tag
- The `src` attribute of the `input` tag
- The `data` attribute of the `object` tag
- The `src` attribute of the `script` tag
- The `href` attribute of the `script` tag
- The `xlink:href` attribute of the `script` tag
- The `src` attribute of the `source` tag
- The `srcset` attribute of the `source` tag
- The `src` attribute of the `track` tag
- The `poster` attribute of the `video` tag
- The `src` attribute of the `video` tag
- The `xlink:href` attribute of the `image` tag
- The `href` attribute of the `image` tag
- The `xlink:href` attribute of the `use` tag
- The `href` attribute of the `use` tag
- The `href` attribute of the `link` tag when the `rel` attribute contains `stylesheet`, `icon`, `shortcut icon`, `mask-icon`, `apple-touch-icon`, `apple-touch-icon-precomposed`, `apple-touch-startup-image`, `manifest`, `prefetch`, `preload` or when the `itemprop` attribute is `image`, `logo`, `screenshot`, `thumbnailurl`, `contenturl`, `downloadurl`, `duringmedia`, `embedurl`, `installurl`, `layoutimage`
- The `imagesrcset` attribute of the `link` tag when the `rel` attribute contains `stylesheet`, `icon`, `shortcut icon`, `mask-icon`, `apple-touch-icon`, `apple-touch-icon-precomposed`, `apple-touch-startup-image`, `manifest`, `prefetch`, `preload`
- The `content` attribute of the `meta` tag when the `name` attribute is `msapplication-tileimage`, `msapplication-square70x70logo`, `msapplication-square150x150logo`, `msapplication-wide310x150logo`, `msapplication-square310x310logo`, `msapplication-config`, `twitter:image` or when the `property` attribute is `og:image`, `og:image:url`, `og:image:secure_url`, `og:audio`, `og:audio:secure_url`, `og:video`, `og:video:secure_url`, `vk:image` or when the `itemprop` attribute is `image`, `logo`, `screenshot`, `thumbnailurl`, `contenturl`, `downloadurl`, `duringmedia`, `embedurl`, `installurl`, `layoutimage`
- The `icon-uri` value component in `content` attribute of the `meta` tag when the `name` attribute is `msapplication-task`

#### `boolean`

- true: Enables processing of all default tags and attributes
- false: Disables processing entirely

**webpack.config.js**

```js
module.exports = {
  module: {
    rules: [
      {
        test: /\.html$/i,
        loader: "html-loader",
        options: {
          // Disables attributes processing
          sources: false,
        },
      },
    ],
  },
};
```

#### `object`

Allows you to specify which tags and attributes to process, filter them, filter URLs and process sources starting with `/`.

For example:

**webpack.config.js**

```js
module.exports = {
  module: {
    rules: [
      {
        test: /\.html$/i,
        loader: "html-loader",
        options: {
          sources: {
            list: [
              // All default supported tags and attributes
              "...",
              {
                tag: "img",
                attribute: "data-src",
                type: "src",
              },
              {
                tag: "img",
                attribute: "data-srcset",
                type: "srcset",
              },
            ],
            urlFilter: (attribute, value, resourcePath) => {
              // The `attribute` argument contains a name of the HTML attribute.
              // The `value` argument contains a value of the HTML attribute.
              // The `resourcePath` argument contains a path to the loaded HTML file.

              if (/example\.pdf$/.test(value)) {
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

#### `list`

Type:

```ts
type list = {
  tag?: string;
  attribute?: string;
  type?: string;
  filter?: (
    tag: string,
    attribute: string,
    attributes: string,
    resourcePath: string,
  ) => boolean;
}[];
```

Default: [supported tags and attributes](#sources).

Allows to setup which tags and attributes to process and how, as well as the ability to filter some of them.

Using `...` syntax allows you to extend [default supported tags and attributes](#sources).

For example:

**webpack.config.js**

```js
module.exports = {
  module: {
    rules: [
      {
        test: /\.html$/i,
        loader: "html-loader",
        options: {
          sources: {
            list: [
              // All default supported tags and attributes
              "...",
              {
                tag: "img",
                attribute: "data-src",
                type: "src",
              },
              {
                tag: "img",
                attribute: "data-srcset",
                type: "srcset",
              },
              {
                // Tag name
                tag: "link",
                // Attribute name
                attribute: "href",
                // Type of processing, can be `src` or `scrset`
                type: "src",
                // Allow to filter some attributes
                filter: (tag, attribute, attributes, resourcePath) => {
                  // The `tag` argument contains a name of the HTML tag.
                  // The `attribute` argument contains a name of the HTML attribute.
                  // The `attributes` argument contains all attributes of the tag.
                  // The `resourcePath` argument contains a path to the loaded HTML file.

                  if (/my-html\.html$/.test(resourcePath)) {
                    return false;
                  }

                  if (!/stylesheet/i.test(attributes.rel)) {
                    return false;
                  }

                  if (
                    attributes.type &&
                    attributes.type.trim().toLowerCase() !== "text/css"
                  ) {
                    return false;
                  }

                  return true;
                },
              },
            ],
          },
        },
      },
    ],
  },
};
```

If the tag name is not specified it will process all the tags.

> You can use your custom filter to specify HTML elements to be processed.

For example:

**webpack.config.js**

```js
module.exports = {
  module: {
    rules: [
      {
        test: /\.html$/i,
        loader: "html-loader",
        options: {
          sources: {
            list: [
              {
                // Attribute name
                attribute: "src",
                // Type of processing, can be `src` or `scrset`
                type: "src",
                // Allow to filter some attributes (optional)
                filter: (tag, attribute, attributes, resourcePath) =>
                  // The `tag` argument contains a name of the HTML tag.
                  // The `attribute` argument contains a name of the HTML attribute.
                  // The `attributes` argument contains all attributes of the tag.
                  // The `resourcePath` argument contains a path to the loaded HTML file.

                  // choose all HTML tags except img tag
                  tag.toLowerCase() !== "img",
              },
            ],
          },
        },
      },
    ],
  },
};
```

Filter can also be used to extend the supported elements and attributes.

For example, filter can help process meta tags that reference assets:

```js
module.exports = {
  module: {
    rules: [
      {
        test: /\.html$/i,
        loader: "html-loader",
        options: {
          sources: {
            list: [
              {
                tag: "meta",
                attribute: "content",
                type: "src",
                filter: (tag, attribute, attributes, resourcePath) => {
                  if (
                    attributes.value === "og:image" ||
                    attributes.name === "twitter:image"
                  ) {
                    return true;
                  }

                  return false;
                },
              },
            ],
          },
        },
      },
    ],
  },
};
```

> [!NOTE]
>
> source with a `tag` option takes precedence over source without.

Filter can be used to disable default sources.

For example:

```js
module.exports = {
  module: {
    rules: [
      {
        test: /\.html$/i,
        loader: "html-loader",
        options: {
          sources: {
            list: [
              "...",
              {
                tag: "img",
                attribute: "src",
                type: "src",
                filter: () => false,
              },
            ],
          },
        },
      },
    ],
  },
};
```

#### `urlFilter`

Type:

```ts
type urlFilter = (
  attribute: string,
  value: string,
  resourcePath: string,
) => boolean;
```

Default: `undefined`

Allow to filter URLs. All filtered URLs will not be resolved (left in the code as they were written).
Non-requestable sources (for example `<img src="javascript:void(0)">`) are not handled by default.

```js
module.exports = {
  module: {
    rules: [
      {
        test: /\.html$/i,
        loader: "html-loader",
        options: {
          sources: {
            urlFilter: (attribute, value, resourcePath) => {
              // The `attribute` argument contains a name of the HTML attribute.
              // The `value` argument contains a value of the HTML attribute.
              // The `resourcePath` argument contains a path to the loaded HTML file.

              if (/example\.pdf$/.test(value)) {
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

#### `scriptingEnabled`

Type:

```ts
type scriptingEnabled = boolean;
```

Default: `true`

By default, the parser in `html-loader` interprets content inside `<noscript>` tags as plain `#text`, so processing of content inside these tags will is ignored during processing.

In order to enable processing inside `<noscript>` for content recognition by the parser as `#AST`, set this option to: `false`

Additional information: [scriptingEnabled](https://parse5.js.org/interfaces/parse5.ParserOptions.html#scriptingEnabled)

**webpack.config.js**

```js
module.exports = {
  module: {
    rules: [
      {
        test: /\.html$/i,
        loader: "html-loader",
        options: {
          sources: {
            // Enables processing inside the <noscript> tag
            scriptingEnabled: false,
          },
        },
      },
    ],
  },
};
```

### `preprocessor`

Type:

```ts
type preprocessor = (content: string, loaderContext: LoaderContext) => string;
```

Default: `undefined`

Allows pre-processing of content before handling by the loader.

> [!WARNING]
>
> You should always return valid HTML.

**file.hbs**

```hbs
<div>
  <p>{{firstname}} {{lastname}}</p>
  <img src="image.png" alt="alt" />
<div>
```

#### `function`

You can set the `preprocessor` option as a `function` instance.

**webpack.config.js**

```js
const Handlebars = require("handlebars");

module.exports = {
  module: {
    rules: [
      {
        test: /\.hbs$/i,
        loader: "html-loader",
        options: {
          preprocessor: (content, loaderContext) => {
            let result;

            try {
              result = Handlebars.compile(content)({
                firstname: "Value",
                lastname: "OtherValue",
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

You can also set the `preprocessor` option as an asynchronous function instance.

For example:

**webpack.config.js**

```js
const Handlebars = require("handlebars");

module.exports = {
  module: {
    rules: [
      {
        test: /\.hbs$/i,
        loader: "html-loader",
        options: {
          preprocessor: async (content, loaderContext) => {
            let result;

            try {
              result = await Handlebars.compile(content)({
                firstname: "Value",
                lastname: "OtherValue",
              });
            } catch (error) {
              await loaderContext.emitError(error);

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

### `postprocessor`

Type:

```ts
type postprocessor = (content: string, loaderContext: LoaderContext) => string;
```

Default: `undefined`

Allows post-processing of content after replacing all attributes (like `src`/`srcset`/etc).

**file.html**

```html
<img src="image.png" />
<img src="<%= 'Hello ' + (1+1) %>" />
<img src="<%= require('./image.png') %>" />
<img src="<%= new URL('./image.png', import.meta.url) %>" />
<div><%= require('./gallery.html').default %></div>
```

#### `function`

You can set the `postprocessor` option as a `function` instance.

**webpack.config.js**

```js
const Handlebars = require("handlebars");

module.exports = {
  module: {
    rules: [
      {
        test: /\.html$/i,
        loader: "html-loader",
        options: {
          postprocessor: (content, loaderContext) => {
            // When you environment supports template literals (using browserslist or options) we will generate code using them
            const isTemplateLiteralSupported = content[0] === "`";

            return content
              .replaceAll("<%=", isTemplateLiteralSupported ? "${" : '" +')
              .replaceAll("%>", isTemplateLiteralSupported ? "}" : '+ "');
          },
        },
      },
    ],
  },
};
```

You can also set the `postprocessor` option as an asynchronous `function` instance.

For example:

**webpack.config.js**

```js
const Handlebars = require("handlebars");

module.exports = {
  module: {
    rules: [
      {
        test: /\.hbs$/i,
        loader: "html-loader",
        options: {
          postprocessor: async (content, loaderContext) => {
            const value = await getValue();
            // When you environment supports template literals (using browserslist or options) we will generate code using them
            const isTemplateLiteralSupported = content[0] === "`";

            return content
              .replaceAll("<%=", isTemplateLiteralSupported ? "${" : '" +')
              .replaceAll("%>", isTemplateLiteralSupported ? "}" : '+ "')
              .replace("my-value", value);
          },
        },
      },
    ],
  },
};
```

### `minimize`

Type:

```ts
type minimize =
  | boolean
  | {
      caseSensitive?: boolean;
      collapseWhitespace?: boolean;
      conservativeCollapse?: boolean;
      keepClosingSlash?: boolean;
      minifyCSS?: boolean;
      minifyJS?: boolean;
      removeComments?: boolean;
      removeRedundantAttributes?: boolean;
      removeScriptTypeAttributes?: boolean;
      removeStyleLinkTypeAttributes?: boolean;
    };
```

Default: `true` in production mode, otherwise `false`

Use this option to enable or customize HTML minimization with `html-loader`.

#### `boolean`

The enabled rules for minimizing by default are the following ones:

```js
({
  caseSensitive: true,
  collapseWhitespace: true,
  conservativeCollapse: true,
  keepClosingSlash: true,
  minifyCSS: true,
  minifyJS: true,
  removeComments: true,
  removeRedundantAttributes: true,
  removeScriptTypeAttributes: true,
  removeStyleLinkTypeAttributes: true,
});
```

**webpack.config.js**

```js
module.exports = {
  module: {
    rules: [
      {
        test: /\.html$/i,
        loader: "html-loader",
        options: {
          minimize: true,
        },
      },
    ],
  },
};
```

#### `object`

**webpack.config.js**

See [html-minifier-terser](https://github.com/DanielRuf/html-minifier-terser)'s documentation for more information on the available options.

The default rules can be overridden using the following options in your `webpack.config.js`

**webpack.config.js**

```js
module.exports = {
  module: {
    rules: [
      {
        test: /\.html$/i,
        loader: "html-loader",
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

The default rules can be extended:

**webpack.config.js**

```js
const { defaultMinimizerOptions } = require("html-loader");

module.exports = {
  module: {
    rules: [
      {
        test: /\.html$/i,
        loader: "html-loader",
        options: {
          minimize: {
            ...defaultMinimizerOptions,
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

Type:

```ts
type esModule = boolean;
```

Default: `true`

By default, `html-loader` generates JS modules that use the ES modules syntax.
There are some cases in which using ES modules is beneficial, such as [module concatenation](https://webpack.js.org/plugins/module-concatenation-plugin/) and [tree shaking](https://webpack.js.org/guides/tree-shaking/).

If you want to generate CommonJS modules instead (e.g., `module.exports =`), set:

**webpack.config.js**

```js
module.exports = {
  module: {
    rules: [
      {
        test: /\.html$/i,
        loader: "html-loader",
        options: {
          esModule: false,
        },
      },
    ],
  },
};
```

## Examples

### Disable URL resolving using the `<!-- webpackIgnore: true -->` comment

Use the `<!-- webpackIgnore: true -->` comment to prevent html-loader from processing URLs for the next HTML tag. This is useful when you don’t want Webpack to handle asset imports automatically.

```html
<!-- Disabled url handling for the src attribute -->
<!-- webpackIgnore: true -->
<img src="image.png" />

<!-- Disabled url handling for the src and srcset attributes -->
<!-- webpackIgnore: true -->
<img
  srcset="image.png 480w, image.png 768w"
  src="image.png"
  alt="Elva dressed as a fairy"
/>

<!-- Disabled url handling for the content attribute -->
<!-- webpackIgnore: true -->
<meta itemprop="image" content="./image.png" />

<!-- Disabled url handling for the href attribute -->
<!-- webpackIgnore: true -->
<link rel="icon" type="image/png" sizes="192x192" href="./image.png" />
```

### roots

With [`resolve.roots`](https://webpack.js.org/configuration/resolve/#resolveroots) one can specify a list of directories where requests of server-relative URLs (starting with '/') are resolved.

**webpack.config.js**

```js
module.exports = {
  context: __dirname,
  module: {
    rules: [
      {
        test: /\.html$/i,
        loader: "html-loader",
        options: {},
      },
      {
        test: /\.jpg$/,
        type: "asset/resource",
      },
    ],
  },
  resolve: {
    roots: [path.resolve(__dirname, "fixtures")],
  },
};
```

**file.html**

```html
<img src="/image.jpg" />
```

```js
// => image.jpg in __dirname/fixtures will be resolved
```

### CDN

**webpack.config.js**

```js
module.exports = {
  module: {
    rules: [
      {
        test: /\.jpg$/,
        type: "asset/resource",
      },
      {
        test: /\.png$/,
        type: "asset/inline",
      },
    ],
  },
  output: {
    publicPath: "http://cdn.example.com/[fullhash]/",
  },
};
```

**file.html**

```html
<img src="image.jpg" data-src="image2x.png" />
```

**index.js**

```js
require("html-loader!./file.html");

// => '<img src="http://cdn.example.com/49eba9f/a992ca.jpg" data-src="image2x.png">'
```

```js
require('html-loader?{"sources":{"list":[{"tag":"img","attribute":"data-src","type":"src"}]}}!./file.html');

// => '<img src="image.jpg" data-src="data:image/png;base64,..." >'
```

```js
require('html-loader?{"sources":{"list":[{"tag":"img","attribute":"src","type":"src"},{"tag":"img","attribute":"data-src","type":"src"}]}}!./file.html');

// => '<img src="http://cdn.example.com/49eba9f/a992ca.jpg" data-src="data:image/png;base64,..." >'
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
<!doctype html>
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
        test: /\.html$/,
        type: "asset/resource",
        generator: {
          filename: "[name][ext]",
        },
      },
      {
        test: /\.html$/i,
        use: ["html-loader"],
      },
      {
        test: /\.js$/i,
        exclude: /\.file.js$/i,
        loader: "babel-loader",
      },
      {
        test: /\.file.js$/i,
        type: "asset/resource",
      },
      {
        test: /\.css$/i,
        exclude: /\.file.css$/i,
        loader: "css-loader",
      },
      {
        test: /\.file.css$/i,
        type: "asset/resource",
      },
    ],
  },
};
```

### Templating

You can use any templating engine by leveraging the preprocessor option in html-loader. The preprocessor function receives the file content and the loader context, allowing you to transform the HTML before it’s processed by webpack.

Below is an example for [handlebars](https://handlebarsjs.com/).

**file.hbs**

```hbs
<div>
  <p>{{firstname}} {{lastname}}</p>
  <img src="image.png" alt="alt" />
<div>
```

**webpack.config.js**

```js
const Handlebars = require("handlebars");

module.exports = {
  module: {
    rules: [
      {
        test: /\.hbs$/i,
        loader: "html-loader",
        options: {
          preprocessor: (content, loaderContext) => {
            let result;

            try {
              result = Handlebars.compile(content)({
                firstname: "Value",
                lastname: "OtherValue",
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

This setup will transform the `file.hbs` template using Handlebars before passing the result to `html-loader`.

### PostHTML

You can use [PostHTML](https://github.com/posthtml/posthtml) to transform HTML before it's processed, without needing additional loaders.
This is useful for tasks like converting image formats, adding attributes, or restructuring markup.

**file.html**

```html
<img src="image.jpg" />
```

**webpack.config.js**

```js
const posthtml = require("posthtml");
const posthtmlWebp = require("posthtml-webp");

module.exports = {
  module: {
    rules: [
      {
        test: /\.hbs$/i,
        loader: "html-loader",
        options: {
          preprocessor: (content, loaderContext) => {
            let result;

            try {
              result = posthtml().use(plugin).process(content, { sync: true });
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

A very common scenario is exporting the HTML into their own _.html_ file, to serve them directly instead of injecting with javascript.
This can be achieved with a combination of html-loader and [`asset modules`](https://webpack.js.org/guides/asset-modules/).

The html-loader will parse the URLs, require the images and everything you
expect. The extract loader will parse the javascript back into a proper html
file, ensuring images are required and point to proper path, and the [`asset modules`](https://webpack.js.org/guides/asset-modules/)
will write the _.html_ file for you. Example:

**webpack.config.js**

```js
module.exports = {
  output: {
    assetModuleFilename: "[name][ext]",
  },
  module: {
    rules: [
      {
        test: /\.html$/,
        type: "asset/resource",
        generator: {
          filename: "[name][ext]",
        },
      },
      {
        test: /\.html$/i,
        use: ["html-loader"],
      },
    ],
  },
};
```

## Contributing

We welcome all contributions!
If you're new here, please take a moment to review our contributing guidelines before submitting issues or pull requests.

[CONTRIBUTING](./.github/CONTRIBUTING.md)

## License

[MIT](./LICENSE)

[npm]: https://img.shields.io/npm/v/html-loader.svg
[npm-url]: https://npmjs.com/package/html-loader
[node]: https://img.shields.io/node/v/html-loader.svg
[node-url]: https://nodejs.org
[tests]: https://github.com/webpack-contrib/html-loader/workflows/html-loader/badge.svg
[tests-url]: https://github.com/webpack-contrib/html-loader/actions
[cover]: https://codecov.io/gh/webpack-contrib/html-loader/branch/master/graph/badge.svg
[cover-url]: https://codecov.io/gh/webpack-contrib/html-loader
[discussion]: https://img.shields.io/github/discussions/webpack/webpack
[discussion-url]: https://github.com/webpack/webpack/discussions
[size]: https://packagephobia.now.sh/badge?p=html-loader
[size-url]: https://packagephobia.now.sh/result?p=html-loader
