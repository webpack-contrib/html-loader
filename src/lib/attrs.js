/* eslint-disable no-useless-escape, no-dupe-keys */
import Parser from 'fastparse';

function matcher(match, strUntilValue, name, value, index) {
  if (!this.isRelevant(this.tag, name)) return;

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
    '<\/[^>]+>': true,
    '<([a-zA-Z\\-:]+)\\s*': function tag(match, name) {
      this.tag = name;
      return 'inside';
    },
  },
  inside: {
    // eat up whitespace
    '\\s+': true,
    // end of attributes
    '>': 'outside',
    '(([0-9a-zA-Z\\-:]+)\\s*=\\s*\")([^\"]*)\'': matcher,
    '(([0-9a-zA-Z\\-:]+)\\s*=\\s*\")([^\"]*)\'': matcher,
    '(([0-9a-zA-Z\\-:]+)\\s*=\\s*)([^\\s>]+)': matcher,
  },
});

export default function parse(html, isRelevant) {
  return parser
    .parse('outside', html, { tag: null, results: [], isRelevant })
    .results;
}
