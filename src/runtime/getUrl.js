module.exports = (url) => {
  // eslint-disable-next-line no-underscore-dangle, no-param-reassign
  url = url && url.__esModule ? url.default : url;

  if (typeof url !== 'string') {
    return url;
  }

  // if (/[\t\n\f\r "'=<>`]/.test(url)) {
  //  return `"${url}"`;
  // }

  return url;
};
