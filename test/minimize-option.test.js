import loader from '../src';
import { GET_URL_CODE } from '../src/constants';

describe('"minimize" option', () => {
  it('should be turned off by default', () => {
    const result = loader.call(
      {
        // By default developers uses the `development` mode
        mode: 'development',
        query: '',
      },
      '<!-- comment --><h1>My First Heading</h1>\n\n<p>My first paragraph.</p>'
    );

    expect(result).toBe(
      `${GET_URL_CODE}module.exports = "<!-- comment --><h1>My First Heading</h1>\\n\\n<p>My first paragraph.</p>";`
    );
  });

  it('should be turned off in "development" mode', () => {
    const result = loader.call(
      {
        mode: 'development',
        query: '',
      },
      '<!-- comment --><h1>My First Heading</h1>\n\n<p>My first paragraph.</p>'
    );

    expect(result).toBe(
      `${GET_URL_CODE}module.exports = "<!-- comment --><h1>My First Heading</h1>\\n\\n<p>My first paragraph.</p>";`
    );
  });

  it('should be turned on in "production" mode', () => {
    const result = loader.call(
      {
        mode: 'production',
        query: '',
      },
      '<!-- comment --><h1>My First Heading</h1>\n\n<p>My first paragraph.</p>'
    );

    expect(result).toBe(
      `${GET_URL_CODE}module.exports = "<h1>My First Heading</h1> <p>My first paragraph.</p>";`
    );
  });

  it('should work with a value equal to "true"', () => {
    const result = loader.call(
      {
        query: {
          minimize: true,
        },
      },
      '<!-- comment --><h3 customAttr="">#{number} {customer}</h3>\n<p>   {title}   </p>\n\t <!-- comment --> <img src="image.png" />'
    );

    expect(result).toBe(
      `${GET_URL_CODE}module.exports = "<h3 customattr=\\"\\">#{number} {customer}</h3> <p> {title} </p> <img src=" + __url__(require("./image.png")) + " />";`
    );
  });

  it('should not work with a value equal to "false"', () => {
    const result = loader.call(
      {
        query: {
          minimize: false,
        },
      },
      '<!-- comment --><h1>My First Heading</h1>\n\n<p>My first paragraph.</p>'
    );

    expect(result).toBe(
      `${GET_URL_CODE}module.exports = "<!-- comment --><h1>My First Heading</h1>\\n\\n<p>My first paragraph.</p>";`
    );
  });

  // https://github.com/webpack/webpack/issues/752
  it('should not remove attributes by default', () => {
    const result = loader.call(
      {
        query: '?minimize',
      },
      '<input type="text" />'
    );

    expect(result).toBe(
      `${GET_URL_CODE}module.exports = "<input type=text />";`
    );
  });

  it('should support options for minimizer', () => {
    const result = loader.call(
      {
        query: {
          minimize: {
            collapseWhitespace: true,
            conservativeCollapse: true,
            removeAttributeQuotes: true,
            keepClosingSlash: true,
            minifyJS: true,
            minifyCSS: true,
            removeScriptTypeAttributes: true,
            removeStyleLinkTypeAttributes: true,
            useShortDoctype: true,
            removeComments: false,
          },
        },
      },
      '<!-- comment --><h3 customAttr="">#{number} {customer}</h3><p>{title}</p><!-- comment --><img src="image.png" />'
    );

    expect(result).toBe(
      `${GET_URL_CODE}module.exports = "<!-- comment --><h3 customattr=\\"\\">#{number} {customer}</h3><p>{title}</p><!-- comment --><img src=" + __url__(require("./image.png")) + " />";`
    );
  });

  it('should support ES6 syntax', () => {
    const result = loader.call(
      {
        query: {
          minimize: true,
        },
      },
      // eslint-disable-next-line no-template-curly-in-string
      '<!-- comment --><h1>My First Heading</h1>\n\n<p>My first paragraph.</p> <script>   console.log(1 + 2 + `${3 + 3}`)   </script>'
    );

    expect(result).toBe(
      `${GET_URL_CODE}module.exports = "<h1>My First Heading</h1> <p>My first paragraph.</p> <script>console.log(\\"36\\")</script>";`
    );
  });
});
