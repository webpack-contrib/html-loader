import SAXParser from 'parse5-sax-parser';

import HtmlSourceError from '../HtmlSourceError';
import {
  getFilter,
  parseSrc,
  parseSrcset,
  normalizeUrl,
  requestify,
  isUrlRequestable,
  c0ControlCodesExclude,
  stringifyRequest,
} from '../utils';

export default (options) =>
  function process(html) {
    const { list, urlFilter: maybeUrlFilter } = options.attributes;
    const sources = [];
    const urlFilter = getFilter(maybeUrlFilter, (value) =>
      isUrlRequestable(value)
    );
    const getAttribute = (tag, attribute, attributes, resourcePath) =>
      list.find((element) => {
        const foundTag =
          typeof element.tag === 'undefined' ||
          (typeof element.tag !== 'undefined' &&
            element.tag.toLowerCase() === tag.toLowerCase());

        if (!foundTag) {
          return false;
        }

        const foundAttribute =
          element.attribute.toLowerCase() === attribute.toLowerCase();

        if (!foundAttribute) {
          return false;
        }

        const adaptedAttributes = attributes.reduce((accumulator, item) => {
          // eslint-disable-next-line no-param-reassign
          accumulator[item.name] = item.value;
          return accumulator;
        }, {});

        return element.filter
          ? element.filter(tag, attribute, adaptedAttributes, resourcePath)
          : true;
      });

    const { resourcePath } = options;
    const parser5 = new SAXParser({ sourceCodeLocationInfo: true });

    parser5.on('startTag', (node) => {
      const { tagName, attrs, sourceCodeLocation } = node;

      attrs.forEach((attribute) => {
        const { value, prefix } = attribute;
        let { name } = attribute;

        name = prefix ? `${prefix}:${name}` : name;

        if (!sourceCodeLocation.attrs[name]) {
          return;
        }

        const foundAttribute = getAttribute(tagName, name, attrs, resourcePath);

        if (!foundAttribute) {
          return;
        }

        const { type } = foundAttribute;

        const target = html.slice(
          sourceCodeLocation.attrs[name].startOffset,
          sourceCodeLocation.attrs[name].endOffset
        );

        const unquoted =
          target[target.length - 1] !== '"' &&
          target[target.length - 1] !== "'";

        // eslint-disable-next-line default-case
        switch (type) {
          case 'src': {
            let source;

            try {
              source = parseSrc(value);
            } catch (error) {
              options.errors.push(
                new HtmlSourceError(
                  `Bad value for attribute "${attribute.name}" on element "${tagName}": ${error.message}`,
                  sourceCodeLocation.attrs[name].startOffset,
                  sourceCodeLocation.attrs[name].endOffset,
                  html
                )
              );

              return;
            }

            source = c0ControlCodesExclude(source);

            if (!isUrlRequestable(source.value)) {
              return;
            }

            const startOffset =
              sourceCodeLocation.attrs[name].startOffset +
              target.indexOf(source.value, name.length);

            sources.push({
              name,
              value: source.value,
              unquoted,
              startIndex: startOffset,
              endIndex: startOffset + source.value.length,
            });

            break;
          }

          case 'srcset': {
            let sourceSet;

            try {
              sourceSet = parseSrcset(value);
            } catch (error) {
              options.errors.push(
                new HtmlSourceError(
                  `Bad value for attribute "${attribute.name}" on element "${tagName}": ${error.message}`,
                  sourceCodeLocation.attrs[name].startOffset,
                  sourceCodeLocation.attrs[name].endOffset,
                  html
                )
              );

              return;
            }

            sourceSet = sourceSet.map((item) => {
              return {
                source: c0ControlCodesExclude(item.source),
              };
            });

            let searchFrom = name.length;

            sourceSet.forEach((sourceItem) => {
              const { source } = sourceItem;

              if (!isUrlRequestable(source.value)) {
                return;
              }

              const startOffset =
                sourceCodeLocation.attrs[name].startOffset +
                target.indexOf(source.value, searchFrom);

              searchFrom = target.indexOf(source.value, searchFrom) + 1;

              sources.push({
                name,
                value: source.value,
                unquoted,
                startIndex: startOffset,
                endIndex: startOffset + source.value.length,
              });
            });

            break;
          }
        }
      });
    });

    parser5.end(html);

    const imports = new Map();
    const replacements = new Map();

    let offset = 0;

    for (const source of sources) {
      const { name, value, unquoted, startIndex, endIndex } = source;

      let normalizedUrl = value;
      let prefix = '';

      const queryParts = normalizedUrl.split('!');

      if (queryParts.length > 1) {
        normalizedUrl = queryParts.pop();
        prefix = queryParts.join('!');
      }

      normalizedUrl = normalizeUrl(normalizedUrl);

      if (!urlFilter(name, value, resourcePath)) {
        // eslint-disable-next-line no-continue
        continue;
      }

      let hash;
      const indexHash = normalizedUrl.lastIndexOf('#');

      if (indexHash >= 0) {
        hash = normalizedUrl.substring(indexHash);
        normalizedUrl = normalizedUrl.substring(0, indexHash);
      }

      const request = requestify(normalizedUrl);
      const newUrl = prefix ? `${prefix}!${request}` : request;
      const importKey = newUrl;
      let importName = imports.get(importKey);

      if (!importName) {
        importName = `___HTML_LOADER_IMPORT_${imports.size}___`;
        imports.set(importKey, importName);

        options.imports.push({
          importName,
          source: stringifyRequest(options.loaderContext, newUrl),
        });
      }

      const replacementKey = JSON.stringify({ newUrl, unquoted, hash });
      let replacementName = replacements.get(replacementKey);

      if (!replacementName) {
        replacementName = `___HTML_LOADER_REPLACEMENT_${replacements.size}___`;
        replacements.set(replacementKey, replacementName);

        options.replacements.push({
          replacementName,
          importName,
          hash,
          unquoted,
        });
      }

      // eslint-disable-next-line no-param-reassign
      html =
        html.slice(0, startIndex + offset) +
        replacementName +
        html.slice(endIndex + offset);

      offset += startIndex + replacementName.length - endIndex;
    }

    return html;
  };
