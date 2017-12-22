/* eslint-disable */
// External URL (Protocol URL)
const TEST_URL = /^\w+:\/\//;
// TODO(michael-ciniawsky)
// extend with custom matchers
// e.g <custom-element custom-src="">
// (`options.url.filter`) (#159)
const MATCH_ATTRS = [
  { attrs: { src: true } },
  { attrs: { href: true } },
  { attrs: { srcset: true } },
];

// TODO(michael-ciniawsky)
// add filter method for urls (e.g `options.url.filter`) (#158)
const filter = (url, options) => {
  return TEST_URL.test(url) || url.startsWith('//');
};

export default function(options = {}) {
  return function(tree) {
    let idx = 0;
    const urls = {};

    tree.match(MATCH_ATTRS, (node) => {
      // <tag src="path/to/file.ext">
      if (node.attrs.src) {
        // Ignore <import>/<include
        if (node.tag === 'import' || node.tag === 'include') return node;
        // Ignore external && filtered urls
        if (filter(node.attrs.src, options)) return node;
        // Add url to messages.urls
        urls[`HTML__URL__${idx}`] = node.attrs.src;
        // Add content placeholders to HTML
        node.attrs.src = '${' + `HTML__URL__${idx}` + '}';

        idx++;

        return node;
      }
      // <tag href="path/to/file.ext">
      if (node.attrs.href) {
        // Ignore external && filtered urls
        if (filter(node.attrs.href, options)) return node;
        // Add url to messages.urls
        urls[`HTML__URL__${idx}`] = node.attrs.href;
        // Add content placeholder to HTML
        node.attrs.href = '${' + `HTML__URL__${idx}` + '}';

        idx++;

        return node;
      }
      // <tag srcset="path/to/file.ext">
      if (node.attrs.srcset) {
        // Ignore external && filtered urls
        if (filter(node.attrs.srcset, options)) return node;
        // Add url to messages.urls
        urls[`HTML__URL__${idx}`] = node.attrs.srcset;
        // Add content placeholder to HTML
        node.attrs.srcset = '${' + `HTML__URL__${idx}` + '}';

        idx++;

        return node;
      }
    });

    // Add urls to result.messages
    tree.messages.push(urls);

    return tree;
  };
}
