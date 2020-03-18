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

export default function htmlLoader(content) {
  const options = getOptions(this);

  validateOptions(schema, options, {
    name: 'HTML Loader',
    baseDataPath: 'options',
  });

  if (options.preprocessor) {
    // eslint-disable-next-line no-param-reassign
    content = options.preprocessor(content, this);
  }

  const plugins = [];

  const attributes =
    typeof options.attributes === 'undefined' ? true : options.attributes;

  if (attributes) {
    plugins.push(sourcePlugin({ attributes, resourcePath: this.resourcePath }));
  }

  const minimize =
    typeof options.minimize === 'undefined'
      ? isProductionMode(this)
      : options.minimize;

  if (minimize) {
    plugins.push(minimizerPlugin({ minimize }));
  }

  const { html, messages } = pluginRunner(plugins).process(content);

  const errors = [];
  const importedMessages = [];
  const replaceableMessages = [];
  const exportedMessages = [];

  for (const message of messages) {
    // eslint-disable-next-line default-case
    switch (message.type) {
      case 'error':
        errors.push(message.value);
        break;
      case 'import':
        importedMessages.push(message.value);
        break;
      case 'replacer':
        replaceableMessages.push(message.value);
        break;
    }
  }

  for (const error of errors) {
    this.emitError(error instanceof Error ? error : new Error(error));
  }

  const codeOptions = { ...options, loaderContext: this };
  const importCode = getImportCode(html, importedMessages, codeOptions);
  const moduleCode = getModuleCode(html, replaceableMessages, codeOptions);
  const exportCode = getExportCode(html, exportedMessages, codeOptions);

  let code = `${importCode}${moduleCode}${exportCode}`;

  if (options.process && options.process.post) {
    // eslint-disable-next-line no-param-reassign
    code = options.process.post(code, this);
  }

  return code;
}
