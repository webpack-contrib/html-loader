import loader from '../src/';

describe('Errors', () => {
  test('- Options - ValidationError', () => {
    const err = () => loader.call({ query: { root: 1 } }, '<html></html>');

    expect(err).toThrow();
    expect(err).toThrowErrorMatchingSnapshot();
  });
});
