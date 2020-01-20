import loader from '../src';

describe("'esModule' option", () => {
  it('should use a CommonJS export by default', () => {
    const result = loader.call({ query: '' }, '<p>Hello world!</p>');

    expect(result).toBe(`module.exports = "<p>Hello world!</p>";`);
  });

  it('should use a CommonJS export when the value is "false"', () => {
    const result = loader.call(
      { query: '?esModule=false' },
      '<p>Hello world!</p>'
    );

    expect(result).toBe(`module.exports = "<p>Hello world!</p>";`);
  });

  it('should use an ES module export when the value is "true"', () => {
    const result = loader.call(
      { query: '?esModule=true' },
      '<p>Hello world!</p>'
    );

    expect(result).toBe(`export default "<p>Hello world!</p>";`);
  });
});
