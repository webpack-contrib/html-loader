module.exports = (url, maybeNeedQuotes) => {
  if (!url) {
    return url;
  }

  url = String(url);

  if (maybeNeedQuotes && /[\t\n\f\r "'=<>`]/.test(url)) {
    return `"${url}"`;
  }

  return url;
};
