import SAXParser from 'parse5-sax-parser';

import {
  getFilter,
  normalizeUrl,
  requestify,
  stringifyRequest,
} from '../utils';

export default (options) =>
  function process(html) {
    const { resourcePath } = options;
    const parser5 = new SAXParser({ sourceCodeLocationInfo: true });
    const sources = [];

    parser5.on('startTag', (node) => {
      const { tagName, attrs, sourceCodeLocation } = node;

      attrs.forEach((attribute) => {
        const { prefix } = attribute;
        let { name } = attribute;

        name = prefix ? `${prefix}:${name}` : name;

        if (!sourceCodeLocation.attrs[name]) {
          return;
        }

        const foundTag =
          options.sources.list.get(tagName.toLowerCase()) ||
          options.sources.list.get('*');

        if (!foundTag) {
          return;
        }

        const handler = foundTag.get(name.toLowerCase());

        if (!handler) {
          return;
        }

        if (
          handler.filter &&
          !handler.filter(tagName, name, attrs, resourcePath)
        ) {
          return;
        }

        const attributeAndValue = html.slice(
          sourceCodeLocation.attrs[name].startOffset,
          sourceCodeLocation.attrs[name].endOffset
        );
        const isValueQuoted =
          attributeAndValue[attributeAndValue.length - 1] === '"' ||
          attributeAndValue[attributeAndValue.length - 1] === "'";
        const valueStartOffset =
          sourceCodeLocation.attrs[name].startOffset +
          attributeAndValue.indexOf(attribute.value);
        const valueEndOffset =
          sourceCodeLocation.attrs[name].endOffset - (isValueQuoted ? 1 : 0);
        const optionsForTypeFn = {
          tag: tagName,
          isSelfClosing: node.selfClosing,
          tagStartOffset: sourceCodeLocation.startOffset,
          tagEndOffset: sourceCodeLocation.endOffset,
          attributes: attrs,
          attribute: name,
          attributeStartOffset: sourceCodeLocation.attrs[name].startOffset,
          attributeEndOffset: sourceCodeLocation.attrs[name].endOffset,
          value: attribute.value,
          isValueQuoted,
          valueEndOffset,
          valueStartOffset,
          html,
        };

        let result;

        try {
          result = handler.type(optionsForTypeFn);
        } catch (error) {
          options.errors.push(error);
        }

        result = Array.isArray(result) ? result : [result];

        for (const source of result) {
          if (!source) {
            // eslint-disable-next-line no-continue
            continue;
          }

          sources.push({ ...source, name, isValueQuoted });
        }
      });
    });

    parser5.end(html);

    const urlFilter = getFilter(options.sources.urlFilter);
    const imports = new Map();
    const replacements = new Map();

    let offset = 0;

    for (const source of sources) {
      const { name, value, isValueQuoted, startOffset, endOffset } = source;

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

      const replacementKey = JSON.stringify({ newUrl, isValueQuoted, hash });
      let replacementName = replacements.get(replacementKey);

      if (!replacementName) {
        replacementName = `___HTML_LOADER_REPLACEMENT_${replacements.size}___`;
        replacements.set(replacementKey, replacementName);

        options.replacements.push({
          replacementName,
          importName,
          hash,
          isValueQuoted,
        });
      }

      // eslint-disable-next-line no-param-reassign
      html =
        html.slice(0, startOffset + offset) +
        replacementName +
        html.slice(endOffset + offset);

      offset += startOffset + replacementName.length - endOffset;
    }

    return html;
  };
