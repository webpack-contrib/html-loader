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
		"style\\s*=\\s*([\"\'])": function(match, quoteType) {
			this.styleQuoteType = quoteType;
			return "styleAttr";
		},
		"(([0-9a-zA-Z\\-:]+)\\s*=\\s*\")([^\"]*)\"": processMatch,
		"(([0-9a-zA-Z\\-:]+)\\s*=\\s*\')([^\']*)\'": processMatch,
		"(([0-9a-zA-Z\\-:]+)\\s*=\\s*)([^\\s>]+)": processMatch
	},
	styleAttr: {
		"\\s+": true, // eat up whitespace
		"\\\\[\'\"]": true, // eat escaped quotes so the end of style attribute rule doesn't find them
		"([\"\'])": function(match, quoteType) {
			return this.styleQuoteType === quoteType ?
				"inside" : // end of style attribute, beginning and end quotes match
				false;
		},
		"((url\\([\"\']?))([^\"\'\\)]*)[\"\']?\\)": function(match, strUntilValue, name, value, index) {
			return processMatch.call(this, match, strUntilValue, "style", value, index)
		}
	}
});

module.exports = function parse(html, isRelevantTagAttr) {
	return parser.parse("outside", html, {
		currentTag: null,
		styleQuoteType: null,
		results: [],
		isRelevantTagAttr: isRelevantTagAttr
	}).results;
};
