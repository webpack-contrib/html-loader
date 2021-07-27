import { minify } from "html-minifier-terser";

export default (options) =>
  function process(html) {
    try {
      // eslint-disable-next-line no-param-reassign
      html = minify(html, options.minimize);
    } catch (error) {
      options.errors.push(error);
    }

    return html;
  };
