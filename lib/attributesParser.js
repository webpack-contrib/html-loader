/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/
var Parser = require("fastparse");

var srcsetQualifierRegexp = /\s+\d+[x|w]\s*$/;

var processMatch = function(match, strUntilValue, name, value, index) {
	if(!this.isRelevantTagAttr(this.currentTag, name)) return;
	debugger

	// allow to load several urls in srcsets, separated by commas
	var start = index + strUntilValue.length;
	var subMatches = value.split(/,/);
	for (var i = 0; i<subMatches.length; ++i) {
		var subMatch = subMatches[i];

		// remove srcset qualifiers (2x, 110w, etc.), if any
		var qualifier = srcsetQualifierRegexp.exec(subMatch);
		var qualifierLength = qualifier ? qualifier[0].length : 0;
		var length = subMatch.length - qualifierLength;

		this.results.push({
			start: start + (i == 0 ? 0 : 1),
			length: length,
			value: subMatch.substr(0, length)
		});

		start += subMatch.length;
	}
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
