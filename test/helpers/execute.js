import Module from "node:module";
import path from "node:path";

const parentModule = module;

function replaceAbsolutePath(data) {
  return typeof data === "string"
    ? data.replaceAll(/file:\/\/\/(\D:\/)?/gi, "replaced_file_protocol_/")
    : data;
}

export default (code) => {
  const resource = "test.js";
  const module = new Module(resource, parentModule);

  module.paths = Module._nodeModulePaths(
    path.resolve(__dirname, "../fixtures"),
  );
  module.filename = resource;

  module._compile(
    `${code};module.exports = ___TEST___.default ?___TEST___.default : ___TEST___;`,
    resource,
  );

  return replaceAbsolutePath(module.exports);
};
