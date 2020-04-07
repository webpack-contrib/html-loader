import path from 'path';

import {
  compile,
  execute,
  getCompiler,
  getErrors,
  getModuleSource,
  getWarnings,
  readAsset,
} from './helpers';

describe("'attributes' option", () => {
  it('should work by default', async () => {
    const compiler = getCompiler('simple.js');
    const stats = await compile(compiler);

    expect(getModuleSource('./simple.html', stats)).toMatchSnapshot('module');
    expect(
      execute(readAsset('main.bundle.js', compiler, stats))
    ).toMatchSnapshot('result');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should handle "src" and "srcset" tags correctly', async () => {
    const compiler = getCompiler('sources.js');
    const stats = await compile(compiler);

    expect(getModuleSource('./sources.html', stats)).toMatchSnapshot('module');
    expect(
      execute(readAsset('main.bundle.js', compiler, stats))
    ).toMatchSnapshot('result');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should not handle attributes with a "boolean" notation equals "false"', async () => {
    const compiler = getCompiler('simple.js', { attributes: false });
    const stats = await compile(compiler);

    expect(getModuleSource('./simple.html', stats)).toMatchSnapshot('module');
    expect(
      execute(readAsset('main.bundle.js', compiler, stats))
    ).toMatchSnapshot('result');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should handle attributes with a "boolean" notation equals "true"', async () => {
    const compiler = getCompiler('simple.js', { attributes: true });
    const stats = await compile(compiler);

    expect(getModuleSource('./simple.html', stats)).toMatchSnapshot('module');
    expect(
      console.log(execute(readAsset('main.bundle.js', compiler, stats)))
    ).toMatchSnapshot('result');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should work with an empty "object" notations', async () => {
    const compiler = getCompiler('simple.js', {
      attributes: {},
    });
    const stats = await compile(compiler);

    expect(getModuleSource('./simple.html', stats)).toMatchSnapshot('module');
    expect(
      execute(readAsset('main.bundle.js', compiler, stats))
    ).toMatchSnapshot('result');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should work with an "object" notations', async () => {
    const compiler = getCompiler('simple.js', {
      attributes: {
        list: [
          {
            tag: 'img',
            attribute: 'src',
            type: 'src',
          },
          {
            tag: 'img',
            attribute: 'data-src',
            type: 'src',
          },
          {
            tag: 'img',
            attribute: 'data-srcset',
            type: 'srcset',
          },
          {
            tag: 'source',
            attribute: 'src',
            type: 'src',
          },
          {
            tag: 'source',
            attribute: 'srcset',
            type: 'srcset',
          },
          {
            tag: 'flag-icon',
            attribute: 'src',
            type: 'src',
          },
          {
            tag: 'MyStrangeTag13',
            attribute: 'src',
            type: 'src',
          },
          {
            tag: 'a-',
            attribute: 'src',
            type: 'src',
          },
          {
            tag: 'a-.',
            attribute: 'src',
            type: 'src',
          },
          {
            tag: 'a--',
            attribute: 'src',
            type: 'src',
          },
          {
            tag: 'aÀ-豈',
            attribute: 'src',
            type: 'src',
          },
          {
            tag: 'aÀ-Ⰰ',
            attribute: 'src',
            type: 'src',
          },
          {
            tag: 'INVALID_TAG_NAME',
            attribute: 'src',
            type: 'src',
          },
          {
            tag: 'invalid-CUSTOM-TAG',
            attribute: 'src',
            type: 'src',
          },
        ],
        urlFilter: (attribute, value, resourcePath) => {
          expect(typeof attribute).toBe('string');
          expect(typeof value).toBe('string');
          expect(typeof resourcePath).toBe('string');

          if (value.includes('example')) {
            return false;
          }

          return true;
        },
        root: '.',
      },
    });
    const stats = await compile(compiler);

    expect(getModuleSource('./simple.html', stats)).toMatchSnapshot('module');
    expect(
      execute(readAsset('main.bundle.js', compiler, stats))
    ).toMatchSnapshot('result');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should handle all src attributes in all HTML tags when tag is undefined', async () => {
    const compiler = getCompiler('simple.js', {
      attributes: {
        list: [
          {
            attribute: 'src',
            type: 'src',
          },
        ],
      },
    });
    const stats = await compile(compiler);

    expect(getModuleSource('./simple.html', stats)).toMatchSnapshot('module');
    expect(
      execute(readAsset('main.bundle.js', compiler, stats))
    ).toMatchSnapshot('result');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should handle all src attributes in all HTML tags except img (testing filter option) tag is undefined', async () => {
    const compiler = getCompiler('simple.js', {
      attributes: {
        list: [
          {
            attribute: 'src',
            type: 'src',
            // eslint-disable-next-line no-unused-vars
            filter: (tag, attribute, attributes) => {
              return tag.toLowerCase() !== 'img';
            },
          },
        ],
      },
    });
    const stats = await compile(compiler);

    expect(getModuleSource('./simple.html', stats)).toMatchSnapshot('module');
    expect(
      execute(readAsset('main.bundle.js', compiler, stats))
    ).toMatchSnapshot('result');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should work by default with CommonJS module syntax', async () => {
    const compiler = getCompiler(
      'simple.js',
      {},
      {
        module: {
          rules: [
            {
              test: /\.html$/i,
              rules: [
                {
                  loader: path.resolve(__dirname, '../src'),
                  options: { esModule: false },
                },
              ],
            },
            {
              test: /\.(png|jpg|gif|svg|eot|ttf|woff|woff2|ogg|pdf|vtt|css)$/i,
              loader: 'file-loader',
              options: { esModule: false, name: '[name].[ext]' },
            },
          ],
        },
      }
    );
    const stats = await compile(compiler);

    expect(getModuleSource('./simple.html', stats)).toMatchSnapshot('module');
    expect(
      execute(readAsset('main.bundle.js', compiler, stats))
    ).toMatchSnapshot('result');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should work by default with ES module syntax', async () => {
    const compiler = getCompiler(
      'simple.js',
      {},
      {
        module: {
          rules: [
            {
              test: /\.html$/i,
              rules: [
                {
                  loader: path.resolve(__dirname, '../src'),
                  options: { esModule: true },
                },
              ],
            },
            {
              test: /\.(png|jpg|gif|svg|eot|ttf|woff|woff2|ogg|pdf|vtt|css)$/i,
              loader: 'file-loader',
              options: { esModule: true, name: '[name].[ext]' },
            },
          ],
        },
      }
    );
    const stats = await compile(compiler);

    expect(getModuleSource('./simple.html', stats)).toMatchSnapshot('module');
    expect(
      execute(readAsset('main.bundle.js', compiler, stats))
    ).toMatchSnapshot('result');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should work by default with ES module syntax from CommonJS module syntax from other loader', async () => {
    const compiler = getCompiler(
      'simple.js',
      {},
      {
        module: {
          rules: [
            {
              test: /\.html$/i,
              rules: [
                {
                  loader: path.resolve(__dirname, '../src'),
                  options: { esModule: true },
                },
              ],
            },
            {
              test: /\.(png|jpg|gif|svg|eot|ttf|woff|woff2|ogg|pdf|vtt|css)$/i,
              loader: 'file-loader',
              options: { esModule: false, name: '[name].[ext]' },
            },
          ],
        },
      }
    );
    const stats = await compile(compiler);

    expect(getModuleSource('./simple.html', stats)).toMatchSnapshot('module');
    expect(
      execute(readAsset('main.bundle.js', compiler, stats))
    ).toMatchSnapshot('result');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should work by default with CommonJS module syntax and ES module syntax from other loader', async () => {
    const compiler = getCompiler(
      'simple.js',
      {},
      {
        module: {
          rules: [
            {
              test: /\.html$/i,
              rules: [
                {
                  loader: path.resolve(__dirname, '../src'),
                  options: { esModule: false },
                },
              ],
            },
            {
              test: /\.(png|jpg|gif|svg|eot|ttf|woff|woff2|ogg|pdf|vtt|css)$/i,
              loader: 'file-loader',
              options: { esModule: true, name: '[name].[ext]' },
            },
          ],
        },
      }
    );
    const stats = await compile(compiler);

    expect(getModuleSource('./simple.html', stats)).toMatchSnapshot('module');
    expect(
      execute(readAsset('main.bundle.js', compiler, stats))
    ).toMatchSnapshot('result');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });
});
