/* eslint-disable */
import path from 'path';
import dom from '../helpers/dom';
import webpack from '../helpers/compiler';

describe('E2E', () => {
  test('HTML', async () => {
    const config = {
      rules: [
        {
          test: /\.html$/,
          use: [
            {
              loader: path.resolve('./src'),
              options: {},
            },
          ],
        },
        {
          test: /\.png$/,
          use: ['file-loader'],
        },
      ],
    };

    const stats = await webpack('e2e/html.js', config);
    const { assets } = stats.compilation;

    const scripts = {
      main: assets['main.js'].source(),
      runtime: assets['runtime.js'].source(),
    };

    const { window } = dom([scripts.runtime, scripts.main]);

    expect(window.document.body.innerHTML).toMatchSnapshot();
  });
});
