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
});
