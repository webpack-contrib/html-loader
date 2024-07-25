module.exports = (url, maybeNeedQuotes) => {
  if (!url) {
    return url;
  }

  // eslint-disable-next-line no-underscore-dangle, no-param-reassign
  url = String(url);

  if (maybeNeedQuotes && /[\t\n\f\r "'=<>`]/.test(url)) {
    return `"${url}"`;
  }

  return url;
};
