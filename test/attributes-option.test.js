import loader from '../src';
import { GET_URL_CODE } from '../src/constants';

describe("'attributes' option", () => {
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

  it('should work with a "boolean" notation', () => {
    const result = loader.call(
      {
        mode: 'development',
        query: '?attributes=false',
      },
      'Text <script src="script.js"><img src="image.png">'
    );

    expect(result).toBe(
      `${GET_URL_CODE}module.exports = "Text <script src=\\"script.js\\"><img src=\\"image.png\\">";`
    );
  });

  it('should work with a "boolean" notation', () => {
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
});
