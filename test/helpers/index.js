/* eslint-disable */
export function stats ({ compilation }) {
  console.log(compilation);
  return {
    compilation,
    // assets: Object.keys(compilation.assets).map((asset) => {
    //   if (/map/.test(asset)) return asset;
    //   return compilation.assets[asset].sourceAndMap();
    // }),
    loader: {
      // err: compilation.modules.errors,
      src: compilation.modules.map((module) => module._source._value),
      // map: compilation.modules.map((module) => module._source._sourceMap),
      // meta: compilation.modules.map((module) => module.meta)
    },
    // errors: compilation.errors,
    // warnings: compilation.warnings
  };
}
