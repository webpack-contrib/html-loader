import { getOptions } from 'loader-utils';
import validateOptions from 'schema-utils';

import { sourcePlugin, interpolatePlugin, minimizerPlugin } from './plugins';
import Warning from './Warning';

import {
  pluginRunner,
  isProductionMode,
  getImportCode,
  getModuleCode,
  getExportCode,
} from './utils';

import schema from './options.json';

export default function htmlLoader(content) {
  const options = getOptions(this) || {};

  validateOptions(schema, options, {
    name: 'HTML Loader',
    baseDataPath: 'options',
  });

  const plugins = [];

  const attributes =
    typeof options.attributes === 'undefined' ? true : options.attributes;

  if (attributes) {
    plugins.push(sourcePlugin(options));
  }

  const minimize =
    typeof options.minimize === 'undefined'
      ? isProductionMode(this)
      : options.minimize;

  if (minimize) {
    plugins.push(minimizerPlugin(options));
  }

  const { interpolate } = options;

  if (interpolate) {
    plugins.push(interpolatePlugin(options));
  }

  const { html, messages, warnings, errors } = pluginRunner(plugins).process(
    content
  );

  for (const warning of warnings) {
    this.emitWarning(new Warning(warning));
  }

  for (const error of errors) {
    this.emitError(new Error(error));
  }

  const importedMessages = [];
  const replaceableMessages = [];
  const exportedMessages = [];

  for (const message of messages) {
    // eslint-disable-next-line default-case
    switch (message.type) {
      case 'import':
        importedMessages.push(message.value);
        break;
      case 'replacer':
        replaceableMessages.push(message.value);
        break;
      case 'exports':
        exportedMessages.push(message.value);
        break;
    }
  }

  const codeOptions = { ...options, loaderContext: this };
  const importCode = getImportCode(html, importedMessages, codeOptions);
  const moduleCode = getModuleCode(html, replaceableMessages, codeOptions);
  const exportCode = getExportCode(html, exportedMessages, codeOptions);

  return `${importCode}${moduleCode}${exportCode}`;
}
