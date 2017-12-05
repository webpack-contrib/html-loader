/* eslint-disable */
export function stats ({ compilation }) {
  return {
    compilation,
    loaders: {
      err: compilation.modules.map((module) => module.error)[0],
      src: compilation.modules.map((module) => module._source._value)[0],
      map: compilation.modules.map((module) => module._source._sourceMap)[0],
    },
    errors: compilation.errors,
    warnings: compilation.warnings
  };
}
