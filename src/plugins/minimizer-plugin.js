import { minify } from 'html-minifier-terser';

export default (content, options) => {
  const minimizeOptions =
    typeof options.minimize === 'boolean' ||
    typeof options.minimize === 'undefined'
      ? {
          collapseWhitespace: true,
          conservativeCollapse: true,
          keepClosingSlash: true,
          minifyCSS: true,
          minifyJS: true,
          removeAttributeQuotes: true,
          removeComments: true,
          removeScriptTypeAttributes: true,
          removeStyleLinkTypeAttributes: true,
          useShortDoctype: true,
        }
      : options.minimize;

  return minify(content, minimizeOptions);
};
