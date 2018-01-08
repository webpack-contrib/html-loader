/* eslint-disable */
import webpack from '../helpers/compiler';

describe('Options', () => {
  describe('import', () => {
    test('{Boolean} - true - default', async () => {
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

    test('{Boolean} - false', async () => {
      const config = {
        loader: {
          test: /\.html$/,
          options: {
            import: false
          },
        },
      };

      const stats = await webpack('options/import/fixture.js', config);
      const { source } = stats.toJson().modules[1];

      expect(source).toMatchSnapshot();
    });

    test('{RegExp}', async () => {
      const config = {
        loader: {
          test: /\.html$/,
          options: {
            import: /filter/
          },
        },
      };

      const stats = await webpack('options/import/filter/fixture.js', config);
      const { source } = stats.toJson().modules[1];

      expect(source).toMatchSnapshot();
    });

    test('{Function}', async () => {
      const config = {
        loader: {
          test: /\.html$/,
          options: {
            import (url) {
              return /filter/.test(url)
            }
          },
        },
      };

      const stats = await webpack('options/import/filter/fixture.js', config);
      const { source } = stats.toJson().modules[1];

      expect(source).toMatchSnapshot();
    });
  });
});
