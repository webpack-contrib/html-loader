import { parse } from 'url';

import { Parser } from 'htmlparser2';
import { isUrlRequest, urlToRequest } from 'loader-utils';

import HtmlSourceError from '../HtmlSourceError';
import { getFilter, parseSrc, parseSrcset } from '../utils';

function parseSource(source) {
  const URLObject = parse(source);
  const { hash } = URLObject;

  if (!hash) {
    return { sourceValue: source };
  }

  URLObject.hash = null;

  const sourceWithoutHash = URLObject.format();

  return { sourceValue: sourceWithoutHash, hash };
}

export default (options) =>
  function process(html) {
    const { list, urlFilter: maybeUrlFilter, root } = options.attributes;
    const sources = [];
    const urlFilter = getFilter(maybeUrlFilter, (value) =>
      isUrlRequest(value, root)
    );
    const getAttribute = (tag, attribute, attributes, resourcePath) => {
      return list.find((element) => {
        const foundTag =
          typeof element.tag === 'undefined' ||
          (typeof element.tag !== 'undefined' &&
            element.tag.toLowerCase() === tag.toLowerCase());
        const foundAttribute =
          element.attribute.toLowerCase() === attribute.toLowerCase();
        const isNotFiltered = element.filter
          ? element.filter(tag, attribute, attributes, resourcePath)
          : true;

        return foundTag && foundAttribute && isNotFiltered;
      });
    };
    const { resourcePath } = options;
    const imports = new Map();
    const getImportItem = (value) => {
      const key = urlToRequest(decodeURIComponent(value), root);

      let name = imports.get(key);

      if (name) {
        return { key, name };
      }

      name = `___HTML_LOADER_IMPORT_${imports.size}___`;
      imports.set(key, name);

      options.imports.push({ importName: name, source: key });

      return { key, name };
    };
    const replacements = new Map();
    const getReplacementItem = (importItem, unquoted, hash) => {
      const key = JSON.stringify({ key: importItem.key, unquoted, hash });

      let name = replacements.get(key);

      if (name) {
        return { key, name };
      }

      name = `___HTML_LOADER_REPLACEMENT_${replacements.size}___`;
      replacements.set(key, name);

      options.replacements.push({
        replacementName: name,
        importName: importItem.name,
        hash,
        unquoted,
      });

      return { key, name };
    };
    const parser = new Parser(
      {
        attributesMeta: {},
        onattribute(name, value) {
          // eslint-disable-next-line no-underscore-dangle
          const endIndex = parser._tokenizer._index;
          const startIndex = endIndex - value.length;
          const unquoted = html[endIndex] !== '"' && html[endIndex] !== "'";

          this.attributesMeta[name] = { startIndex, unquoted };
        },
        onopentag(tag, attributes) {
          Object.keys(attributes).forEach((attribute) => {
            const value = attributes[attribute];
            const {
              startIndex: valueStartIndex,
              unquoted,
            } = this.attributesMeta[attribute];

            const foundAttribute = getAttribute(
              tag,
              attribute,
              attributes,
              resourcePath
            );

            if (!foundAttribute) {
              return;
            }

            const { type } = foundAttribute;

            // eslint-disable-next-line default-case
            switch (type) {
              case 'src': {
                let source;

                try {
                  source = parseSrc(value);
                } catch (error) {
                  options.errors.push(
                    new HtmlSourceError(
                      `Bad value for attribute "${attribute}" on element "${tag}": ${error.message}`,
                      parser.startIndex,
                      parser.endIndex,
                      html
                    )
                  );

                  return;
                }

                if (!urlFilter(attribute, source.value, resourcePath)) {
                  return;
                }

                const { sourceValue, hash } = parseSource(source.value);
                const importItem = getImportItem(sourceValue);
                const replacementItem = getReplacementItem(
                  importItem,
                  unquoted,
                  hash
                );
                const startIndex = valueStartIndex + source.startIndex;
                const endIndex = startIndex + source.value.length;

                sources.push({ replacementItem, startIndex, endIndex });

                break;
              }
              case 'srcset': {
                let sourceSet;

                try {
                  sourceSet = parseSrcset(value);
                } catch (error) {
                  options.errors.push(
                    new HtmlSourceError(
                      `Bad value for attribute "${attribute}" on element "${tag}": ${error.message}`,
                      parser.startIndex,
                      parser.endIndex,
                      html
                    )
                  );

                  return;
                }

                sourceSet.forEach((sourceItem) => {
                  const { source } = sourceItem;

                  if (!urlFilter(attribute, source.value, resourcePath)) {
                    return;
                  }

                  const { sourceValue, hash } = parseSource(source.value);
                  const importItem = getImportItem(sourceValue);
                  const replacementItem = getReplacementItem(
                    importItem,
                    unquoted,
                    hash
                  );
                  const startIndex = valueStartIndex + source.startIndex;
                  const endIndex = startIndex + source.value.length;

                  sources.push({ replacementItem, startIndex, endIndex });
                });

                break;
              }
              // Need improve
              // case 'include': {
              //   let source;
              //
              //   // eslint-disable-next-line no-underscore-dangle
              //   if (parser._tokenizer._state === 4) {
              //     return;
              //   }
              //
              //   try {
              //     source = parseSrc(value);
              //   } catch (error) {
              //     options.errors.push(
              //       new HtmlSourceError(
              //         `Bad value for attribute "${attribute}" on element "${tag}": ${error.message}`,
              //         parser.startIndex,
              //         parser.endIndex,
              //         html
              //       )
              //     );
              //
              //     return;
              //   }
              //
              //   if (!urlFilter(attribute, source.value, resourcePath)) {
              //     return;
              //   }
              //
              //   const { startIndex } = parser;
              //   const closingTag = html
              //     .slice(startIndex - 1)
              //     .match(
              //       new RegExp(`<s*${tag}[^>]*>(?:.*?)</${tag}[^<>]*>`, 's')
              //     );
              //
              //   if (!closingTag) {
              //     return;
              //   }
              //
              //   const endIndex = startIndex + closingTag[0].length;
              //   const importItem = getImportItem(source.value);
              //   const replacementItem = getReplacementItem(importItem);
              //
              //   sources.push({ replacementItem, startIndex, endIndex });
              //
              //   break;
              // }
            }
          });

          this.attributesMeta = {};
        },
        onerror(error) {
          options.errors.push(error);
        },
      },
      {
        decodeEntities: false,
        lowerCaseTags: false,
        lowerCaseAttributeNames: false,
        recognizeCDATA: true,
        recognizeSelfClosing: true,
      }
    );

    parser.write(html);
    parser.end();

    let offset = 0;

    for (const source of sources) {
      const { startIndex, endIndex, replacementItem } = source;

      // eslint-disable-next-line no-param-reassign
      html =
        html.slice(0, startIndex + offset) +
        replacementItem.name +
        html.slice(endIndex + offset);

      offset += startIndex + replacementItem.name.length - endIndex;
    }

    return html;
  };
