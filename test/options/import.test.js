/* eslint-disable */
import webpack from '../helpers/compiler';

describe('Options', () => {
  describe('import', () => {
    test('{Boolean}', async () => {
      const config = {
        loader: {
          test: /\.html$/,
          options: {},
        },
      };

      const stats = await webpack('options/import/fixture.js', config);
      const { source } = stats.toJson().modules[1];

      expect(source).toMatchSnapshot();
    });
  });
});
