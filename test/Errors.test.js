/* eslint-disable
  no-eval,
  import/order,
  arrow-parens,
  prefer-destructuring,
*/
import loader from '../src/';

import webpack from './webpack';
import { stats } from './helpers';

describe('Errors', () => {
  test('ValidationError', () => {
    const err = () => loader.call({ query: { root: 1 } }, '<html></html>');

    expect(err).toThrow();
    expect(err).toThrowErrorMatchingSnapshot();
  });

  test('LoaderError', () => {
    const config = {};

    return webpack('index.js', config)
      .then((result) => stats(result))
      .then(({ loaders }) => {
        expect(() => eval(loaders.err)).toThrow();
        expect(() => eval(loaders.err)).toThrowErrorMatchingSnapshot();
      })
      .catch((err) => err);
  });
});
