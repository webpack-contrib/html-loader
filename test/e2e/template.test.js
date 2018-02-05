/* eslint-disable */
import path from 'path';
import webpack, { dom } from '@webpack-contrib/test-utils';

describe('E2E', () => {
  test('Templates', async () => {
    const config = {
      rules: [
        {
          test: /\.html$/,
          use: [
            {
              loader: path.resolve('./src'),
              options: { template: true },
            },
          ],
        },
        {
          test: /\.png$/,
          use: ['file-loader'],
        },
      ],
    };

    const stats = await webpack('e2e/template.js', config);
    const { assets } = stats.compilation;

    const scripts = {
      main: assets['main.js'].source(),
      runtime: assets['main-runtime.js'].source(),
    };

    const { window } = dom([scripts.runtime, scripts.main]);

    expect(window.document.body.innerHTML).toMatchSnapshot();
  });
});
