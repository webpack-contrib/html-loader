/* eslint-disable */
import loader from "../src";

import webpack from './webpack';
import { stats } from './helpers';

describe("HTML Loader", () => {
  test('Should process HTML with defaults', () => {
    const config = {};

    return webpack('index.js', config)
      .then((result) => stats(result))
      .then(({ loader }) => {
        if (loader.err) throw new Error(loader.err)
        expect(loader.src).toMatchSnapshot()
      })
      .catch((err) => console.log(err))
  })

  // TODO refactor
  test("Should convert to requires", () => {
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


  test("Should not translate root-relative urls (wtest.skiphout root query)", () => {
    const result = loader.call({}, 'Text <img src="/image.png">')

    expect(result).toEqual(
      'export default "Text <img src=\\"/image.png\\">";'
    );
    expect(result).toMatchSnapshot();
  });

  test("Should ignore hash fragments in URLs", () => {
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
