import Handlebars from "handlebars";
import posthtml from "posthtml";
import posthtmlWebp from "posthtml-webp";

import {
  compile,
  execute,
  getCompiler,
  getErrors,
  getModuleSource,
  getWarnings,
  readAsset,
} from "./helpers";

describe("'process' option", () => {
  it('should work with the "preprocessor" option', async () => {
    const compiler = getCompiler("preprocessor.hbs", {
      preprocessor: (content, loaderContext) => {
        expect(typeof content).toBe("string");
        expect(loaderContext).toBeDefined();

        let result;

        try {
          result = Handlebars.compile(content)({
            firstname: "Alexander",
            lastname: "Krasnoyarov",
          });
        } catch (error) {
          loaderContext.emitError(error);

          return content;
        }

        return result;
      },
    });
    const stats = await compile(compiler);

    expect(getModuleSource("./preprocessor.hbs", stats)).toMatchSnapshot(
      "module"
    );
    expect(
      execute(readAsset("main.bundle.js", compiler, stats))
    ).toMatchSnapshot("result");
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it('should work with Async "preprocessor" Function option', async () => {
    const compiler = getCompiler("preprocessor.hbs", {
      preprocessor: async (content, loaderContext) => {
        await expect(typeof content).toBe("string");
        await expect(loaderContext).toBeDefined();

        let result;

        try {
          result = await Handlebars.compile(content)({
            firstname: "Alexander",
            lastname: "Krasnoyarov",
          });
        } catch (error) {
          await loaderContext.emitError(error);

          return content;
        }

        return result;
      },
    });
    const stats = await compile(compiler);

    expect(getModuleSource("./preprocessor.hbs", stats)).toMatchSnapshot(
      "module"
    );
    expect(
      execute(readAsset("main.bundle.js", compiler, stats))
    ).toMatchSnapshot("result");
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it('should work with the "preprocessor" option #2', async () => {
    const plugin = posthtmlWebp();
    const compiler = getCompiler("posthtml.html", {
      preprocessor: (content, loaderContext) => {
        expect(typeof content).toBe("string");
        expect(loaderContext).toBeDefined();

        let result;

        try {
          result = posthtml().use(plugin).process(content, { sync: true });
        } catch (error) {
          loaderContext.emitError(error);

          return content;
        }

        return result.html;
      },
    });
    const stats = await compile(compiler);

    expect(getModuleSource("./posthtml.html", stats)).toMatchSnapshot("module");
    expect(
      execute(readAsset("main.bundle.js", compiler, stats))
    ).toMatchSnapshot("result");
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });
  it('should work with the Async "preprocessor" Function option #2', async () => {
    const plugin = posthtmlWebp();
    const compiler = getCompiler("posthtml.html", {
      preprocessor: async (content, loaderContext) => {
        await expect(typeof content).toBe("string");
        await expect(loaderContext).toBeDefined();

        let result;

        try {
          result = await posthtml()
            .use(plugin)
            .process(content, { sync: true });
        } catch (error) {
          loaderContext.emitError(error);

          return content;
        }

        return result.html;
      },
    });
    const stats = await compile(compiler);

    expect(getModuleSource("./posthtml.html", stats)).toMatchSnapshot("module");
    expect(
      execute(readAsset("main.bundle.js", compiler, stats))
    ).toMatchSnapshot("result");
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });
});
