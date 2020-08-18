import { getOptions, stringifyRequest } from 'loader-utils';
import validateOptions from 'schema-utils';

import { sourcePlugin, minimizerPlugin } from './plugins';
import {
  pluginRunner,
  normalizeOptions,
  getImportCode,
  getModuleCode,
  getExportCode,
} from './utils';

import schema from './options.json';

export default async function loader(content) {
  const rawOptions = getOptions(this);

  validateOptions(schema, rawOptions, {
    name: 'HTML Loader',
    baseDataPath: 'options',
  });

  const options = normalizeOptions(rawOptions, this);

  if (options.preprocessor) {
    // eslint-disable-next-line no-param-reassign
    content = await options.preprocessor(content, this);
  }

  const plugins = [];
  const errors = [];
  const imports = [];
  const replacements = [];

  if (options.attributes) {
    plugins.push(
      sourcePlugin({
        urlHandler: (url) => stringifyRequest(this, url),
        attributes: options.attributes,
        resourcePath: this.resourcePath,
        imports,
        errors,
        replacements,
      })
    );
  }

  if (options.minimize) {
    plugins.push(minimizerPlugin({ minimize: options.minimize, errors }));
  }

  const { html } = pluginRunner(plugins).process(content);

  for (const error of errors) {
    this.emitError(error instanceof Error ? error : new Error(error));
  }

  const importCode = getImportCode(html, this, imports, options);
  const moduleCode = getModuleCode(html, replacements, options);
  const exportCode = getExportCode(html, options);

  return `${importCode}${moduleCode}${exportCode}`;
}
