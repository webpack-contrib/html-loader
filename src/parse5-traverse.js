const traverse = (root, callback) => {
  const visit = (node, parent) => {
    let res;

    if (!node) {
      return;
    }

    if (callback) {
      res = callback(node, parent);
    }

    let { childNodes } = node;

    // in case a <template> tag is in the middle of the HTML: https://github.com/JPeer264/node-rcs-core/issues/58
    if (node.content && Array.isArray(node.content.childNodes)) {
      ({ childNodes } = node.content);
    }

    if (res !== false && Array.isArray(childNodes) && childNodes.length >= 0) {
      childNodes.forEach((child) => {
        visit(child, node);
      });
    }
  };

  visit(root, null);
};

module.exports = traverse;
