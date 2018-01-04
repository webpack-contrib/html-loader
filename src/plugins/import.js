/* eslint-disable */
// External URL (Protocol URL)
const URL = /^\w+:\/\//;
const TAGS = [ { tag: 'import' }, { tag: 'include' } ];

const filter = (url, options) => {
  if (URL.test(url)) {
    return true;
  }

  if (url.startsWith('//')) {
    return true;
  }

  if (options.import instanceof RegExp) {
    return options.import.test(url);
  }

  if (typeof options.import === 'function') {
    return options.import(url);
  }
  
  return false;
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
