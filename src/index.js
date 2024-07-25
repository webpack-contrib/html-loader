import { sourcesPlugin, minimizerPlugin } from "./plugins";
import {
  pluginRunner,
  normalizeOptions,
  getImportCode,
  getModuleCode,
  getExportCode,
  defaultMinimizerOptions,
  supportTemplateLiteral,
  convertToTemplateLiteral,
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

  let isSupportAbsoluteURL = false;

  // TODO enable by default in the next major release
  if (
    this._compilation &&
    this._compilation.options &&
    this._compilation.options.experiments &&
    this._compilation.options.experiments.buildHttp
  ) {
    isSupportAbsoluteURL = true;
  }

  if (options.sources) {
    plugins.push(
      sourcesPlugin({
        isSupportAbsoluteURL,
        isSupportDataURL: options.esModule,
        sources: options.sources,
        resourcePath: this.resourcePath,
        context: this.context,
        imports,
        errors,
        replacements,
      }),
    );
  }

  if (options.minimize) {
    plugins.push(minimizerPlugin({ minimize: options.minimize, errors }));
  }

  let { html } = await pluginRunner(plugins).process(content);

  for (const error of errors) {
    this.emitError(error instanceof Error ? error : new Error(error));
  }

  const isTemplateLiteralSupported = supportTemplateLiteral(this);

  html = (
    isTemplateLiteralSupported
      ? convertToTemplateLiteral(html)
      : JSON.stringify(html)
  )
    // Invalid in JavaScript but valid HTML
    .replace(/[\u2028\u2029]/g, (str) =>
      str === "\u2029" ? "\\u2029" : "\\u2028",
    );

  if (options.postprocessor) {
    // eslint-disable-next-line no-param-reassign
    html = await options.postprocessor(html, this);
  }

  const importCode = getImportCode(html, imports, options);
  const moduleCode = getModuleCode(html, replacements, this, {
    esModule: options.esModule,
    isTemplateLiteralSupported,
  });
  const exportCode = getExportCode(html, options);

  return `${importCode}${moduleCode}${exportCode}`;
}

export { defaultMinimizerOptions };
