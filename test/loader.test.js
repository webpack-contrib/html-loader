/* eslint-disable */
import path from 'path';
import webpack from '@webpack-contrib/test-utils';

describe('Loader', () => {
  test('Defaults', async () => {
    const config = {
      rules: [
        {
          test: /\.html$/,
          use: [
            {
              loader: path.resolve('src'),
              options: {},
            },
          ],
        },
        {
          test: /\.png$/,
          use: ['file-loader'],
        },
      ],
    }

    const stats = await webpack('fixture.js', config);
    const { source } = stats.toJson().modules[2];


    expect(source).toMatchSnapshot();
  });
});
