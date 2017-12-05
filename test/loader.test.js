/* eslint-disable */
import loader from "../src";

import webpack from './webpack';
import { stats } from './helpers';

describe("HTML Loader", () => {
  test('Should process HTML with defaults', () => {
    const config = {};

    return webpack('index.js', config)
      .then((result) => stats(result))
      .then(({ loaders }) => {
        // if (loaders.err) throw new Error(loader.err)
        expect(loaders.src).toMatchSnapshot()
      })
      .catch((err) => err)
  })

  test('Should process HTML with options.root', () => {
    const config = {
      loader: {
        root: 'fixtures'
      }
    };

    return webpack('root.js', config)
      .then((result) => stats(result))
      .then(({ loaders }) => {
        // if (loaders.err) throw new Error(loader.err)
        expect(loaders.src).toMatchSnapshot()
      })
      .catch((err) => err)
  })

  test('Should process HTML with options.attrs', () => {
    const config = {
      loader: {
        attrs: [ 'div:data-attrs', ':custom-attrs' ]
      }
    };

    return webpack('attrs.js', config)
      .then((result) => stats(result))
      .then(({ loaders }) => {
        // if (loaders.err) throw new Error(loader.err)
        expect(loaders.src).toMatchSnapshot()
      })
      .catch((err) => err)
  })

  test('Should process HTML with options.interpolate {Boolean}', () => {
    const config = { loader: { interpolate: true } };

    return webpack('interpolate.js', config)
      .then((result) => stats(result))
      .then(({ loaders }) => {
        // if (loaders.err) throw new Error(loader.err)
        expect(loaders.src).toMatchSnapshot()
      })
      .catch((err) => console.log(err))
  })

  test('Should process HTML with options.interpolate {String}', () => {
    const config = {
      loader: {
        interpolate: 'require'
      }
    };

    return webpack('interpolate.js', config)
      .then((result) => stats(result))
      .then(({ loaders }) => {
        // if (loaders.err) throw new Error(loader.err)
        expect(loaders.src).toMatchSnapshot()
      })
      .catch((err) => err)
  })

  test('Should process HTML with options.minimize {Boolean}', () => {
    const config = { loader: { minimize: true } };

    return webpack('index.js', config)
      .then((result) => stats(result))
      .then(({ loaders }) => {
        // if (loaders.err) throw new Error(loader.err)
        expect(loaders.src).toMatchSnapshot()
      })
      .catch((err) => err)
  })

  test('Should process HTML with options.minimize {Object}', () => {
    const config = {
      loader: {
        minimize: {
          removeComments: false
        }
      }
    };

    return webpack('index.js', config)
      .then((result) => stats(result))
      .then(({ loaders }) => {
        // if (loaders.err) throw new Error(loader.err)
        expect(loaders.src).toMatchSnapshot()
      })
      .catch((err) => err)
  })

  // TODO refactor
  test.skip("Should convert to requires", () => {
    const html = 'Text <img src="image.png"><img src="~bootstrap-img"> Text';
    const result = loader.call({}, html);

    expect(result).toEqual(
      'export default "Text <img src=\\"" + require("./image.png") + "\\"><img src=\\"" + require("bootstrap-img") + "\\"> Text";'
    );
    expect(result).toMatchSnapshot();
  });

  // https://gtest.skiphub.com/webpack/webpack/issues/752
  test("Should not remove attributes by default", () => {
    const result = loader.call({ minimize: true }, '<input type="text" />')

    expect(result).toEqual(
      'export default "<input type=text />";'
    );
    expect(result).toMatchSnapshot();
  });


  test.skip("Should not translate root-relative urls (without root query)", () => {
    const result = loader.call({}, 'Text <img src="/image.png">')

    expect(result).toEqual(
      'export default "Text <img src=\\"/image.png\\">";'
    );
    expect(result).toMatchSnapshot();
  });

  test.skip("Should ignore hash fragments in URLs", () => {
    const result = loader.call({}, '<img src="icons.svg#hash">')

    expect(result).toEqual(
      'export default "<img src=\\"" + require("./icons.svg") + "#hash\\">";'
    );
    expect(result).toMatchSnapshot();
  });

  test("Should export as ES2015 Module", () => {
    const result = loader.call({ query: {} }, '<p>Hello world!</p>');

    expect(result).toEqual('export default "<p>Hello world!</p>";');
    expect(result).toMatchSnapshot();
  });
});
