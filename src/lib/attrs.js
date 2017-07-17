/* eslint-disable */
import Parser from "fastparse";

function matcher (match, strUntilValue, name, value, index) {
  if (!this.isRelevant(this.tag, name)) return;

  this.results.push({
    start: index + strUntilValue.length,
    length: value.length,
    value: value
  });
};

const parser = new Parser({
  outside: {
    "<!--.*?-->": true,
    "<![CDATA[.*?]]>": true,
    "<[!\\?].*?>": true,
    "<\/[^>]+>": true,
    "<([a-zA-Z\\-:]+)\\s*": function (match, tag) {
      this.tag = tag;
      return "inside";
    }
  },
  inside: {
    "\\s+": true, // eat up whitespace
    ">": "outside", // end of attributes
    "(([0-9a-zA-Z\\-:]+)\\s*=\\s*\")([^\"]*)\"": matcher,
    "(([0-9a-zA-Z\\-:]+)\\s*=\\s*\')([^\']*)\'": matcher,
    "(([0-9a-zA-Z\\-:]+)\\s*=\\s*)([^\\s>]+)": matcher
  }
});

export default function parse (html, isRelevant) {
  return parser
    .parse("outside", html, {
      tag: null,
      results: [],
      isRelevant
    })
    .results;
};
