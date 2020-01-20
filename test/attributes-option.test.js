import loader from '../src';
import { GET_URL_CODE } from '../src/constants';

describe("'attributes' option", () => {
  it('should work by default', () => {
    const result = loader.call(
      { mode: 'development' },
      'Text <img src="image.png"><img src="~bootstrap-img"> Text <img src="">'
    );

    expect(result).toBe(
      // eslint-disable-next-line no-useless-escape
      `${GET_URL_CODE}module.exports = "Text <img src=\\"" + __url__(require("./image.png")) + "\\"><img src=\\"" + __url__(require("bootstrap-img")) + "\\"> Text <img src=\\\"\\\">";`
    );
  });

  it('should work with a "string" notation', () => {
    const result = loader.call(
      {
        mode: 'development',
        query: '?attributes=script:src',
      },
      'Text <script src="script.js"><img src="image.png">'
    );

    expect(result).toBe(
      `${GET_URL_CODE}module.exports = "Text <script src=\\"" + __url__(require("./script.js")) + "\\"><img src=\\"image.png\\">";`
    );
  });

  it('should work with multiple a "string" notations', () => {
    const result = loader.call(
      {
        mode: 'development',
        query: '?attributes=script:src img:src',
      },
      'Text <script src="script.js"><img src="image.png">'
    );

    expect(result).toBe(
      `${GET_URL_CODE}module.exports = "Text <script src=\\"" + __url__(require("./script.js")) + "\\"><img src=\\"" + __url__(require("./image.png")) + "\\">";`
    );
  });

  it('should work with an "array" notations', () => {
    const result = loader.call(
      {
        mode: 'development',
        query: '?attributes[]=img:src',
      },
      'Text <script src="script.js"><img src="image.png">'
    );

    expect(result).toBe(
      `${GET_URL_CODE}module.exports = "Text <script src=\\"script.js\\"><img src=\\"" + __url__(require("./image.png")) + "\\">";`
    );
  });

  it('should work with multiple an "array" notations', () => {
    const result = loader.call(
      {
        mode: 'development',
        query: '?attributes[]=script:src&attributes[]=img:src',
      },
      'Text <script src="script.js"><img src="image.png">'
    );

    expect(result).toBe(
      `${GET_URL_CODE}module.exports = "Text <script src=\\"" + __url__(require("./script.js")) + "\\"><img src=\\"" + __url__(require("./image.png")) + "\\">";`
    );
  });

  it('should work with a custom attribute', () => {
    const result = loader.call(
      {
        mode: 'development',
        query: '?attributes[]=:custom-src',
      },
      'Text <custom-element custom-src="image1.png"><custom-img custom-src="image2.png"/></custom-element>'
    );

    expect(result).toBe(
      `${GET_URL_CODE}module.exports = "Text <custom-element custom-src=\\"" + __url__(require("./image1.png")) + "\\"><custom-img custom-src=\\"" + __url__(require("./image2.png")) + "\\"/></custom-element>";`
    );
  });

  it('should not handle attributes with a "boolean" notation equals "false"', () => {
    const result = loader.call(
      {
        mode: 'development',
        query: '?attributes=false',
      },
      'Text <script src="script.js"><img src="image.png">'
    );

    expect(result).toBe(
      'module.exports = "Text <script src=\\"script.js\\"><img src=\\"image.png\\">";'
    );
  });

  it('should handle attributes with a "boolean" notation equals "true"', () => {
    const result = loader.call(
      {
        mode: 'development',
        query: '?attributes=true',
      },
      'Text <script src="script.js"><img src="image.png">'
    );

    expect(result).toBe(
      `${GET_URL_CODE}module.exports = "Text <script src=\\"script.js\\"><img src=\\"" + __url__(require("./image.png")) + "\\">";`
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

  it('should ignore some anchor by default in attributes', () => {
    const result = loader.call(
      { mode: 'development' },
      '<a href="mailto:username@exampledomain.com"></a>'
    );

    expect(result).toBe(
      'module.exports = "<a href=\\"mailto:username@exampledomain.com\\"></a>";'
    );
  });
});
