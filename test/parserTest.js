var should = require("should");

var attrParse = require("../lib/attributesParser");

function test(name, html, result) {
	it("should parse " + name, function() {
		attrParse(html, function(tag, attr) {
			if(tag === "img" && attr === "src") return true;
			if(tag === "link" && attr === "href") return true;
			if(tag === "div" && attr === "data-videomp4") return true;
			if(tag === "use" && attr === "xlink:href") return true;
			if(tag === "div" && attr === "style") return true;
			return false;
		}).map(function(match) {
			return match.value
		}).should.be.eql(result);
	});
}

describe("parser", function() {
	test("normal", 'Text <img src="image.png"><img src="image2.png">', ["image.png", "image2.png"]);
	test("single-quotes", "Text <img src='image.png'><img src='image2.png'>", ["image.png", "image2.png"]);
	test("whitespace", 'T ex t  <img \t  src =   "image.png"   >  <img\t\nsrc\n=\n"image2.png"\n>', ["image.png", "image2.png"]);
	test("whitespace2", 'Text < img src="image.png" >', []);
	test("wrong <", 'Text <<img src="image.png">', ["image.png"]);
	test("wrong >", 'Text ><img src="image.png">', ["image.png"]);
	test("no quot", '<img src=image.png>', ["image.png"]);
	test("first tag", '<img src="image.png">', ["image.png"]);
	test("comment", '<!--<img src="image.png">-->', []);
	test("comment2", '<!--<!--<img src="image.png">-->', []);
	test("comment3", '<!--><img src="image.png">-->', []);
	test("comment4", '<!----><img src="image.png">-->', ["image.png"]);
	test("tags", '<img src="image.png"><script src="script.js"></script><link type="stylesheet" href="style.css">', ["image.png", "style.css"]);
	test("cdata", '<![CDATA[<img src="image.png">]]><img src="image2.png">', ["image2.png"]);
	test("doctype", '<!doctype html><img src="image.png">', ["image.png"]);
	test("alphanumeric", '<div data-videomp4="video.mp4"></div>', ["video.mp4"]);
	test("use", '<use xlink:href="vector.svg" />', ["vector.svg"]);
	test("use", '<use xlink:href="vector.svg" />', ["vector.svg"]);
	test("inline style url", '<div style="background-image: url(\'image.png\')"></div>', ["image.png"]);
	test("inline style url w/ outer single quotes", '<div style=\'background-image: url("image.png")\'></div>', ["image.png"]);
	test("inline style url w/ no quotes", '<div style="background-image: url(image.png)"></div>', ["image.png"]);
	test("inline style url w/ outer single quotes and no inner quotes", '<div style=\'background-image: url(image.png)\'></div>', ["image.png"]);
	test("inline style url w/ other quotes", '<div style="font-family: \'test\', serif; background-image: url(image.png);"></div>', ["image.png"]);
	test("inline style url w/ escaped other quotes", '<div style="font-family: \\"test\\", serif; background-image: url(image.png);"></div>', ["image.png"]);
	test("inline style multiple urls", '<div style="background-image: url(\'image.png\'); list-style: square url(\'image2.png\')"></div>', ["image.png", "image2.png"]);
});

describe("locations", function() {
	it("should report correct locations", function() {
		attrParse('<img  src= "image.png">', function() {
			return true
		}).should.be.eql([{
			start: 12,
			length: 9,
			value: "image.png"
		}]);
	});
});
