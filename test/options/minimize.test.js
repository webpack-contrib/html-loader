/* eslint-disable */
import webpack from '../helpers/compiler';

describe('Options', () => {
  describe('minimize', () => {
    test('{Boolean}', async () => {
      const config = {
        loader: {
          test: /\.html$/,
          options: {
            minimize: true,
          },
        },
      };

      const stats = await webpack('options/minimize/fixture.js', config);
      const { source } = stats.toJson().modules[1];

      expect(source).toMatchSnapshot();
    });
  });
});
