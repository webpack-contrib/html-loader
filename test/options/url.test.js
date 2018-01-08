/* eslint-disable
  prefer-destructuring,
*/
import webpack from '../helpers/compiler';

describe('Options', () => {
  describe('url', () => {
    test('{Boolean} - true - (default)', async () => {
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

    test('{Boolean} - false', async () => {
      const config = {
        loader: {
          test: /\.html$/,
          options: {
            url: false,
          },
        },
      };

      const stats = await webpack('options/url/fixture.js', config);
      const { source } = stats.toJson().modules[1];

      expect(source).toMatchSnapshot();
    });

    test('{RegExp}', async () => {
      const config = {
        loader: {
          test: /\.html$/,
          options: {
            url: /filter/,
          },
        },
      };

      const stats = await webpack('options/url/filter/fixture.js', config);
      const { source } = stats.toJson().modules[1];

      expect(source).toMatchSnapshot();
    });

    test('{Function}', async () => {
      const config = {
        loader: {
          test: /\.html$/,
          options: {
            url(url) {
              return /filter/.test(url);
            },
          },
        },
      };

      const stats = await webpack('options/url/filter/fixture.js', config);
      const { source } = stats.toJson().modules[1];

      expect(source).toMatchSnapshot();
    });
  });
});
