/* eslint-disable */
import { getOptions } from 'loader-utils';
import validateOptions from 'schema-utils';

import posthtml from 'posthtml';
import urls from './lib/plugins/url';
import imports from './lib/plugins/import';
import minifier from 'htmlnano';

import schema from './options.json';
import LoaderError from './lib/Error';

// Loader Defaults
const defaults = {
  url: true,
  import: true,
  minimize: false,
  template: false,
};

export default function loader(html, map, meta) {
  // Loader Options
  const options = Object.assign(defaults, getOptions(this));

  validateOptions(schema, options, 'HTML Loader');
  // Make the loader async
  const cb = this.async();
  const file = this.resourcePath;

  // HACK add Module.type
  this._module.type = 'text/html';

  const template = options.template
    ? typeof options.template === 'string'
      ? options.template
      : '_'
    : false;

  const plugins = [];

  if (options.url) plugins.push(urls());
  if (options.import) plugins.push(imports({ template }));
  // TODO(michael-ciniawsky)
  // <imports src=""./file.html"> aren't minified (#160)
  if (options.minimize) plugins.push(minifier());

  // Reuse HTML AST (PostHTML AST) if available
  // (e.g posthtml-loader) to avoid HTML reparsing
  if (meta && meta.ast && meta.ast.type === 'posthtml') {
    html = meta.ast.root;
  }

  posthtml(plugins)
    .process(html, { from: file, to: file })
    .then(({ html, messages }) => {
      let urls = messages[0];
      let imports = messages[1];

      // TODO(michael-ciniawsky) revisit
      // Ensure to cleanup/reset messages
      // during recursive resolving of imports
      messages.length = 0;

      // <img src="./file.png">
      // => import HTML__URL__${idx} from './file.png';
      if (urls) {
        urls = Object.keys(urls)
          .map(url => `import ${url} from '${urls[url]}';`)
          .join('\n');
      }
      // <import src="./file.html">
      // => import HTML__IMPORT__${idx} from './file.html';
      if (imports) {
        imports = Object.keys(imports)
          .map(i => `import ${i} from '${imports[i]}';`)
          .join('\n');
      }

      html = options.template
        ? `function (${template}) { return \`${html}\`; }`
        : `\`${html}\``;

      const result = [
        urls ? `// HTML URLs\n${urls}\n` : false,
        imports ? `// HTML Imports\n${imports}\n` : false,
        `// HTML\nexport default ${html}`,
      ]
        .filter(Boolean)
        .join('\n');

      cb(null, result);

      return null;
    })
    .catch((err) => {
      cb(new LoaderError(err));

      return null;
    });
}
