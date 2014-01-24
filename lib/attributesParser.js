/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/
var Parser = require("./fastparse");

var RELEVANT_TAG_ATTRS = [
	"img src",
	"link href",
	"script src",
];

function isRelevantTagAttr(tag, attr) {
	return RELEVANT_TAG_ATTRS.indexOf(tag + " " + attr) >= 0;
}

var parser = new Parser({
	outside: {
		"<!--.*?-->": true,
		"<![CDATA[.*?]]>": true,
		"<[!\\?].*?>": true,
		"<\/[^>]+>": true,
		"<([a-zA-Z\\-:]+)\\s*": function(match, tagName) {
			this.currentTag = tagName;
			return "inside";
		},
		"[^<]+": true
	},
	inside: {
		"\\s+": true, // eat up whitespace
		">": "outside", // end of attributes
		"(([a-zA-Z\\-]+)\\s*=\\s*\")([^\"]*)\"": function(match, strUntilValue, name, value, index) {
			if(!isRelevantTagAttr(this.currentTag, name)) return;
			this.links.push({
				start: index + strUntilValue.length,
				length: value.length,
				value: value
			});
		},
		"(([a-zA-Z\\-]+)\\s*=\\s*)([^\\s>]+)": function(match, strUntilValue, name, value, index) {
			if(!isRelevantTagAttr(this.currentTag, name)) return;
			this.links.push({
				start: index + strUntilValue.length,
				length: value.length,
				value: value
			});
		},
		"[a-zA-Z\-]+": true, // attribute without value
		"[^>]+": true // catch parsing errors
	}
});


module.exports = function parse(html) {
	return parser.parse("outside", html, {
		currentTag: null,
		links: []
	}).links;
};