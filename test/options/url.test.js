/* eslint-disable
  prefer-destructuring,
*/
import webpack from '../helpers/compiler';

describe('Options', () => {
  describe('url', () => {
    test('{Boolean}', async () => {
      const config = {
        loader: {
          test: /\.html$/,
          options: {},
        },
      };

      const stats = await webpack('options/url/fixture.js', config);
      const { source } = stats.toJson().modules[1];

      expect(source).toMatchSnapshot();
    });
  });
});
