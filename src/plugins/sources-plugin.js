import parse5 from 'parse5';

import {
  traverse,
  getFilter,
  normalizeUrl,
  requestify,
  stringifyRequest,
  webpackIgnoreCommentRegexp,
} from '../utils';

export default (options) =>
  function process(html) {
    const sources = [];
    const document = parse5.parse(html, { sourceCodeLocationInfo: true });

    let needIgnore = false;

    traverse(document, (node) => {
      const { tagName, attrs: attributes, sourceCodeLocation } = node;

      if (node.nodeName === '#comment') {
        const match = node.data.match(webpackIgnoreCommentRegexp);

        if (match) {
          needIgnore = match[2] === 'true';
        }

        return;
      }

      if (!tagName) {
        return;
      }

      if (needIgnore) {
        needIgnore = false;
        return;
      }

      attributes.forEach((attribute) => {
        let { name } = attribute;

        name = attribute.prefix ? `${attribute.prefix}:${name}` : name;

        const handlers =
          options.sources.list.get(tagName.toLowerCase()) ||
          options.sources.list.get('*');

        if (!handlers) {
          return;
        }

        const handler = handlers.get(name.toLowerCase());

        if (!handler) {
          return;
        }

        if (
          handler.filter &&
          !handler.filter(tagName, name, attributes, options.resourcePath)
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
          attributes,
          attribute: name,
          attributePrefix: attribute.prefix,
          attributeNamespace: attribute.namespace,
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

      if (!urlFilter(name, value, options.resourcePath)) {
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
