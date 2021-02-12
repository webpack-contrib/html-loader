import SAXParser from 'parse5-sax-parser';

import {
  getFilter,
  normalizeUrl,
  requestify,
  isUrlRequestable,
  stringifyRequest,
  typeSrc,
  typeSrcset,
} from '../utils';

export default (options) =>
  function process(html) {
    const { list, urlFilter: maybeUrlFilter } = options.sources;
    const sources = [];
    const urlFilter = getFilter(maybeUrlFilter, (value) =>
      isUrlRequestable(value)
    );
    const getAttribute = (tag, attribute, attributes, resourcePath) => {
      const foundTag = list.get(tag.toLowerCase()) || list.get('*');

      if (!foundTag) {
        return false;
      }

      const foundAttribute = foundTag.get(attribute.toLowerCase());

      if (!foundAttribute) {
        return false;
      }

      const result = foundAttribute.filter
        ? foundAttribute.filter(tag, attribute, attributes, resourcePath)
        : true;

      return result ? foundAttribute : false;
    };

    const { resourcePath } = options;
    const parser5 = new SAXParser({ sourceCodeLocationInfo: true });

    parser5.on('startTag', (node) => {
      const { tagName, attrs, sourceCodeLocation } = node;

      attrs.forEach((attribute) => {
        const { prefix } = attribute;
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

        const result = [];

        // eslint-disable-next-line default-case
        switch (type) {
          case 'src': {
            typeSrc({ name, attribute, node, target, html, options }).forEach(
              (i) => {
                result.push(i);
              }
            );
            break;
          }

          case 'srcset': {
            typeSrcset({
              name,
              attribute,
              node,
              target,
              html,
              options,
            }).forEach((i) => {
              result.push(i);
            });
            break;
          }

          default: {
            type({ name, attribute, node, target, html, options }).forEach(
              (i) => {
                result.push(i);
              }
            );
          }
        }

        for (const i of result) {
          if (i) {
            sources.push({
              ...i,
              name,
              unquoted,
            });
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
          source: stringifyRequest(options.context, newUrl),
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
