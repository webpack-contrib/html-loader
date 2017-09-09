/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/
var Parser = require("fastparse");

var processMatch = function(match, strUntilValue, name, value, index) {
	if(!this.isRelevantTagAttr(this.currentTag, name)) return;
	this.results.push({
		start: index + strUntilValue.length,
		length: value.length,
		value: value
	});
};

var parser = new Parser({
	outside: {
		"<!--.*?-->": true,
		"<![CDATA[.*?]]>": true,
		"<[!\\?].*?>": true,
		"<\/[^>]+>": true,
		"<([a-zA-Z\\-:]+)\\s*": function(match, tagName) {
			this.currentTag = tagName;
			return "inside";
		}
	},
	inside: {
		"\\s+": true, // eat up whitespace
		">": "outside", // end of attributes
		"style\\s*=\\s*\"": 'styleAttr',
		"style\\s*=\\s*\'": 'styleAttrSingleQuote',
		"(([0-9a-zA-Z\\-:]+)\\s*=\\s*\")([^\"]*)\"": processMatch,
		"(([0-9a-zA-Z\\-:]+)\\s*=\\s*\')([^\']*)\'": processMatch,
		"(([0-9a-zA-Z\\-:]+)\\s*=\\s*)([^\\s>]+)": processMatch
	},
	styleAttr: {
		"\\s+": true, // eat up whitespace
		"\"": "inside", // end of style attribute
		"((url\\(\'))([^\\)]*)\'\\)": function(match, strUntilValue, name, value, index) {
			return processMatch.call(this, match, strUntilValue, 'style', value, index)
		}
	},
	styleAttrSingleQuote: {
		"\\s+": true, // eat up whitespace
		"\'": "inside", // end of style attribute
		"((url\\(\"))([^\\)]*)\"\\)": function(match, strUntilValue, name, value, index) {
			return processMatch.call(this, match, strUntilValue, 'style', value, index)
		}
	}
});

module.exports = function parse(html, isRelevantTagAttr) {
	return parser.parse("outside", html, {
		currentTag: null,
		results: [],
		isRelevantTagAttr: isRelevantTagAttr
	}).results;
};
