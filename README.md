# html loader for webpack

Exports HTML as string. HTML is minimized when the compiler demands.

By default every local `<img src="image.png">` is required (`require("./image.png")`). You may need to specify loaders for images in your configuration (recommended `file-loader` or `url-loader`).

You can specify which tag-attribute combination should be processed by this loader via the query parameter `attrs`. Pass an array or a space-separated list of `<tag>:<attribute>` combinations. (Default: `attrs=img:src`)

## Examples

With this configuration:

``` javascript
{
	module: { loaders: [
		{ test: "\.jpg$", loader: "file-loader" },
		{ test: "\.png$", loader: "url-loader?mimetype=image/png" }
	]},
	output: {
		publicPath: "http://cdn.example.com/[hash]/"
	}
}
```

``` html
<!-- fileA.html -->
<img  src="image.jpg"  data-src="image2x.png" >
```

``` javascript
require("html!./fileA.html");
// => '<img  src="http://cdn.example.com/49e...ba9f/a9f...92ca.jpg"  data-src="image2x.png" >'

require("html?attrs=img:data-src!./file.html");
// => '<img  src="image.png"  data-src="data:image/png;base64,..." >'

require("html?attrs=img:src img:data-src!./file.html");
require("html?attrs[]=img:src&attrs[]=img:data-src!./file.html");
// => '<img  src="http://cdn.example.com/49e...ba9f/a9f...92ca.jpg"  data-src="data:image/png;base64,..." >'

/// minimized by running `webpack --optimize-minimize`
// => '<img src=http://cdn.example.com/49e...ba9f/a9f...92ca.jpg data-src=data:image/png;base64,...>'
```

## License

MIT (http://www.opensource.org/licenses/mit-license.php)
