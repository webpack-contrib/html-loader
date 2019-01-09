/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/
var Parser = require("fastparse");

var processMatch = function(match, strUntilValue, name, value, index) {
	if(!this.isRelevantTagAttr(this.currentTag, name)) return;

	if (value.includes(' ')) {
		var prevIndex = 0;
		var nextIndex = 0;
		while((nextIndex = value.indexOf(' ', prevIndex)) !== -1) {
			var part = value.substring(prevIndex, nextIndex);
			if (part.includes(',')) {
				var commaIndex = part.indexOf(',');
				nextIndex = prevIndex + commaIndex;
				part = part.substring(0, commaIndex);
			}

			if (!part.includes('.') || /^\d+(\.\d+)?x$/.test(part) || /^\d+w$/.test(part)) {
				prevIndex = nextIndex + 1;
				continue;
			}

			this.results.push({
				start: index + strUntilValue.length + prevIndex,
				length: part.length,
				value: part
			});
			prevIndex = nextIndex + 1;
		}

		var lastPart = value.substring(prevIndex);
		if (lastPart !== '' && lastPart.includes('.') && !/^\d+(\.\d+)?x$/.test(lastPart)) {
			this.results.push({
				start: index + strUntilValue.length + prevIndex,
				length: lastPart.length,
				value: lastPart
			});
		}

		return;
	}

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
