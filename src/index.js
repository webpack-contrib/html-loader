/* eslint-disable
  import/order,
  import/first,
  no-shadow,
  no-param-reassign
*/
import schema from './options.json';
import { getOptions } from 'loader-utils';
import validateOptions from 'schema-utils';

import posthtml from 'posthtml';
import { urls, imports } from '@posthtml/esm';
import minifier from 'htmlnano';

import LoaderError from './Error';

// Loader Defaults
const defaults = {
  url: true,
  import: true,
  minimize: false,
  template: false,
};

export default function loader(html, map, meta) {
  // Loader Options
  const options = Object.assign({}, defaults, getOptions(this));

  validateOptions(schema, options, 'HTML Loader');
  // Make the loader async
  const cb = this.async();
  const file = this.resourcePath;

  options.template = options.template
    ? typeof options.template === 'string' ? options.template : '_'
    : false;

  const plugins = [];

  // HTML URL Plugin
  if (options.url) {
    plugins.push(urls(options));
  }

  // HTML IMPORT Plugin
  if (options.import) {
    plugins.push(imports(options));
  }

  // TODO(michael-ciniawsky)
  // <imports src=""./file.html"> aren't minified (options.template) (#160)
  if (options.minimize) {
    plugins.push(minifier({ collapseWhitespace: 'all' }));
  }

  // Reuse HTML AST (PostHTML AST)
  // (e.g posthtml-loader) to avoid HTML reparsing
  if (meta) {
    if (meta.ast && meta.ast.type === 'posthtml') {
      const { ast } = meta.ast;

      html = ast.root;
    }
  }

  posthtml(plugins)
    .process(html, { from: file, to: file })
    .then(({ html, messages }) => {
      if (meta && meta.messages) {
        messages = messages.concat(meta.messages);
      }

      const imports = messages
        .filter((msg) => (msg.type === 'import' ? msg : false))
        .reduce((imports, msg) => {
          try {
            msg = typeof msg.import === 'function' ? msg.import() : msg.import;

            imports += msg;
          } catch (err) {
            // TODO(michael-ciniawsky)
            // revisit HTMLImportError
            this.emitError(err);
          }

          return imports;
        }, '');

      const exports = messages
        .filter((msg) => (msg.type === 'export' ? msg : false))
        .reduce((exports, msg) => {
          try {
            msg = typeof msg.export === 'function' ? msg.import() : msg.import;

            exports += msg;
          } catch (err) {
            // TODO(michael-ciniawsky)
            // revisit HTMLExportError
            this.emitError(err);
          }

          return exports;
        }, '');

      // TODO(michael-ciniawsky)
      // HACK Ensure to cleanup/reset messages between files
      // @see https://github.com/posthtml/posthtml/pull/250
      messages.length = 0;

      html = options.template
        ? `function (${options.template}) { return \`${html}\`; }`
        : `\`${html}\``;

      const result = [
        imports ? `// HTML Imports\n${imports}\n` : false,
        exports ? `// HTML Exports\n${exports}\n` : false,
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
