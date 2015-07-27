var Parser = require('fastparse'),
    processMatch,
    parser;

processMatch = function (match, strUntilValue, name, value, index) {
    if (!this.isRelevantTagAttr(this.currentTag, name)) {
        return;
    }

    this.results.push({
        start: index + strUntilValue.length,
        length: value.length,
        value: value
    });
};

parser = new Parser({
    outside: {
        '<!--.*?-->': true,
        '<![CDATA[.*?]]>': true,
        '<[!\\?].*?>': true,
        '<\/[^>]+>': true,
        '<([a-zA-Z\\-:]+)\\s*': function(match, tagName) {
            this.currentTag = tagName;
            return 'inside';
        }
    },
    inside: {
        // eat up whitespace
        '\\s+': true,
        // end of attributes
        '>': 'outside',
        '(([a-zA-Z\\-]+)\\s*=\\s*\")([^\"]*)\"': processMatch,
        '(([a-zA-Z\\-]+)\\s*=\\s*\')([^\']*)\'': processMatch,
        '(([a-zA-Z\\-]+)\\s*=\\s*)([^\\s>]+)': processMatch
    }
});

module.exports = function (html, isRelevantTagAttr) {
    return parser.parse('outside', html, {
        currentTag: null,
        results: [],
        isRelevantTagAttr: isRelevantTagAttr
    }).results;
};
