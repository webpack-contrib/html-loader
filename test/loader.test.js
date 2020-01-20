/* eslint-disable no-useless-escape,no-template-curly-in-string */

import loader from '../src';
import { GET_URL_CODE } from '../src/constants';

describe('loader', () => {
  it('should convert to requires', () => {
    const result = loader.call(
      { mode: 'development' },
      'Text <img src="image.png"><img src="~bootstrap-img"> Text <img src="">'
    );

    expect(result).toBe(
      `${GET_URL_CODE}module.exports = "Text <img src=\\"" + __url__(require("./image.png")) + "\\"><img src=\\"" + __url__(require("bootstrap-img")) + "\\"> Text <img src=\\\"\\\">";`
    );
  });

  it('should not make bad things with templates', () => {
    const result = loader.call(
      { mode: 'development' },
      '<h3>#{number} {customer}</h3>\n<p>   {title}   </p>'
    );

    expect(result).toBe(
      `${GET_URL_CODE}module.exports = "<h3>#{number} {customer}</h3>\\n<p>   {title}   </p>";`
    );
  });

  it('should preserve escaped quotes', () => {
    const result = loader.call(
      { mode: 'development' },
      '<script>{"json": "with \\"quotes\\" in value"}</script>'
    );

    expect(result).toBe(
      `${GET_URL_CODE}module.exports = "<script>{\\"json\\": \\"with \\\\\\"quotes\\\\\\" in value\\"}</script>";`
    );
  });

  it('should not translate root-relative urls (without root query)', () => {
    const result = loader.call(
      { mode: 'development' },
      'Text <img src="/image.png">'
    );

    expect(result).toBe(
      `${GET_URL_CODE}module.exports = "Text <img src=\\"/image.png\\">";`
    );
  });

  it('should accept root from query', () => {
    const result = loader.call(
      {
        mode: 'development',
        query: '?root=/test',
      },
      'Text <img src="/image.png">'
    );

    expect(result).toBe(
      `${GET_URL_CODE}module.exports = "Text <img src=\\"" + __url__(require("/test/image.png")) + "\\">";`
    );
  });

  it('should ignore hash fragments in URLs', () => {
    const result = loader.call(
      { mode: 'development' },
      '<img src="icons.svg#hash">'
    );

    expect(result).toBe(
      `${GET_URL_CODE}module.exports = "<img src=\\"" + __url__(require("./icons.svg")) + "#hash\\">";`
    );
  });

  it("should ignore anchor with 'mailto:' in the href attribute", () => {
    const result = loader.call(
      { mode: 'development' },
      '<a href="mailto:username@exampledomain.com"></a>'
    );

    expect(result).toBe(
      `${GET_URL_CODE}module.exports = "<a href=\\"mailto:username@exampledomain.com\\"></a>";`
    );
  });

  it('should ignore interpolations by default', () => {
    const result = loader.call(
      { mode: 'development' },
      '<img src="${"Hello " + (1+1)}">'
    );

    expect(result).toBe(
      `${GET_URL_CODE}module.exports = "<img src=\\"\${\\"Hello \\" + (1+1)}\\">";`
    );
  });

  it('should enable interpolations when using interpolate flag', () => {
    const result = loader.call(
      {
        mode: 'development',
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
        mode: 'development',
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
        mode: 'development',
        query: '?interpolate=require',
      },
      '<a href="${list.href}"><img src="${require("./test.jpg")}" /></a>'
    );

    expect(result).toBe(
      `${GET_URL_CODE}module.exports = "<a href=\\"\${list.href}\\"><img src=\\"" + __url__(require("./test.jpg")) + "\\" /></a>";`
    );
  });

  it('should export as es6 default export', () => {
    const result = loader.call(
      {
        query: '?esModule',
      },
      '<p>Hello world!</p>'
    );

    expect(result).toBe(`${GET_URL_CODE}export default "<p>Hello world!</p>";`);
  });
});
