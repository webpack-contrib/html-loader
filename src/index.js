import { getOptions } from 'loader-utils';
import validateOptions from 'schema-utils';

import { sourcePlugin, minimizerPlugin } from './plugins';

import {
  pluginRunner,
  isProductionMode,
  getImportCode,
  getModuleCode,
  getExportCode,
} from './utils';

import schema from './options.json';

export default async function loader(content) {
  const options = getOptions(this);

  validateOptions(schema, options, {
    name: 'HTML Loader',
    baseDataPath: 'options',
  });

  if (options.preprocessor) {
    // eslint-disable-next-line no-param-reassign
    content = await options.preprocessor(content, this);
  }

  const plugins = [];
  const errors = [];
  const imports = [];
  const replacements = [];

  const attributes =
    typeof options.attributes === 'undefined' ? true : options.attributes;

  if (attributes) {
    plugins.push(
      sourcePlugin({
        attributes,
        resourcePath: this.resourcePath,
        imports,
        errors,
        replacements,
      })
    );
  }

  const minimize =
    typeof options.minimize === 'undefined'
      ? isProductionMode(this)
      : options.minimize;

  if (minimize) {
    plugins.push(minimizerPlugin({ minimize, errors }));
  }

  const { html } = pluginRunner(plugins).process(content);

  for (const error of errors) {
    this.emitError(error instanceof Error ? error : new Error(error));
  }

  const codeOptions = { ...options, loaderContext: this };
  const importCode = getImportCode(html, imports, codeOptions);
  const moduleCode = getModuleCode(html, replacements, codeOptions);
  const exportCode = getExportCode(html, codeOptions);

  return `${importCode}${moduleCode}${exportCode}`;
}
