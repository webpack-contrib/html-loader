/**
 * @jest-environment node
 */

import {
  compile,
  execute,
  getCompiler,
  getErrors,
  getModuleSource,
  getWarnings,
  readAsset,
} from "./helpers";

describe('"minimize" option', () => {
  it("should be turned off by default", async () => {
    const compiler = getCompiler("simple.js");
    const stats = await compile(compiler);

    expect(getModuleSource("./simple.html", stats)).toMatchSnapshot("module");
    expect(
      execute(readAsset("main.bundle.js", compiler, stats))
    ).toMatchSnapshot("result");
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it('should be turned off in "development" mode', async () => {
    const compiler = getCompiler("simple.js", {}, { mode: "development" });
    const stats = await compile(compiler);

    expect(getModuleSource("./simple.html", stats)).toMatchSnapshot("module");
    expect(
      execute(readAsset("main.bundle.js", compiler, stats))
    ).toMatchSnapshot("result");
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it('should be turned on in "production" mode', async () => {
    const compiler = getCompiler("simple.js", {}, { mode: "production" });
    const stats = await compile(compiler);

    expect(getModuleSource("./simple.html", stats)).toMatchSnapshot("module");
    expect(
      execute(readAsset("main.bundle.js", compiler, stats))
    ).toMatchSnapshot("result");
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it('should not work with a value equal to "false"', async () => {
    const compiler = getCompiler("simple.js", { minimize: false });
    const stats = await compile(compiler);

    expect(getModuleSource("./simple.html", stats)).toMatchSnapshot("module");
    expect(
      execute(readAsset("main.bundle.js", compiler, stats))
    ).toMatchSnapshot("result");
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it('should work with a value equal to "true"', async () => {
    const compiler = getCompiler("simple.js", { minimize: true });
    const stats = await compile(compiler);

    expect(getModuleSource("./simple.html", stats)).toMatchSnapshot("module");
    expect(
      execute(readAsset("main.bundle.js", compiler, stats))
    ).toMatchSnapshot("result");
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it("should support options for minimizer", async () => {
    const compiler = getCompiler("simple.js", {
      minimize: {
        collapseWhitespace: true,
        conservativeCollapse: true,
        removeAttributeQuotes: true,
        keepClosingSlash: true,
        minifyJS: true,
        minifyCSS: true,
        removeScriptTypeAttributes: true,
        removeStyleLinkTypeAttributes: true,
        useShortDoctype: true,
        removeComments: false,
      },
    });
    const stats = await compile(compiler);

    expect(getModuleSource("./simple.html", stats)).toMatchSnapshot("module");
    expect(
      execute(readAsset("main.bundle.js", compiler, stats))
    ).toMatchSnapshot("result");
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it("should emit an error on broken HTML syntax", async () => {
    const compiler = getCompiler("broken-html-syntax.js", { minimize: true });
    const stats = await compile(compiler);

    expect(getModuleSource("./broken-html-syntax.html", stats)).toMatchSnapshot(
      "module"
    );
    expect(
      execute(readAsset("main.bundle.js", compiler, stats))
    ).toMatchSnapshot("result");
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it("should work with XHTML", async () => {
    const compiler = getCompiler("XHTML.js", { minimize: true });
    const stats = await compile(compiler);

    expect(getModuleSource("./XHTML.html", stats)).toMatchSnapshot("module");
    expect(
      execute(readAsset("main.bundle.js", compiler, stats))
    ).toMatchSnapshot("result");
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });
});
