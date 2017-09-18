/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/
var Parser = require("fastparse");

var processMatch = function(match, strUntilValue, name, value, index) {
	if(this.currentTag === "img" && name === "sizes") {
		this.sizes = value;
	}

	if(this.currentTag === "img" && name === "srcset") {
		this.skip = true;
		return;
	}
	if(!this.isRelevantTagAttr(this.currentTag, name)) return;
	this.tmpResults.push({
		start: index + strUntilValue.length,
		length: value.length,
		value: value
	});
};

var pushResult = function() {
	this.tmpResults.forEach(function(result) {
		if(this.sizes && !this.skip) {
			result.sizes = this.sizes;
		}

		this.results.push(result);
	}.bind(this));
	return "outside";
};

var parser = new Parser({
	outside: {
		"<!--.*?-->": true,
		"<![CDATA[.*?]]>": true,
		"<[!\\?].*?>": true,
		"<\/[^>]+>": true,
		"<([a-zA-Z\\-:]+)\\s*": function(match, tagName) {
			this.currentTag = tagName;
			this.tmpResults = [];
			this.sizes = undefined;
			this.skip = false;
			return "inside";
		}
	},
	inside: {
		"\\s+": true, // eat up whitespace
		">": pushResult, // end of attributes
		"(([0-9a-zA-Z\\-:]+)\\s*=\\s*\")([^\"]*)\"": processMatch,
		"(([0-9a-zA-Z\\-:]+)\\s*=\\s*\')([^\']*)\'": processMatch,
		"(([0-9a-zA-Z\\-:]+)\\s*=\\s*)([^\\s>]+)": processMatch
	}
});

module.exports = function parse(html, isRelevantTagAttr) {
	return parser.parse("outside", html, {
		currentTag: null,
		results: [],
		isRelevantTagAttr: isRelevantTagAttr
	}).results;
};
