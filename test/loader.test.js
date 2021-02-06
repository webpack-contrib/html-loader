import fs from 'fs';
import path from 'path';

import {
  compile,
  getCompiler,
  getErrors,
  getModuleSource,
  getWarnings,
  execute,
  readAsset,
} from './helpers';

describe('loader', () => {
  it('should work', async () => {
    const compiler = getCompiler('simple.js');
    const stats = await compile(compiler);

    expect(getModuleSource('./simple.html', stats)).toMatchSnapshot('module');
    expect(
      execute(readAsset('main.bundle.js', compiler, stats))
    ).toMatchSnapshot('result');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should work with an empty file', async () => {
    const compiler = getCompiler('empty.js');
    const stats = await compile(compiler);

    expect(getModuleSource('./empty.html', stats)).toMatchSnapshot('module');
    expect(
      execute(readAsset('main.bundle.js', compiler, stats))
    ).toMatchSnapshot('result');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should not make bad things with templates', async () => {
    const compiler = getCompiler('template.js');
    const stats = await compile(compiler);

    expect(getModuleSource('./template.html', stats)).toMatchSnapshot('module');
    expect(
      execute(readAsset('main.bundle.js', compiler, stats))
    ).toMatchSnapshot('result');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should not failed contain invisible spaces', async () => {
    const source = fs.readFileSync(
      path.resolve(__dirname, './fixtures/invisible-space.html')
    );

    expect(/[\u2028\u2029]/.test(source)).toBe(true);

    const compiler = getCompiler('invisible-space.js');
    const stats = await compile(compiler);

    const moduleSource = getModuleSource('./invisible-space.html', stats);

    expect(moduleSource).toMatchSnapshot('module');
    expect(/[\u2028\u2029]/.test(moduleSource)).toBe(false);
    expect(
      execute(readAsset('main.bundle.js', compiler, stats))
    ).toMatchSnapshot('result');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should emit an error on broken HTML syntax', async () => {
    const compiler = getCompiler('broken-html-syntax.js');
    const stats = await compile(compiler);

    expect(getModuleSource('./broken-html-syntax.html', stats)).toMatchSnapshot(
      'module'
    );
    expect(
      execute(readAsset('main.bundle.js', compiler, stats))
    ).toMatchSnapshot('result');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should work with server-relative url', async () => {
    const compiler = getCompiler('nested.js');
    const stats = await compile(compiler);

    expect(getModuleSource('./nested.html', stats)).toMatchSnapshot('module');
    expect(
      execute(readAsset('main.bundle.js', compiler, stats))
    ).toMatchSnapshot('result');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should work with "resolve.roots"', async () => {
    const compiler = getCompiler(
      'roots.js',
      {},
      {
        resolve: {
          roots: [path.resolve(__dirname, 'fixtures/roots')],
        },
      }
    );
    const stats = await compile(compiler);

    expect(getModuleSource('./roots.html', stats)).toMatchSnapshot('module');
    expect(
      execute(readAsset('main.bundle.js', compiler, stats))
    ).toMatchSnapshot('result');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should work with absolute paths', async () => {
    const file = path.resolve(__dirname, 'fixtures', 'generated-1.html');
    const absolutePath = path.resolve(__dirname, 'fixtures', 'image.png');

    fs.writeFileSync(file, `<img src="${absolutePath}">`);

    const compiler = getCompiler('absolute.js');
    const stats = await compile(compiler);

    // expect(getModuleSource('./generated-1.html', stats)).toMatchSnapshot(
    //   'module'
    // );
    expect(
      execute(readAsset('main.bundle.js', compiler, stats))
    ).toMatchSnapshot('result');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should work with file protocol', async () => {
    const file = path.resolve(__dirname, 'fixtures', 'generated-2.html');
    const absolutePath = path.resolve(__dirname, 'fixtures', 'image.png');

    fs.writeFileSync(file, `<img src="file:///${absolutePath}">`);

    const compiler = getCompiler('file-protocol.js');
    const stats = await compile(compiler);

    // expect(getModuleSource('./generated-2.html', stats)).toMatchSnapshot(
    //   'module'
    // );
    expect(
      execute(readAsset('main.bundle.js', compiler, stats))
    ).toMatchSnapshot('result');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });
});
