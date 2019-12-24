/* eslint-disable no-useless-escape,no-template-curly-in-string */

import loader from '../src';
import { GET_URL_CODE } from '../src/constants';

describe('loader', () => {
  it('should convert to requires', () => {
    const result = loader.call(
      {},
      'Text <img src="image.png"><img src="~bootstrap-img"> Text'
    );

    expect(result).toBe(
      `${GET_URL_CODE}module.exports = "Text <img src=\\"" + __url__(require("./image.png")) + "\\"><img src=\\"" + __url__(require("bootstrap-img")) + "\\"> Text";`
    );
  });
  it('should accept attrs from query', () => {
    const result = loader.call(
      {
        query: '?attrs=script:src',
      },
      'Text <script src="script.js"><img src="image.png">'
    );

    expect(result).toBe(
      `${GET_URL_CODE}module.exports = "Text <script src=\\"" + __url__(require("./script.js")) + "\\"><img src=\\"image.png\\">";`
    );
  });
  it('should accept attrs from query (space separated)', () => {
    const result = loader.call(
      {
        query: '?attrs=script:src img:src',
      },
      'Text <script src="script.js"><img src="image.png">'
    );

    expect(result).toBe(
      `${GET_URL_CODE}module.exports = "Text <script src=\\"" + __url__(require("./script.js")) + "\\"><img src=\\"" + __url__(require("./image.png")) + "\\">";`
    );
  });
  it('should accept attrs from query (multiple)', () => {
    const result = loader.call(
      {
        query: '?attrs[]=script:src&attrs[]=img:src',
      },
      'Text <script src="script.js"><img src="image.png">'
    );

    expect(result).toBe(
      `${GET_URL_CODE}module.exports = "Text <script src=\\"" + __url__(require("./script.js")) + "\\"><img src=\\"" + __url__(require("./image.png")) + "\\">";`
    );
  });
  it('should accept :attribute (empty tag) from query', () => {
    const result = loader.call(
      {
        query: '?attrs[]=:custom-src',
      },
      'Text <custom-element custom-src="image1.png"><custom-img custom-src="image2.png"/></custom-element>'
    );

    expect(result).toBe(
      `${GET_URL_CODE}module.exports = "Text <custom-element custom-src=\\"" + __url__(require("./image1.png")) + "\\"><custom-img custom-src=\\"" + __url__(require("./image2.png")) + "\\"/></custom-element>";`
    );
  });
  it('should accept :attribute (empty tag) from query and not collide with similar attributes', () => {
    const result = loader.call(
      {
        query: '?attrs[]=:custom-src',
      },
      'Text <custom-element custom-src="image1.png" custom-src-other="other.png"><custom-img custom-src="image2.png"/></custom-element>'
    );

    expect(result).toBe(
      `${GET_URL_CODE}module.exports = "Text <custom-element custom-src=\\"" + __url__(require("./image1.png")) + "\\" custom-src-other=\\"other.png\\"><custom-img custom-src=\\"" + __url__(require("./image2.png")) + "\\"/></custom-element>";`
    );
  });
  it('should not make bad things with templates', () => {
    const result = loader.call(
      {},
      '<h3>#{number} {customer}</h3>\n<p>   {title}   </p>'
    );

    expect(result).toBe(
      `${GET_URL_CODE}module.exports = "<h3>#{number} {customer}</h3>\\n<p>   {title}   </p>";`
    );
  });
  it('should minimize', () => {
    const result = loader.call(
      {
        minimize: true,
      },
      '<!-- comment --><h3 customAttr="">#{number} {customer}</h3>\n<p>   {title}   </p>\n\t <!-- comment --> <img src="image.png" />'
    );

    expect(result).toBe(
      `${GET_URL_CODE}module.exports = "<h3 customattr=\\"\\">#{number} {customer}</h3> <p> {title} </p> <img src=" + __url__(require("./image.png")) + " />";`
    );
  });
  // https://github.com/webpack/webpack/issues/752
  it('should not remove attributes by default', () => {
    const result = loader.call(
      {
        minimize: true,
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
        minimize: true,
        query: '?-removeComments',
      },
      '<!-- comment --><h3 customAttr="">#{number} {customer}</h3><p>{title}</p><!-- comment --><img src="image.png" />'
    );

    expect(result).toBe(
      `${GET_URL_CODE}module.exports = "<!-- comment --><h3 customattr=\\"\\">#{number} {customer}</h3><p>{title}</p><!-- comment --><img src=" + __url__(require("./image.png")) + " />";`
    );
  });
  it('should preserve escaped quotes', () => {
    const result = loader.call(
      {},
      '<script>{"json": "with \\"quotes\\" in value"}</script>'
    );

    expect(result).toBe(
      `${GET_URL_CODE}module.exports = "<script>{\\"json\\": \\"with \\\\\\"quotes\\\\\\" in value\\"}</script>";`
    );
  });

  it('should preserve comments and white spaces when minimizing (via webpack config property)', () => {
    const result = loader.call(
      {
        minimize: true,
        options: {
          htmlLoader: {
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

  it('should preserve comments and white spaces when minizing (via webpack config property)', () => {
    const result = loader.call(
      {
        options: {
          htmlLoader: {
            minimize: true,
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
        minimize: true,
        query: '?caseSensitive',
      },
      '<!-- comment --><h3 customAttr="">#{number} {customer}</h3><p>{title}</p><!-- comment --><img src="image.png" />'
    );

    expect(result).toBe(
      `${GET_URL_CODE}module.exports = "<h3 customAttr=\\"\\">#{number} {customer}</h3><p>{title}</p><img src=" + __url__(require("./image.png")) + " />";`
    );
  });
  it('should accept complex options via a webpack config property', () => {
    const result = loader.call(
      {
        minimize: true,
        options: {
          htmlLoader: {
            ignoreCustomFragments: [/\{\{.*?}}/],
          },
        },
      },
      '<h3>{{ count <= 1 ? "foo" : "bar" }}</h3>'
    );

    expect(result).toBe(
      `${GET_URL_CODE}module.exports = "<h3>{{ count <= 1 ? \\"foo\\" : \\"bar\\" }}</h3>";`
    );
  });
  it('should allow the webpack config property name to be configured', () => {
    const result = loader.call(
      {
        minimize: true,
        options: {
          htmlLoaderSuperSpecialConfig: {
            ignoreCustomFragments: [/\{\{.*?}}/],
          },
        },
        query: '?config=htmlLoaderSuperSpecialConfig',
      },
      '<h3>{{ count <= 1 ? "foo" : "bar" }}</h3>'
    );

    expect(result).toBe(
      `${GET_URL_CODE}module.exports = "<h3>{{ count <= 1 ? \\"foo\\" : \\"bar\\" }}</h3>";`
    );
  });
  it('should not translate root-relative urls (without root query)', () => {
    const result = loader.call({}, 'Text <img src="/image.png">');

    expect(result).toBe(
      `${GET_URL_CODE}module.exports = "Text <img src=\\"/image.png\\">";`
    );
  });
  it('should accept root from query', () => {
    const result = loader.call(
      {
        query: '?root=/test',
      },
      'Text <img src="/image.png">'
    );

    expect(result).toBe(
      `${GET_URL_CODE}module.exports = "Text <img src=\\"" + __url__(require("/test/image.png")) + "\\">";`
    );
  });
  it('should ignore hash fragments in URLs', () => {
    const result = loader.call({}, '<img src="icons.svg#hash">');

    expect(result).toBe(
      `${GET_URL_CODE}module.exports = "<img src=\\"" + __url__(require("./icons.svg")) + "#hash\\">";`
    );
  });
  it("should ignore anchor with 'mailto:' in the href attribute", () => {
    const result = loader.call(
      {},
      '<a href="mailto:username@exampledomain.com"></a>'
    );

    expect(result).toBe(
      `${GET_URL_CODE}module.exports = "<a href=\\"mailto:username@exampledomain.com\\"></a>";`
    );
  });
  it('should ignore interpolations by default', () => {
    const result = loader.call({}, '<img src="${"Hello " + (1+1)}">');

    expect(result).toBe(
      `${GET_URL_CODE}module.exports = "<img src=\\"\${\\"Hello \\" + (1+1)}\\">";`
    );
  });
  it('should enable interpolations when using interpolate flag', () => {
    const result = loader.call(
      {
        query: '?interpolate',
      },
      '<img src="${"Hello " + (1+1)}">'
    );

    expect(result).toBe(
      `${GET_URL_CODE}module.exports = "<img src=\\"" + ("Hello " + (1 + 1)) + "\\">";`
    );
  });
  it('should not change handling of quotes when interpolation is enabled', () => {
    const result = loader.call(
      {
        query: '?interpolate',
      },
      '<script>{"json": "with \\"quotes\\" in value"}</script>'
    );

    expect(result).toBe(
      `${GET_URL_CODE}module.exports = "<script>{\\\"json\\\": \\\"with \\\\\\\"quotes\\\\\\\" in value\\\"}</script>";`
    );
  });
  it('should enable interpolations when using interpolate=require flag and only require function be translate', () => {
    const result = loader.call(
      {
        query: '?interpolate=require',
      },
      '<a href="${list.href}"><img src="${require("./test.jpg")}" /></a>'
    );

    expect(result).toBe(
      `${GET_URL_CODE}module.exports = "<a href=\\"\${list.href}\\"><img src=\\"" + __url__(require("./test.jpg")) + "\\" /></a>";`
    );
  });
  it('should export as default export for es6to5 transpilation', () => {
    const result = loader.call(
      {
        query: '?exportAsDefault',
      },
      '<p>Hello world!</p>'
    );

    expect(result).toBe(
      `${GET_URL_CODE}exports.default = "<p>Hello world!</p>";`
    );
  });
  it('should export as es6 default export', () => {
    const result = loader.call(
      {
        query: '?exportAsEs6Default',
      },
      '<p>Hello world!</p>'
    );

    expect(result).toBe(`${GET_URL_CODE}export default "<p>Hello world!</p>";`);
  });
});
