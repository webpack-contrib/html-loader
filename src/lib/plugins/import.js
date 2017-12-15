/* eslint-disable */
// External URL (Protocol URL)
const TEST_URL = /^\w+:\/\//;

// TODO(michael-ciniawsky)
// add filter method for urls (e.g `options.import`) (#158)
const filter = (url, options) => {
  return TEST_URL.test(url) || url.startsWith('//');
}

export default function (options = {}) {
  return function (tree) {
    let idx = 0;
    const imports = {};

    tree.match([ { tag: 'import' }, { tag: 'include' } ], (node) => {
      if (node.attrs && node.attrs.src) {
        // Remove <import>/<include> tag
        node.tag = false;

        // TODO(michael-ciniawky)
        // add warning about invalid use of external urls within <import> (#?)

        // Ignore external && filtered urls
        if (filter(node.attrs.src, options)) return;
        // Add url to messages.imports
        imports[`HTML__IMPORT__${idx}`] = node.attrs.src;
        // Add content placeholders to HTML
        node.content = options.template
          ? '${' + `HTML__IMPORT__${idx}(${options.template})` + '}'
          : '${' + `HTML__IMPORT__${idx}` + '}';

        idx++;
      }

      return node;
    });

    // Add imports to result.messages
    tree.messages.push(imports)

    return tree;
  };
}
