import { getOptions } from 'loader-utils';
import validateOptions from 'schema-utils';

import { attributePlugin, interpolatePlugin, minimizerPlugin } from './plugins';

import { isProductionMode, getImportCode, getExportCode } from './utils';

import schema from './options.json';

export const raw = true;

export default function htmlLoader(source) {
  const options = getOptions(this) || {};

  validateOptions(schema, options, {
    name: 'HTML Loader',
    baseDataPath: 'options',
  });

  let content = source.toString();

  const attributes =
    typeof options.attributes === 'undefined' ? true : options.attributes;
  const replacers = new Map();

  if (attributes) {
    content = attributePlugin(content, replacers, options);
  }

  const minimize =
    typeof options.minimize === 'undefined'
      ? isProductionMode(this)
      : options.minimize;

  if (minimize) {
    try {
      content = minimizerPlugin(content, options);
    } catch (error) {
      this.emitError(error);
    }
  }

  const { interpolate } = options;

  if (interpolate) {
    try {
      content = interpolatePlugin(content);
    } catch (error) {
      this.emitError(error);

      content = JSON.stringify(content);
    }
  } else {
    content = JSON.stringify(content);
  }

  const importCode = getImportCode(this, content, replacers, options);
  const exportCode = getExportCode(content, replacers, options);

  return `${importCode}${exportCode};`;
}
