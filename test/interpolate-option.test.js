import loader from '../src';
import { GET_URL_CODE } from '../src/constants';

describe("'interpolate' option", () => {
  it('should disabled by default', () => {
    const result = loader.call(
      { mode: 'development' },
      // eslint-disable-next-line no-template-curly-in-string
      '<img src="${"Hello " + (1+1)}">'
    );

    expect(result).toBe(
      `${GET_URL_CODE}module.exports = "<img src=\\"\${\\"Hello \\" + (1+1)}\\">";`
    );
  });

  it('should work with boolean notation', () => {
    const result = loader.call(
      {
        mode: 'development',
        query: '?interpolate',
      },
      // eslint-disable-next-line no-template-curly-in-string
      '<img src="${"Hello " + (1+1)}"><img src="${`Hello ` + (1+1)}"><p>Something about the \\` character</p><script>{"json": "with \\"quotes\\" in value"}</script>'
    );

    expect(result).toBe(
      // eslint-disable-next-line no-useless-escape
      `${GET_URL_CODE}module.exports = "<img src=\\"" + ("Hello " + (1 + 1)) + "\\"><img src=\\"" + ("Hello " + (1 + 1)) + "\\"><p>Something about the \` character</p><script>{\\\"json\\\": \\\"with \\\\\\\"quotes\\\\\\\" in value\\\"}</script>";`
    );
  });

  it('should work with the "require"', () => {
    const result = loader.call(
      {
        mode: 'development',
        query: '?interpolate=require',
      },
      // eslint-disable-next-line no-template-curly-in-string
      '<a href="${list.href}"><img src="${require("./test.jpg")}" /></a>'
    );

    expect(result).toBe(
      `${GET_URL_CODE}module.exports = "<a href=\\"\${list.href}\\"><img src=\\"" + __url__(require("./test.jpg")) + "\\" /></a>";`
    );
  });
});
