import { urlToRequest, stringifyRequest } from 'loader-utils';

export function isProductionMode(loaderContext) {
  return loaderContext.mode === 'production' || !loaderContext.mode;
}

export function getImportCode(loaderContext, content, replacers, options) {
  if (replacers.size === 0) {
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

  const idents = replacers.keys();

  for (const ident of idents) {
    const url = replacers.get(ident);
    const request = urlToRequest(url, options.root);
    const stringifiedRequest = stringifyRequest(loaderContext, request);

    if (options.esModule) {
      importItems.push(`import ${ident} from ${stringifiedRequest};`);
    } else {
      importItems.push(`var ${ident} = require(${stringifiedRequest});`);
    }
  }

  const importCode = importItems.join('\n');

  return `// Imports\n${importCode}\n`;
}

export function getExportCode(content, replacers, options) {
  const exportCode = content.replace(
    /___HTML_LOADER_IDENT_[0-9.]+___/g,
    (match) => {
      if (!replacers.has(match)) {
        return match;
      }

      return `" + ___HTML_LOADER_GET_URL_IMPORT___(${match}) + "`;
    }
  );

  if (options.esModule) {
    return `// Exports\nexport default ${exportCode}`;
  }

  return `// Exports\nmodule.exports = ${exportCode}`;
}
