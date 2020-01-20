import loader from '../src';
import { GET_URL_CODE } from '../src/constants';

describe("'esModule' option", () => {
  it('should use a CommonJS export by default', () => {
    const result = loader.call({ query: '' }, '<p>Hello world!</p>');

    expect(result).toBe(
      `${GET_URL_CODE}module.exports = "<p>Hello world!</p>";`
    );
  });

  it('should use a CommonJS export when the value is "false"', () => {
    const result = loader.call(
      { query: '?esModule=false' },
      '<p>Hello world!</p>'
    );

    expect(result).toBe(
      `${GET_URL_CODE}module.exports = "<p>Hello world!</p>";`
    );
  });

  it('should use an ES module export when the value is "true"', () => {
    const result = loader.call(
      { query: '?esModule=true' },
      '<p>Hello world!</p>'
    );

    expect(result).toBe(`${GET_URL_CODE}export default "<p>Hello world!</p>";`);
  });
});
