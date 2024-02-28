import path from "path";

import webpack from "webpack";
import { createFsFromVolume, Volume } from "memfs";

export default (fixture, loaderOptions = {}, config = {}) => {
  const fullConfig = {
    mode: "development",
    devtool: config.devtool || false,
    context: path.resolve(__dirname, "../fixtures"),
    entry: path.resolve(__dirname, "../fixtures", fixture),
    output: {
      path: path.resolve(__dirname, "../outputs"),
      filename: "[name].bundle.js",
      chunkFilename: "[name].chunk.js",
      chunkLoading: "require",
      publicPath: "/webpack/public/path/",
      library: "___TEST___",
      assetModuleFilename: "[name][ext]",
      hashFunction: "xxhash64",
    },
    module: {
      rules: [
        {
          test: /\.(html|hbs)$/i,
          rules: [
            {
              loader: path.resolve(__dirname, "../../src"),
              options: loaderOptions || {},
            },
          ],
        },
        {
          resourceQuery: /\?url$/,
          type: "asset/inline",
        },
        {
          test: /\.(png|jpg|gif|svg|ico|eot|ttf|woff|woff2|ogg|pdf|vtt|webp|xml|webmanifest|mp3|mp4)$/i,
          resourceQuery: /^(?!.*\?url).*$/,
          type: "asset/resource",
        },
        {
          test: /\.file.css$/i,
          type: "asset/resource",
        },
        {
          test: /\.file.js$/i,
          type: "asset/resource",
        },
      ],
    },
    resolve: {
      alias: {
        aliasImg: path.resolve(__dirname, "../fixtures/image.png"),
        aliasImageWithSpace: path.resolve(
          __dirname,
          "../fixtures/image image.png"
        ),
      },
    },
    plugins: [],
    ...config,
  };

  const compiler = webpack(fullConfig);

  if (!config.outputFileSystem) {
    compiler.outputFileSystem = createFsFromVolume(new Volume());
  }

  return compiler;
};
