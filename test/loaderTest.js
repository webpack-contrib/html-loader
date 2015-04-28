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
	it("should not make bad things with templates", function() {
		loader.call({}, '<h3>#{number} {customer}</h3>\n<p>   {title}   </p>').should.be.eql(
			'module.exports = "<h3>#{number} {customer}</h3>\\n<p>   {title}   </p>";'
		);
	});
	it("should minimize", function() {
		loader.call({
			minimize: true
		}, '<!-- comment --><h3>#{number} {customer}</h3>\n<p>   {title}   </p>\n\t <!-- comment --> <img src="image.png" />').should.be.eql(
			'module.exports = "<h3>#{number} {customer}</h3><p>{title}</p><img src=" + require("./image.png") + ">";'
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
});
