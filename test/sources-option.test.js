import path from "path";

import {
  compile,
  execute,
  getCompiler,
  getErrors,
  getModuleSource,
  getWarnings,
  readAsset,
} from "./helpers";

describe("'sources' option", () => {
  it("should work by default", async () => {
    const compiler = getCompiler("simple.js");
    const stats = await compile(compiler);

    expect(getModuleSource("./simple.html", stats)).toMatchSnapshot("module");
    expect(
      execute(readAsset("main.bundle.js", compiler, stats))
    ).toMatchSnapshot("result");
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it('should handle "sources" tags', async () => {
    const compiler = getCompiler("sources.js");
    const stats = await compile(compiler);

    expect(getModuleSource("./sources.html", stats)).toMatchSnapshot("module");
    expect(
      execute(readAsset("main.bundle.js", compiler, stats))
    ).toMatchSnapshot("result");
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it("should work prefer source with tag over without", async () => {
    const compiler = getCompiler("simple.js", {
      sources: {
        list: [
          {
            tag: "img",
            attribute: "src",
            type: "src",
            filter: () => false,
          },
          {
            attribute: "src",
            type: "src",
          },
        ],
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

  it('should work with "..." syntax', async () => {
    const compiler = getCompiler("simple.js", {
      sources: {
        list: [
          "...",
          {
            tag: "flag-icon",
            attribute: "src",
            type: "src",
          },
        ],
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

  it("should allow to add more attributes to default values", async () => {
    const compiler = getCompiler("simple.js", {
      sources: {
        list: [
          "...",
          {
            tag: "img",
            attribute: "data-src",
            type: "src",
          },
          {
            tag: "img",
            attribute: "data-srcset",
            type: "srcset",
          },
        ],
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

  it('should work and override the "img" tag logic with "..."', async () => {
    const compiler = getCompiler("simple.js", {
      sources: {
        list: [
          "...",
          {
            tag: "img",
            attribute: "src",
            type: "src",
            filter: () => false,
          },
        ],
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

  it("should process attributes specific to a tag and attributes for any tag", async () => {
    const compiler = getCompiler("simple.js", {
      sources: {
        list: [
          "...",
          {
            attribute: "data-src",
            type: "src",
          },
        ],
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

  it('should handle "webpack-import" and `webpack-partial` tags', async () => {
    const compiler = getCompiler("webpack-import.js");
    const stats = await compile(compiler);

    expect(getModuleSource("./webpack-import.html", stats)).toMatchSnapshot(
      "module"
    );
    expect(
      execute(readAsset("main.bundle.js", compiler, stats))
    ).toMatchSnapshot("result");
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it('should not handle sources with a "boolean" notation equals "false"', async () => {
    const compiler = getCompiler("simple.js", { sources: false });
    const stats = await compile(compiler);

    expect(getModuleSource("./simple.html", stats)).toMatchSnapshot("module");
    expect(
      execute(readAsset("main.bundle.js", compiler, stats))
    ).toMatchSnapshot("result");
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it('should handle sources with a "boolean" notation equals "true"', async () => {
    const compiler = getCompiler("simple.js", { sources: true });
    const stats = await compile(compiler);

    expect(getModuleSource("./simple.html", stats)).toMatchSnapshot("module");
    expect(
      execute(readAsset("main.bundle.js", compiler, stats))
    ).toMatchSnapshot("result");
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it('should work with an empty "object" notations', async () => {
    const compiler = getCompiler("simple.js", {
      sources: {},
    });
    const stats = await compile(compiler);

    expect(getModuleSource("./simple.html", stats)).toMatchSnapshot("module");
    expect(
      execute(readAsset("main.bundle.js", compiler, stats))
    ).toMatchSnapshot("result");
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it('should work with an "object" notations', async () => {
    const compiler = getCompiler("simple.js", {
      sources: {
        list: [
          {
            tag: "img",
            attribute: "src",
            type: "src",
          },
          {
            tag: "img",
            attribute: "data-src",
            type: "src",
          },
          {
            tag: "img",
            attribute: "data-srcset",
            type: "srcset",
          },
          {
            tag: "source",
            attribute: "src",
            type: "src",
          },
          {
            tag: "source",
            attribute: "srcset",
            type: "srcset",
          },
          {
            tag: "flag-icon",
            attribute: "src",
            type: "src",
          },
          {
            tag: "MyStrangeTag13",
            attribute: "src",
            type: "src",
          },
          {
            tag: "a-",
            attribute: "src",
            type: "src",
          },
          {
            tag: "a-.",
            attribute: "src",
            type: "src",
          },
          {
            tag: "a--",
            attribute: "src",
            type: "src",
          },
          {
            tag: "aÀ-豈",
            attribute: "src",
            type: "src",
          },
          {
            tag: "aÀ-Ⰰ",
            attribute: "src",
            type: "src",
          },
          {
            tag: "INVALID_TAG_NAME",
            attribute: "src",
            type: "src",
          },
          {
            tag: "invalid-CUSTOM-TAG",
            attribute: "src",
            type: "src",
          },
        ],
        urlFilter: (attribute, value, resourcePath) => {
          expect(typeof attribute).toBe("string");
          expect(typeof value).toBe("string");
          expect(typeof resourcePath).toBe("string");

          if (value.includes("example")) {
            return false;
          }

          return true;
        },
        scriptingEnabled: false,
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

  it("should handle all src sources in all HTML tags when tag is undefined", async () => {
    const compiler = getCompiler("simple.js", {
      sources: {
        list: [
          {
            attribute: "src",
            type: "src",
          },
        ],
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

  it("should handle all src sources in all HTML tags except img tag (testing filter option)", async () => {
    const compiler = getCompiler("simple.js", {
      sources: {
        list: [
          {
            attribute: "src",
            type: "src",
            // eslint-disable-next-line no-unused-vars
            filter: (tag, attribute, sources) => tag.toLowerCase() !== "img",
          },
        ],
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

  it("should work and supports `resolve.roots`", async () => {
    const compiler = getCompiler(
      "resolve-roots.js",
      {},
      {
        resolve: {
          roots: [path.resolve(__dirname, "fixtures/nested/")],
        },
      }
    );
    const stats = await compile(compiler);

    expect(getModuleSource("./resolve-roots.html", stats)).toMatchSnapshot(
      "module"
    );
    expect(
      execute(readAsset("main.bundle.js", compiler, stats))
    ).toMatchSnapshot("result");
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it("should work by default with CommonJS module syntax", async () => {
    const compiler = getCompiler(
      "simple.js",
      {},
      {
        module: {
          rules: [
            {
              test: /\.html$/i,
              rules: [
                {
                  loader: path.resolve(__dirname, "../src"),
                  options: { esModule: false },
                },
              ],
            },
            {
              resourceQuery: /\?url$/,
              type: "asset/inline",
            },
            {
              test: /\.(png|jpg|gif|svg|ico|eot|ttf|woff|woff2|ogg|pdf|vtt|webp|xml|webmanifest|mp3|mp4|css)$/i,
              resourceQuery: /^(?!.*\?url).*$/,
              type: "asset/resource",
            },
          ],
        },
      }
    );
    const stats = await compile(compiler);

    expect(getModuleSource("./simple.html", stats)).toMatchSnapshot("module");
    expect(
      execute(readAsset("main.bundle.js", compiler, stats))
    ).toMatchSnapshot("result");
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it("should work by default with ES module syntax", async () => {
    const compiler = getCompiler(
      "simple.js",
      {},
      {
        module: {
          rules: [
            {
              test: /\.html$/i,
              rules: [
                {
                  loader: path.resolve(__dirname, "../src"),
                  options: { esModule: true },
                },
              ],
            },
            {
              resourceQuery: /\?url$/,
              type: "asset/inline",
            },
            {
              test: /\.(png|jpg|gif|svg|ico|eot|ttf|woff|woff2|ogg|pdf|vtt|webp|xml|webmanifest|mp3|mp4|css)$/i,
              resourceQuery: /^(?!.*\?url).*$/,
              type: "asset/resource",
            },
          ],
        },
      }
    );
    const stats = await compile(compiler);

    expect(getModuleSource("./simple.html", stats)).toMatchSnapshot("module");
    expect(
      execute(readAsset("main.bundle.js", compiler, stats))
    ).toMatchSnapshot("result");
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it("should work by default with ES module syntax from CommonJS module syntax from other loader", async () => {
    const compiler = getCompiler(
      "simple.js",
      {},
      {
        module: {
          rules: [
            {
              test: /\.html$/i,
              rules: [
                {
                  loader: path.resolve(__dirname, "../src"),
                  options: { esModule: true },
                },
              ],
            },
            {
              resourceQuery: /\?url$/,
              type: "asset/inline",
            },
            {
              test: /\.(png|jpg|gif|svg|ico|eot|ttf|woff|woff2|ogg|pdf|vtt|webp|xml|webmanifest|mp3|mp4|css)$/i,
              resourceQuery: /^(?!.*\?url).*$/,
              type: "asset/resource",
            },
          ],
        },
      }
    );
    const stats = await compile(compiler);

    expect(getModuleSource("./simple.html", stats)).toMatchSnapshot("module");
    expect(
      execute(readAsset("main.bundle.js", compiler, stats))
    ).toMatchSnapshot("result");
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it("should work by default with CommonJS module syntax and ES module syntax from other loader", async () => {
    const compiler = getCompiler(
      "simple.js",
      {},
      {
        module: {
          rules: [
            {
              test: /\.html$/i,
              rules: [
                {
                  loader: path.resolve(__dirname, "../src"),
                  options: { esModule: false },
                },
              ],
            },
            {
              resourceQuery: /\?url$/,
              type: "asset/inline",
            },
            {
              test: /\.(png|jpg|gif|svg|ico|eot|ttf|woff|woff2|ogg|pdf|vtt|webp|xml|webmanifest|mp3|mp4|css)$/i,
              resourceQuery: /^(?!.*\?url).*$/,
              type: "asset/resource",
            },
          ],
        },
      }
    );
    const stats = await compile(compiler);

    expect(getModuleSource("./simple.html", stats)).toMatchSnapshot("module");
    expect(
      execute(readAsset("main.bundle.js", compiler, stats))
    ).toMatchSnapshot("result");
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });
});
