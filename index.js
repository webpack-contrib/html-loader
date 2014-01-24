/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/
var htmlMinifier = require("html-minifier");
var attrParse = require("./lib/attributesParser");
var SourceNode = require("source-map").SourceNode;
var loaderUtils = require("loader-utils");

function randomIdent() {
	return "xxxHTMLLINKxxx" + Math.random() + Math.random() + "xxx";
};


module.exports = function(content) {
	this.cacheable && this.cacheable();
	var links = attrParse(content);
	links.reverse();
	var data = {};
	content = [content];
	links.forEach(function(link) {
		if(/^data:|^(https?:)?\/\//.test(link.value)) return;
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
	return "module.exports = " + JSON.stringify(content.join("")).replace(/xxxHTMLLINKxxx[0-9\.]+xxx/g, function(match) {
		if(!data[match]) return match;
		return '" + require(' + JSON.stringify(urlToRequire(data[match])) + ') + "';
	}) + ";";
}

function urlToRequire(url) {
	if(/^~/.test(url))
		return url.substring(1);
	else
		return "./"+url;
}

