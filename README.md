# html loader for webpack

Exports HTML as string. HTML is minimized when the compiler demands.

By default every local `<img src="image.png">` is required (`require("./image.png")`). You may need to specify loaders for images in your configuration (recommended `file-loader` or `url-loader`).

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
<img  src="image.jpg"  data-src2x="image2x.png" >
```

``` javascript
require("html!./fileA.html");
// => '<img  src="http://cdn.example.com/49e...ba9f/a9f...92ca.jpg"  data-src2x="image2x.png" >'

require("html?attrs=img:data-src2c!./file.html");
// => '<img  src="image.png"  data-src2x="data:image/png;base64,..." >'

require("html?attrs=img:src img:data-src2c!./file.html");
require("html?attrs[]=img:src&attrs[]=img:data-src2c!./file.html");
// => '<img  src="http://cdn.example.com/49e...ba9f/a9f...92ca.jpg"  data-src2x="data:image/png;base64,..." >'

/// minimized
// => '<img src=http://cdn.example.com/49e...ba9f/a9f...92ca.jpg data-src2x=data:image/png;base64,...>'
```

## License

MIT (http://www.opensource.org/licenses/mit-license.php)
