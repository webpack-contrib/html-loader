function getIndices(value) {
  const result = [];
  let index = value.indexOf("\n");

  while (index !== -1) {
    result.push(index + 1);
    index = value.indexOf("\n", index + 1);
  }

  result.push(value.length + 1);

  return result;
}

function offsetToPosition(source, offset) {
  let index = -1;
  const indices = getIndices(source);
  const { length } = indices;

  if (offset < 0) {
    return {};
  }

  // eslint-disable-next-line no-plusplus
  while (++index < length) {
    if (indices[index] > offset) {
      return {
        line: index + 1,
        column: offset - (indices[index - 1] || 0) + 1,
        offset,
      };
    }
  }

  return {};
}

export default class HtmlSourceError extends Error {
  constructor(error, startOffset, endOffset, source) {
    super(error);

    this.name = "HtmlSourceError";
    this.message = `${this.name}: ${this.message}`;
    this.startOffset = startOffset;
    this.endOffset = endOffset;
    this.source = source;

    const startPosition = offsetToPosition(source, this.startOffset);
    const endPosition = offsetToPosition(source, this.endOffset);

    this.message += ` (From line ${startPosition.line}, column ${startPosition.column}; to line ${endPosition.line}, column ${endPosition.column})`;

    // We don't need stack
    this.stack = false;
  }
}
