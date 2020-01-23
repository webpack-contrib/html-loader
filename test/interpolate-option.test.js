import {
  compile,
  execute,
  getCompiler,
  getErrors,
  getModuleSource,
  getWarnings,
  readAsset,
} from './helpers';

describe("'interpolate' option", () => {
  it('should disabled by default', async () => {
    const compiler = getCompiler('template.js');
    const stats = await compile(compiler);

    expect(getModuleSource('./template.html', stats)).toMatchSnapshot('module');
    expect(
      execute(readAsset('main.bundle.js', compiler, stats))
    ).toMatchSnapshot('result');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should work with boolean notation', async () => {
    const compiler = getCompiler('template.js', { interpolate: true });
    const stats = await compile(compiler);

    expect(getModuleSource('./template.html', stats)).toMatchSnapshot('module');
    expect(
      execute(readAsset('main.bundle.js', compiler, stats))
    ).toMatchSnapshot('result');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should work with the "require"', async () => {
    const compiler = getCompiler('template.js', { interpolate: 'require' });
    const stats = await compile(compiler);

    expect(getModuleSource('./template.html', stats)).toMatchSnapshot('module');
    expect(
      execute(readAsset('main.bundle.js', compiler, stats))
    ).toMatchSnapshot('result');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should emit an error on broken interpolation syntax', async () => {
    const compiler = getCompiler('broken-interpolation-syntax.js', {
      interpolate: true,
    });
    const stats = await compile(compiler);

    expect(
      getModuleSource('./broken-interpolation-syntax.html', stats)
    ).toMatchSnapshot('module');
    expect(
      execute(readAsset('main.bundle.js', compiler, stats))
    ).toMatchSnapshot('result');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });
});
