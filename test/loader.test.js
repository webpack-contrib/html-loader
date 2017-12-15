/* eslint-disable */
import webpack from './helpers/compiler';

describe("Loader", () => {
  test('Defaults', async () => {
    const config = {
      loader: {
        test: /\.html$/,
        options: {}
      }
    };

    const stats = await webpack('fixture.js', config);
    const { source } = stats.toJson().modules[1];

    expect(source).toMatchSnapshot();
  });
});
