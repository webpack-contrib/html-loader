/* eslint-disable */
import path from 'path';

import webpack from 'webpack';
import MemoryFS from 'memory-fs';

export default function (fixture, options = { loader: {}, plugins: [] }) {
  const config = {
    // target: 'node',
    devtool: 'sourcemap',
    context: path.resolve(__dirname, 'fixtures'),
    resolve: {},
    entry: {
      index: `./${fixture}`
    },
    output: {
      path: path.resolve(__dirname, 'expect'),
      // publicPath: 'https://cdn.domain.com/',
      filename: '[name].js',
      sourceMapFilename: '[name].js.map'
    },
    module: {
      rules: [
        {
          test: /\.html$/,
          use: [
            {
              loader: path.resolve(__dirname, '../src/cjs.js'),
              options: options.loader || {}
            }
          ]
        }
      ]
    },
    plugins: [
      new webpack.NamedChunksPlugin(),
      new webpack.NamedModulesPlugin(),
      new webpack.optimize.CommonsChunkPlugin({
        name: [ 'runtime' ],
        minChunks: Infinity
      })
    ]
    // .concat(options.plugins)
  };

  const compiler = webpack(config);

  compiler.outputFileSystem = new MemoryFS();

  return new Promise((resolve, reject) => {
    compiler.run((err, stats) => {
      if (err) reject(err);
      resolve(stats);
    });
  });
}
