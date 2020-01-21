import Parser from 'fastparse';

function processMatch(match, strUntilValue, name, value, index) {
  if (!this.isRelevantTagAttr(this.currentTag, name)) {
    return;
  }

  this.results.push({
    start: index + strUntilValue.length,
    length: value.length,
    value,
  });
}

const parser = new Parser({
  outside: {
    '<!--.*?-->': true,
    '<![CDATA[.*?]]>': true,
    '<[!\\?].*?>': true,
    '</[^>]+>': true,
    '<([a-zA-Z\\-:]+)\\s*': function matchTag(match, tagName) {
      this.currentTag = tagName;

      return 'inside';
    },
  },
  inside: {
    // eat up whitespace
    '\\s+': true,
    // end of attributes
    '>': 'outside',
    '(([0-9a-zA-Z\\-:]+)\\s*=\\s*")([^"]*)"': processMatch,
    "(([0-9a-zA-Z\\-:]+)\\s*=\\s*')([^']*)'": processMatch,
    '(([0-9a-zA-Z\\-:]+)\\s*=\\s*)([^\\s>]+)': processMatch,
  },
});

export default function parseAttributes(html, isRelevantTagAttr) {
  return parser.parse('outside', html, {
    currentTag: null,
    results: [],
    isRelevantTagAttr,
  }).results;
}
