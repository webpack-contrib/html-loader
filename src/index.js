import { sourcesPlugin, minimizerPlugin } from "./plugins";
import {
  pluginRunner,
  normalizeOptions,
  getImportCode,
  getModuleCode,
  getExportCode,
  defaultMinimizerOptions,
} from "./utils";

import schema from "./options.json";

export default async function loader(content) {
  const rawOptions = this.getOptions(schema);
  const options = normalizeOptions(rawOptions, this);

  if (options.preprocessor) {
    // eslint-disable-next-line no-param-reassign
    content = await options.preprocessor(content, this);
  }

  const plugins = [];
  const errors = [];
  const imports = [];
  const replacements = [];

  if (options.sources) {
    plugins.push(
      sourcesPlugin({
        sources: options.sources,
        resourcePath: this.resourcePath,
        context: this.context,
        imports,
        errors,
        replacements,
      })
    );
  }

  if (options.minimize) {
    plugins.push(minimizerPlugin({ minimize: options.minimize, errors }));
  }

  const { html } = await pluginRunner(plugins).process(content);

  for (const error of errors) {
    this.emitError(error instanceof Error ? error : new Error(error));
  }

  const importCode = getImportCode(html, this, imports, options);
  const moduleCode = getModuleCode(html, replacements, options);
  const exportCode = getExportCode(html, options);

  return `${importCode}${moduleCode}${exportCode}`;
}

export { defaultMinimizerOptions };
