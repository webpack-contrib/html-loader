import { stringifyRequest } from 'loader-utils';

const GET_SOURCE_FROM_IMPORT_NAME = '___HTML_LOADER_GET_SOURCE_FROM_IMPORT___';

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

export function getImportCode(html, importedMessages, codeOptions) {
  if (importedMessages.length === 0) {
    return '';
  }

  const { loaderContext, esModule } = codeOptions;
  const stringifiedHelperRequest = stringifyRequest(
    loaderContext,
    require.resolve('./runtime/getUrl.js')
  );

  let code = esModule
    ? `import ${GET_SOURCE_FROM_IMPORT_NAME} from ${stringifiedHelperRequest};\n`
    : `var ${GET_SOURCE_FROM_IMPORT_NAME} = require(${stringifiedHelperRequest});\n`;

  for (const item of importedMessages) {
    const { importName, source } = item;
    const stringifiedSourceRequest = stringifyRequest(loaderContext, source);

    code += esModule
      ? `import ${importName} from ${stringifiedSourceRequest};\n`
      : `var ${importName} = require(${stringifiedSourceRequest});\n`;
  }

  return `// Imports\n${code}`;
}

export function getModuleCode(html, replaceableMessages, codeOptions) {
  let code = html;

  if (!codeOptions.interpolate) {
    code = JSON.stringify(code)
      // Invalid in JavaScript but valid HTML
      .replace(/[\u2028\u2029]/g, (str) =>
        str === '\u2029' ? '\\u2029' : '\\u2028'
      );
  }

  let replacersCode = '';

  for (const item of replaceableMessages) {
    const { importName, replacerName, unquoted } = item;

    replacersCode += `var ${replacerName} = ${GET_SOURCE_FROM_IMPORT_NAME}(${importName}${
      unquoted ? ', true' : ''
    });\n`;

    code = code.replace(
      new RegExp(replacerName, 'g'),
      () => `" + ${replacerName} + "`
    );
  }

  return `// Module\n${replacersCode}var code = ${code};\n`;
}

export function getExportCode(html, exportedMessages, codeOptions) {
  if (codeOptions.esModule) {
    return `// Exports\nexport default code;`;
  }

  return `// Exports\nmodule.exports = code`;
}
