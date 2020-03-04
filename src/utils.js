import { urlToRequest, stringifyRequest } from 'loader-utils';

export function pluginRunner(plugins) {
  return {
    process: (content) => {
      const result = { messages: [], warnings: [], errors: [] };

      for (const plugin of plugins) {
        // eslint-disable-next-line no-param-reassign
        content = plugin(content, result);
      }

      result.html = content;

      return result;
    },
  };
}

export function isProductionMode(loaderContext) {
  return loaderContext.mode === 'production' || !loaderContext.mode;
}

export function getImportCode(loaderContext, html, replacers, options) {
  if (replacers.length === 0) {
    return '';
  }

  const importItems = [];

  importItems.push(
    options.esModule
      ? `import ___HTML_LOADER_GET_URL_IMPORT___ from ${stringifyRequest(
          loaderContext,
          require.resolve('./runtime/getUrl.js')
        )}`
      : `var ___HTML_LOADER_GET_URL_IMPORT___ = require(${stringifyRequest(
          loaderContext,
          require.resolve('./runtime/getUrl.js')
        )});`
  );

  for (const replacer of replacers) {
    const { replacementName, source } = replacer;
    const request = urlToRequest(source, options.root);
    const stringifiedRequest = stringifyRequest(loaderContext, request);

    if (options.esModule) {
      importItems.push(`import ${replacementName} from ${stringifiedRequest};`);
    } else {
      importItems.push(
        `var ${replacementName} = require(${stringifiedRequest});`
      );
    }
  }

  const importCode = importItems.join('\n');

  return `// Imports\n${importCode}\n`;
}

export function getExportCode(html, replacers, options) {
  let exportCode = html;

  if (!options.interpolate) {
    exportCode = JSON.stringify(exportCode)
      // Invalid in JavaScript but valid HTML
      .replace(/[\u2028\u2029]/g, (str) =>
        str === '\u2029' ? '\\u2029' : '\\u2028'
      );
  }

  for (const replacer of replacers) {
    const { replacementName } = replacer;

    exportCode = exportCode.replace(
      new RegExp(replacementName, 'g'),
      () => `" + ___HTML_LOADER_GET_URL_IMPORT___(${replacementName}) + "`
    );
  }

  if (options.esModule) {
    return `// Exports\nexport default ${exportCode}`;
  }

  return `// Exports\nmodule.exports = ${exportCode}`;
}
