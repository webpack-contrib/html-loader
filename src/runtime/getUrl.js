module.exports = (url, options) => {
  if (!options) {
    // eslint-disable-next-line no-param-reassign
    options = {};
  }

  if (url) {
    // eslint-disable-next-line no-underscore-dangle, no-param-reassign
    url = url.__esModule
      ? url.default
      : typeof url !== 'string' && typeof url !== 'boolean'
      ? url.toString()
      : url;
  }

  if (typeof url !== 'string') {
    return url;
  }

  if (options.hash) {
    // eslint-disable-next-line no-param-reassign
    url += options.hash;
  }

  if (options.maybeNeedQuotes && /[\t\n\f\r "'=<>`]/.test(url)) {
    return `"${url}"`;
  }

  return url;
};
