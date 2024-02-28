import Module from "module";
import path from "path";

const parentModule = module;

function replaceAbsolutePath(data) {
  return typeof data === "string"
    ? data.replace(/file:\/\/\/(\D:\/)?/gi, "replaced_file_protocol_/")
    : data;
}

export default (code) => {
  const resource = "test.js";
  const module = new Module(resource, parentModule);
  // eslint-disable-next-line no-underscore-dangle
  module.paths = Module._nodeModulePaths(
    path.resolve(__dirname, "../fixtures")
  );
  module.filename = resource;

  // eslint-disable-next-line no-underscore-dangle
  module._compile(
    `${code};module.exports = ___TEST___.default ?___TEST___.default : ___TEST___;`,
    resource
  );

  return replaceAbsolutePath(module.exports);
};
