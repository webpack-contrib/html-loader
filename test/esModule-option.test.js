import {
  compile,
  execute,
  getCompiler,
  getErrors,
  getModuleSource,
  getWarnings,
  readAsset,
} from "./helpers";

describe("'esModule' option", () => {
  it("should use a CommonJS export by default", async () => {
    const compiler = getCompiler("simple.js");
    const stats = await compile(compiler);

    expect(getModuleSource("./simple.html", stats)).toMatchSnapshot("module");
    expect(
      execute(readAsset("main.bundle.js", compiler, stats))
    ).toMatchSnapshot("result");
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it('should use a CommonJS export when the value is "false"', async () => {
    const compiler = getCompiler("simple.js", { esModule: false });
    const stats = await compile(compiler);

    expect(getModuleSource("./simple.html", stats)).toMatchSnapshot("module");
    expect(
      execute(readAsset("main.bundle.js", compiler, stats))
    ).toMatchSnapshot("result");
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it('should use an ES module export when the value is "true"', async () => {
    const compiler = getCompiler("simple.js", { esModule: true });
    const stats = await compile(compiler);

    expect(getModuleSource("./simple.html", stats)).toMatchSnapshot("module");
    expect(
      execute(readAsset("main.bundle.js", compiler, stats))
    ).toMatchSnapshot("result");
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });
});
