/* eslint-disable */
// External URL (Protocol URL)
const URL = /^\w+:\/\//;
// TODO(michael-ciniawsky)
// extend with custom matchers
// e.g <custom-element custom-src="">
// (`options.url.filter`) (#159)
const ATTRS = [
  { attrs: { src: true } },
  { attrs: { href: true } },
  { attrs: { srcset: true } },
];

// TODO(michael-ciniawsky)
// add filter method for urls (e.g `options.url.filter`) (#158)
const filter = (url) => {
  return URL.test(url) || url.startsWith('//');
};

export default function (options = {}) {
  return function (ast) {
    let idx = 0;

    ast.match(ATTRS, (node) => {
      // <tag src="path/to/file.ext">
      if (node.attrs.src) {
        // Ignore <import>/<include
        if (node.tag === 'import' || node.tag === 'include') {
          return node;
        }
        
        // Ignore external && filtered urls
        if (filter(node.attrs.src)) {
          return node;
        }
        
        // Add HTML URL to result.messages
        ast.messages.push({
          type: 'import',
          plugin: 'poshtml-url',
          import: `import HTML__URL__${idx} from '${node.attrs.src}';\n` 
        })
        
        // Add content placeholders to HTML
        node.attrs.src = '${' + `HTML__URL__${idx}` + '}';

        idx++;

        return node;
      }
      // <tag href="path/to/file.ext">
      if (node.attrs.href) {
        // Ignore external && filtered urls
        if (filter(node.attrs.href)) {
          return node;
        }

        // Add HTML URL to result.messages
        ast.messages.push({
          type: 'import',
          plugin: 'poshtml-url',
          import: `import HTML__URL__${idx} from '${node.attrs.href}';\n` 
        })

        // Add content placeholder to HTML
        node.attrs.href = '${' + `HTML__URL__${idx}` + '}';

        idx++;

        return node;
      }
      // <tag srcset="path/to/file.ext">
      if (node.attrs.srcset) {
        // Ignore external && filtered urls
        if (filter(node.attrs.srcset)) {
          return node;
        }

        // Add HTML URL to result.messages
        ast.messages.push({
          type: 'import',
          plugin: 'poshtml-url',
          import: `import HTML__URL__${idx} from '${node.attrs.srcset}';\n` 
        })

        // Add content placeholder to HTML
        node.attrs.srcset = '${' + `HTML__URL__${idx}` + '}';

        idx++;

        return node;
      }
    });

    return ast;
  };
}
