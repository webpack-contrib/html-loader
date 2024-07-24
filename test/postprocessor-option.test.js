import {
  compile,
  execute,
  getCompiler,
  getErrors,
  getModuleSource,
  getWarnings,
  readAsset,
} from "./helpers";

describe("'postprocess' option", () => {
  it('should work with the "postprocessor" option', async () => {
    const compiler = getCompiler("postprocessor.html", {
      postprocessor: (content, loaderContext) => {
        expect(typeof content).toBe("string");
        expect(loaderContext).toBeDefined();

        return content.replace(/<%=/g, '" +').replace(/%>/g, '+ "');
      },
    });
    const stats = await compile(compiler);

    expect(getModuleSource("./postprocessor.html", stats)).toMatchSnapshot(
      "module",
    );
    expect(
      execute(readAsset("main.bundle.js", compiler, stats)),
    ).toMatchSnapshot("result");
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it('should work with Async "postprocessor" Function option', async () => {
    const compiler = getCompiler("preprocessor.hbs", {
      postprocessor: async (content, loaderContext) => {
        await expect(typeof content).toBe("string");
        await expect(loaderContext).toBeDefined();

        return content.replace(/<%=/g, '" +').replace(/%>/g, '+ "');
      },
    });
    const stats = await compile(compiler);

    expect(getModuleSource("./preprocessor.hbs", stats)).toMatchSnapshot(
      "module",
    );
    expect(
      execute(readAsset("main.bundle.js", compiler, stats)),
    ).toMatchSnapshot("result");
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });
});
