/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/
var htmlMinifier = require("html-minifier");
var attrParse = require("./lib/attributesParser");
var minifyOptionParser = require('./lib/minifyOptionParser');
var SourceNode = require("source-map").SourceNode;
var loaderUtils = require("loader-utils");

function randomIdent() {
	return "xxxHTMLLINKxxx" + Math.random() + Math.random() + "xxx";
};


module.exports = function(content) {
	this.cacheable && this.cacheable();
	var query = loaderUtils.parseQuery(this.query);
	var attributes = ["img:src"];
	if(query.attrs !== undefined) {
		if(typeof query.attrs === "string")
			attributes = query.attrs.split(" ");
		else if(Array.isArray(query.attrs))
			attributes = query.attrs;
		else if(query.attrs === false)
			attributes = [];
		else
			throw new Error("Invalid value to query parameter attrs");
	}
	var root = query.root;
	var links = attrParse(content, function(tag, attr) {
		return attributes.indexOf(tag + ":" + attr) >= 0;
	});
	links.reverse();
	var data = {};
	content = [content];
	links.forEach(function(link) {
		if(!loaderUtils.isUrlRequest(link.value, root)) return;
		do {
			var ident = randomIdent();
		} while(data[ident]);
		data[ident] = link.value;
		var x = content.pop();
		content.push(x.substr(link.start + link.length));
		content.push(ident);
		content.push(x.substr(0, link.start));
	});
	content.reverse();
	content = content.join("");
  
	if(this.minimize) {    
		content = htmlMinifier.minify(content, minifyOptionParser(query));
	}
	return "module.exports = " + JSON.stringify(content).replace(/xxxHTMLLINKxxx[0-9\.]+xxx/g, function(match) {
		if(!data[match]) return match;
		return '" + require(' + JSON.stringify(loaderUtils.urlToRequest(data[match], root)) + ') + "';
	}) + ";";
}
