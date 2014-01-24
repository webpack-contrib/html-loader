var should = require("should");

var loader = require("../");

describe("loader", function() {
	it("should convert to requires", function() {
		loader.call({}, 'Text <img src="image.png"><script src="~bootstrap"> Text').should.be.eql(
			'module.exports = "Text <img src=\\"" + require("./image.png") + "\\"><script src=\\"" + require("bootstrap") + "\\"> Text";'
		);
	});
});