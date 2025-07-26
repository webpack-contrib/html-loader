import { parse } from "parse5";

import {
  getFilter,
  requestify,
  traverse,
  webpackIgnoreCommentRegexp,
} from "../utils";

const DOUBLE_QUOTE = '"'.charCodeAt(0);
const SINGLE_QUOTE = "'".charCodeAt(0);

export default (options) =>
  function process(html) {
    const sources = [];
    const document = parse(html, {
      sourceCodeLocationInfo: true,
      scriptingEnabled: options.sources.scriptingEnabled,
    });

    let needIgnore = false;

    traverse(document, (node) => {
      const { tagName, attrs: attributes, sourceCodeLocation } = node;

      if (node.nodeName === "#comment") {
        const match = node.data.match(webpackIgnoreCommentRegexp);

        if (match) {
          needIgnore = match[2] === "true";
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

      for (const attribute of attributes) {
        let { name } = attribute;

        name = attribute.prefix ? `${attribute.prefix}:${name}` : name;

        const handlers = new Map([
          ...(options.sources.list.get("*") || new Map()),
          ...(options.sources.list.get(tagName.toLowerCase()) || new Map()),
        ]);

        if (handlers.size === 0) {
          continue;
        }

        const handler = handlers.get(name.toLowerCase());

        if (!handler) {
          continue;
        }

        if (
          handler.filter &&
          !handler.filter(tagName, name, attributes, options.resourcePath)
        ) {
          continue;
        }

        const attributeAndValue = html.slice(
          sourceCodeLocation.attrs[name].startOffset,
          sourceCodeLocation.attrs[name].endOffset,
        );
        const isValueQuoted =
          attributeAndValue.charCodeAt(attributeAndValue.length - 1) ===
            DOUBLE_QUOTE ||
          attributeAndValue.charCodeAt(attributeAndValue.length - 1) ===
            SINGLE_QUOTE;
        const valueStartOffset =
          sourceCodeLocation.attrs[name].startOffset +
          attributeAndValue.indexOf(attribute.value);
        const valueEndOffset =
          sourceCodeLocation.attrs[name].endOffset - (isValueQuoted ? 1 : 0);
        const optionsForTypeFn = {
          tag: tagName,
          startTag: {
            startOffset: sourceCodeLocation.startTag.startOffset,
            endOffset: sourceCodeLocation.startTag.endOffset,
          },
          endTag: sourceCodeLocation.endTag
            ? {
                startOffset: sourceCodeLocation.endTag.startOffset,
                endOffset: sourceCodeLocation.endTag.endOffset,
              }
            : undefined,
          attributes,
          attribute: name,
          attributePrefix: attribute.prefix,
          attributeNamespace: attribute.namespace,
          attributeStartOffset: sourceCodeLocation.attrs[name].startOffset,
          attributeEndOffset: sourceCodeLocation.attrs[name].endOffset,
          value: attribute.value,
          isSupportAbsoluteURL: options.isSupportAbsoluteURL,
          isSupportDataURL: options.isSupportDataURL,
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
            continue;
          }

          sources.push({ ...source, name, isValueQuoted });
        }
      }
    });

    const urlFilter = getFilter(options.sources.urlFilter);
    const imports = new Map();
    const replacements = new Map();

    let offset = 0;

    for (const source of sources) {
      const { name, value, isValueQuoted, startOffset, endOffset } = source;

      let request = value;

      if (!urlFilter(name, value, options.resourcePath)) {
        continue;
      }

      let hash;
      const indexHash = request.lastIndexOf("#");

      if (indexHash >= 0) {
        hash = request.slice(Math.max(0, indexHash));
        request = request.slice(0, Math.max(0, indexHash));
      }

      request = requestify(options.context, request);

      let importName = imports.get(request);

      if (!importName) {
        importName = `___HTML_LOADER_IMPORT_${imports.size}___`;
        imports.set(request, importName);

        options.imports.push({ importName, request });
      }

      const replacementKey = JSON.stringify({ request, isValueQuoted, hash });
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

      html =
        html.slice(0, startOffset + offset) +
        replacementName +
        html.slice(endOffset + offset);

      offset += startOffset + replacementName.length - endOffset;
    }

    return html;
  };
