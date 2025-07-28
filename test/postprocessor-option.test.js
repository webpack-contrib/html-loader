import path from "node:path";

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

        const isTemplateLiteralSupported = content[0] === "`";

        return content
          .replaceAll("<%=", isTemplateLiteralSupported ? "${" : '" +')
          .replaceAll("%>", isTemplateLiteralSupported ? "}" : '+ "');
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

  it('should work with the "postprocessor" option #1', async () => {
    const compiler = getCompiler(
      "postprocessor.html",
      {
        postprocessor: (content, loaderContext) => {
          expect(typeof content).toBe("string");
          expect(loaderContext).toBeDefined();

          const isTemplateLiteralSupported = content[0] === "`";

          return content
            .replaceAll("<%=", isTemplateLiteralSupported ? "${" : '" +')
            .replaceAll("%>", isTemplateLiteralSupported ? "}" : '+ "');
        },
      },
      {
        output: {
          path: path.resolve(__dirname, "./outputs"),
          filename: "[name].bundle.js",
          chunkFilename: "[name].chunk.js",
          chunkLoading: "require",
          publicPath: "/webpack/public/path/",
          library: "___TEST___",
          assetModuleFilename: "[name][ext]",
          hashFunction: "xxhash64",
          environment: { templateLiteral: false },
        },
      },
    );
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

  it('should work with async "postprocessor" function option', async () => {
    const compiler = getCompiler("preprocessor.hbs", {
      postprocessor: async (content, loaderContext) => {
        await expect(typeof content).toBe("string");
        await expect(loaderContext).toBeDefined();

        const isTemplateLiteralSupported = content[0] === "`";

        return content
          .replaceAll("<%=", isTemplateLiteralSupported ? "${" : '" +')
          .replaceAll("%>", isTemplateLiteralSupported ? "}" : '+ "');
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
