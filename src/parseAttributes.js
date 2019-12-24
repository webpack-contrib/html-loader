/* eslint-disable no-useless-escape,line-comment-position */
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
    // eslint-disable-next-line no-useless-escape
    '</[^>]+>': true,
    '<([a-zA-Z\\-:]+)\\s*': function matchTag(match, tagName) {
      this.currentTag = tagName;

      return 'inside';
    },
  },
  inside: {
    '\\s+': true, // eat up whitespace
    '>': 'outside', // end of attributes
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
