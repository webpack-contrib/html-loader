import loader from '../src';
import { GET_URL_CODE } from '../src/constants';

describe('"minimize" option', () => {
  it('should be turned off by default', () => {
    const result = loader.call(
      {
        query: '',
      },
      '<!-- comment --><h1>My First Heading</h1>\n\n<p>My first paragraph.</p>'
    );

    expect(result).toBe(
      `${GET_URL_CODE}module.exports = "<!-- comment --><h1>My First Heading</h1>\\n\\n<p>My first paragraph.</p>";`
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

  it('should preserve comments', () => {
    const result = loader.call(
      {
        query: {
          minimize: {
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

  it('should preserve comments and white spaces when minimizing', () => {
    const result = loader.call(
      {
        query: {
          minimize: {
            removeComments: false,
            collapseWhitespace: false,
          },
        },
      },
      '<!-- comment --><h3 customAttr="">#{number} {customer}</h3><p>{title}</p>    <!-- comment -->    <img src="image.png" />'
    );

    expect(result).toBe(
      `${GET_URL_CODE}module.exports = "<!-- comment --><h3 customattr=\\"\\">#{number} {customer}</h3><p>{title}</p>    <!-- comment -->    <img src=" + __url__(require("./image.png")) + " />";`
    );
  });

  it('should treat attributes as case sensitive', () => {
    const result = loader.call(
      {
        query: {
          minimize: {
            caseSensitive: true,
          },
        },
      },
      '<!-- comment --><h3 customAttr="">#{number} {customer}</h3><p>{title}</p><!-- comment --><img src="image.png" />'
    );

    expect(result).toBe(
      `${GET_URL_CODE}module.exports = "<h3 customAttr=\\"\\">#{number} {customer}</h3><p>{title}</p><img src=" + __url__(require("./image.png")) + " />";`
    );
  });
});
