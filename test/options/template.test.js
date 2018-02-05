/* eslint-disable
  prefer-destructuring,
*/
import webpack from '@webpack-contrib/test-utils';

describe('Options', () => {
  describe('template', () => {
    test('{Boolean}', async () => {
      const config = {
        loader: {
          test: /\.html$/,
          options: {
            template: true,
          },
        },
      };

      const stats = await webpack('options/template/fixture.js', config);
      const { source } = stats.toJson().modules[0];

      expect(source).toMatchSnapshot();
    });

    test('{String}', async () => {
      const config = {
        loader: {
          test: /\.html$/,
          options: {
            template: '$',
          },
        },
      };

      const stats = await webpack('options/template/fixture.js', config);
      const { source } = stats.toJson().modules[0];

      expect(source).toMatchSnapshot();
    });
  });
});
