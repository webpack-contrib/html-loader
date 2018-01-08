/* eslint-disable */
// External URL (Protocol URL)
const URL = /^\w+:\/\//;
const TAGS = [ { tag: 'import' }, { tag: 'include' } ];
// TODO(michael-ciniawsky)
// add filter method for urls (e.g `options.import`) (#158)
const filter = (url) => {
  return URL.test(url) || url.startsWith('//');
};

export default function (options = {}) {
  return function (ast) {
    let idx = 0;

    ast.match(TAGS, (node) => {
      if (node.attrs && node.attrs.src) {
        // Remove <import>/<include> tag
        node.tag = false;

        // Ignore external && filtered urls
        if (filter(node.attrs.src, options)) {
          return false;
        }
        
        // Add content placeholders to HTML
        node.content = options.template
          ? '${' + `HTML__IMPORT__${idx}(${options.template})` + '}'
          : '${' + `HTML__IMPORT__${idx}` + '}';

        // Add HTML Import to result.messages
        ast.messages.push({
          type: 'import',
          plugin: 'poshtml-import',
          import: `import HTML__IMPORT__${idx} from '${node.attrs.src}';\n` 
        })

        idx++;
      }

      return node;
    });

    return ast;
  };
}
