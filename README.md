# html loader for webpack

Exports HTML as string.

By default every local `<img src="image.png">` is required (`require('./image.png')`). You may need to specify loaders for images in your configuration (recommended `file-loader` or `url-loader`).

## Options

### `minimize`

Default: `true`.

Minimizes HTML.

### `attrs`

Default: `attrs=img:src`.

Specifies which tag-attribute combination should be processed by this loader via the query parameter `attrs`. Pass an array of a space-separated list of `<tag>:<attribute>` combinations.

### `root`

Default: `null`.

Appends value of `root` to all URLs that start with `/`.

See [URLs relative to root](#urls-relative-to-root).

## Usage

[Documentation: Using loaders](http://webpack.github.io/docs/using-loaders.html)

## Examples

With this configuration:

```js
{
    module: {
        loaders: [
            { test: '\.jpg$', loader: 'file-loader' },
            { test: '\.png$', loader: 'url-loader?mimetype=image/png' }
        ]
    },
    output: {
        publicPath: 'http://cdn.example.com/[hash]/'
    }
}
```

```html
<!-- fileA.html -->
<img src='image.jpg' data-src='image2x.png'>
```

```js
require('html!./fileA.html');
// => '<img src="http://cdn.example.com/49e...ba9f/a9f...92ca.jpg" data-src="image2x.png">'

require('html?attrs=img:data-src!./file.html');
// => '<img src="image.png"  data-src="data:image/png;base64,..." >'

require('html?attrs=img:src img:data-src!./file.html');
require('html?attrs[]=img:src&attrs[]=img:data-src!./file.html');
// => '<img src="http://cdn.example.com/49e...ba9f/a9f...92ca.jpg" data-src="data:image/png;base64,..." >'

/// minimized by running `webpack --optimize-minimize`
// => '<img src=http://cdn.example.com/49e...ba9f/a9f...92ca.jpg data-src=data:image/png;base64,...>'

```

## URLs relative to root

URLs that start with a `/` are not translated. If `root` query parameter is set, it will be prepended to the URL that starts with `/`.

With the same configuration above:

```html
<!-- fileB.html -->
<img src="/image.jpg">
```

```js
require("html!./fileB.html");
// => '<img src="/image.jpg">'

require("html?root=.!./fileB.html");
// => '<img src="http://cdn.example.com/49e...ba9f/a9f...92ca.jpg">'
```