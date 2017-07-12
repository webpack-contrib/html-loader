var should = require("should");

var loader = require("../");

describe("loader", function() {
	it("should convert to requires", function() {
		loader.call({}, 'Text <img src="image.png"><img src="~bootstrap-img"> Text').should.be.eql(
			'module.exports = "Text <img src=\\"" + require("./image.png") + "\\"><img src=\\"" + require("bootstrap-img") + "\\"> Text";'
		);
	});
	it("should accept attrs from query", function() {
		loader.call({
			query: "?attrs=script:src"
		}, 'Text <script src="script.js"><img src="image.png">').should.be.eql(
			'module.exports = "Text <script src=\\"" + require("./script.js") + "\\"><img src=\\"image.png\\">";'
		);
	});
	it("should accept attrs from query (space separated)", function() {
		loader.call({
			query: "?attrs=script:src img:src"
		}, 'Text <script src="script.js"><img src="image.png">').should.be.eql(
			'module.exports = "Text <script src=\\"" + require("./script.js") + "\\"><img src=\\"" + require("./image.png") + "\\">";'
		);
	});
	it("should accept attrs from query (multiple)", function() {
		loader.call({
			query: "?attrs[]=script:src&attrs[]=img:src"
		}, 'Text <script src="script.js"><img src="image.png">').should.be.eql(
			'module.exports = "Text <script src=\\"" + require("./script.js") + "\\"><img src=\\"" + require("./image.png") + "\\">";'
		);
	});
	it("should accept :attribute (empty tag) from query", function() {
		loader.call({
			query: "?attrs[]=:custom-src"
		}, 'Text <custom-element custom-src="image1.png"><custom-img custom-src="image2.png"/></custom-element>').should.be.eql(
			'module.exports = "Text <custom-element custom-src=\\"" + require("./image1.png") + "\\"><custom-img custom-src=\\"" + require("./image2.png") + "\\"/></custom-element>";'
		);
	});
	it("should not make bad things with templates", function() {
		loader.call({}, '<h3>#{number} {customer}</h3>\n<p>   {title}   </p>').should.be.eql(
			'module.exports = "<h3>#{number} {customer}</h3>\\n<p>   {title}   </p>";'
		);
	});
	it("should minimize", function() {
		loader.call({
			minimize: true
		}, '<!-- comment --><h3 customAttr="">#{number} {customer}</h3>\n<p>   {title}   </p>\n\t <!-- comment --> <img src="image.png" />').should.be.eql(
			'module.exports = "<h3 customattr=\\"\\">#{number} {customer}</h3> <p> {title} </p> <img src=\" + require("./image.png") + \" />";'
		);
	});
	// https://github.com/webpack/webpack/issues/752
	it("should not remove attributes by default", function() {
		loader.call({
			minimize: true
		}, '<input type="text" />').should.be.eql(
			'module.exports = "<input type=text />";'
		);
	});
	it("should preserve comments", function() {
		loader.call({
			minimize: true,
			query: "?-removeComments"
		}, '<!-- comment --><h3 customAttr="">#{number} {customer}</h3><p>{title}</p><!-- comment --><img src="image.png" />').should.be.eql(
			'module.exports = "<!-- comment --><h3 customattr=\\"\\">#{number} {customer}</h3><p>{title}</p><!-- comment --><img src=\" + require("./image.png") + \" />";'
		);
	});

	it("should preserve comments and white spaces when minimizing (via webpack config property)", function() {
		loader.call({
			minimize: true,
			options: {
				htmlLoader: {
					removeComments: false,
					collapseWhitespace: false
				}
			}
		}, '<!-- comment --><h3 customAttr="">#{number} {customer}</h3><p>{title}</p>    <!-- comment -->    <img src="image.png" />').should.be.eql(
			'module.exports = "<!-- comment --><h3 customattr=\\"\\">#{number} {customer}</h3><p>{title}</p>    <!-- comment -->    <img src=\" + require("./image.png") + \" />";'
		);
	});

	it("should preserve comments and white spaces when minizing (via webpack config property)", function() {
		loader.call({
			options: {
				htmlLoader: {
					minimize: true,
					removeComments: false,
					collapseWhitespace: false
				}
			}
		}, '<!-- comment --><h3 customAttr="">#{number} {customer}</h3><p>{title}</p>    <!-- comment -->    <img src="image.png" />').should.be.eql(
			'module.exports = "<!-- comment --><h3 customattr=\\"\\">#{number} {customer}</h3><p>{title}</p>    <!-- comment -->    <img src=\" + require("./image.png") + \" />";'
		);
	});

	it("should treat attributes as case sensitive", function() {
		loader.call({
			minimize: true,
			query: "?caseSensitive"
		}, '<!-- comment --><h3 customAttr="">#{number} {customer}</h3><p>{title}</p><!-- comment --><img src="image.png" />').should.be.eql(
			'module.exports = "<h3 customAttr=\\"\\">#{number} {customer}</h3><p>{title}</p><img src=\" + require("./image.png") + \" />";'
		);
	});
	it("should accept complex options via a webpack config property", function() {
		loader.call({
			minimize: true,
			options: {
				htmlLoader: {
					ignoreCustomFragments: [/\{\{.*?}}/]
				}
			}
		}, '<h3>{{ count <= 1 ? "foo" : "bar" }}</h3>').should.be.eql(
			'module.exports = "<h3>{{ count <= 1 ? \\"foo\\" : \\"bar\\" }}</h3>";'
		);
	});
	it("should allow the webpack config property name to be configured", function() {
		loader.call({
			minimize: true,
			options: {
				htmlLoaderSuperSpecialConfig: {
					ignoreCustomFragments: [/\{\{.*?}}/]
				}
			},
			query: '?config=htmlLoaderSuperSpecialConfig'
		}, '<h3>{{ count <= 1 ? "foo" : "bar" }}</h3>').should.be.eql(
			'module.exports = "<h3>{{ count <= 1 ? \\"foo\\" : \\"bar\\" }}</h3>";'
		);
	});
	it("should not translate root-relative urls (without root query)", function() {
		loader.call({}, 'Text <img src="/image.png">').should.be.eql(
			'module.exports = "Text <img src=\\"/image.png\\">";'
		);
	});
	it("should accept root from query", function() {
		loader.call({
			query: "?root=/test"
		}, 'Text <img src="/image.png">').should.be.eql(
			'module.exports = "Text <img src=\\"" + require("/test/image.png") + "\\">";'
		);
	});
	it("should ignore hash fragments in URLs", function() {
		loader.call({}, '<img src="icons.svg#hash">').should.be.eql(
			'module.exports = "<img src=\\"" + require("./icons.svg") + "#hash\\">";'
		);
	});
	it("should ignore interpolations by default", function() {
		loader.call({}, '<img src="${"Hello " + (1+1)}">').should.be.eql(
			'module.exports = "<img src=\\"${\\"Hello \\" + (1+1)}\\">";'
		);
	});
	it("should enable interpolations when using interpolate flag", function() {
		loader.call({
			query: "?interpolate"
		}, '<img src="${"Hello " + (1+1)}">').should.be.eql(
			'module.exports = "<img src=\\"" + ("Hello " + (1 + 1)) + "\\">";'
		);
	});
	it("should enable interpolations when using interpolate=require flag and only require function to be translate", function() {
		loader.call({
			query: "?interpolate=require"
		}, '<a href="${list.href}"><img src="${require("./test.jpg")}" /></a>').should.be.eql(
			'module.exports = "<a href=\\"${list.href}\\"><img src=\\"" + require("./test.jpg") + "\\" /></a>";'
		);
	});
	it("should export as default export for es6to5 transpilation", function() {
		loader.call({
			query: "?exportAsDefault"
		}, '<p>Hello world!</p>').should.be.eql(
			'exports.default = "<p>Hello world!</p>";'
		);
	});
	it("should export as es6 default export", function() {
		loader.call({
			query: "?exportAsEs6Default"
		}, '<p>Hello world!</p>').should.be.eql(
			'export default "<p>Hello world!</p>";'
		);
	});
});
