import { minify } from 'html-minifier-terser';

export default (options) =>
  function process(html) {
    const minimizeOptions =
      typeof options.minimize === 'boolean' ||
      typeof options.minimize === 'undefined'
        ? {
            caseSensitive: true,
            // `collapseBooleanAttributes` is not always safe, since this can break CSS attribute selectors and not safe for XHTML
            collapseWhitespace: true,
            conservativeCollapse: true,
            keepClosingSlash: true,
            // We need ability to use cssnano, or setup own function without extra dependencies
            minifyCSS: true,
            minifyJS: true,
            // `minifyURLs` is unsafe, because we can't guarantee what the base URL is
            // `removeAttributeQuotes` is not safe in some rare cases, also HTML spec recommends against doing this
            removeComments: true,
            // `removeEmptyAttributes` is not safe, can affect certain style or script behavior
            removeRedundantAttributes: true,
            removeScriptTypeAttributes: true,
            removeStyleLinkTypeAttributes: true,
            // `useShortDoctype` is not safe for XHTML
          }
        : options.minimize;

    try {
      // eslint-disable-next-line no-param-reassign
      html = minify(html, minimizeOptions);
    } catch (error) {
      options.errors.push(error);
    }

    return html;
  };
