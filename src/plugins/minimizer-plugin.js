import { minify } from "html-minifier-terser";

export default (options) =>
  async function process(html) {
    try {
      html = await minify(html, options.minimize);
    } catch (error) {
      options.errors.push(error);
    }

    return html;
  };
