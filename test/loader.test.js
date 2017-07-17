/* eslint-disable */
import loader from "../src";

import webpack from './webpack';
import { stats } from './helpers';

describe("HTML Loader", () => {
	test('- Should process HTML with defaults', () => {
		const config = {};

		webpack('index.js', config)
		  .then((result) => stats(result))
			.then(({ loader }) => {
				console.log(loader);

				expect(loaders.src).toMatchSnapshot();

				// loader.src.forEach((src, i) => {
				// 	expect(src).toMatchSnapshot(`Source ${i}`)
				// })
			})
			.catch((err) => console.log(err))
	})

	// TODO refactor
	test.skip("should convert to requires", () => {
		loader.call({}, 'Text <img src="image.png"><img src="~bootstrap-img"> Text').toEqual(
			'module.exports = "Text <img src=\\"" + require("./image.png") + "\\"><img src=\\"" + require("bootstrap-img") + "\\"> Text";'
		);
	});

	test.skip("should accept attrs from query", () => {
		loader.call({
			query: "?attrs=script:src"
		}, 'Text <script src="script.js"><img src="image.png">').toEqual(
			'module.exports = "Text <script src=\\"" + require("./script.js") + "\\"><img src=\\"image.png\\">";'
		);
	});

	test.skip("should accept attrs from query (space separated)", () => {
		loader.call({
			query: "?attrs=script:src img:src"
		}, 'Text <script src="script.js"><img src="image.png">').toEqual(
			'module.exports = "Text <script src=\\"" + require("./script.js") + "\\"><img src=\\"" + require("./image.png") + "\\">";'
		);
	});

	test.skip("should accept attrs from query (multiple)", () => {
		loader.call({
			query: "?attrs[]=script:src&attrs[]=img:src"
		}, 'Text <script src="script.js"><img src="image.png">').toEqual(
			'module.exports = "Text <script src=\\"" + require("./script.js") + "\\"><img src=\\"" + require("./image.png") + "\\">";'
		);
	});

	test.skip("should not make bad things wtest.skiph templates", () => {
		loader.call({}, '<h3>#{number} {customer}</h3>\n<p>   {ttest.skiple}   </p>').toEqual(
			'module.exports = "<h3>#{number} {customer}</h3>\\n<p>   {ttest.skiple}   </p>";'
		);
	});

	test.skip("should minimize", () => {
		loader.call({
			minimize: true
		}, '<!-- comment --><h3 customAttr="">#{number} {customer}</h3>\n<p>   {ttest.skiple}   </p>\n\t <!-- comment --> <img src="image.png" />').toEqual(
			'module.exports = "<h3 customattr=\\"\\">#{number} {customer}</h3> <p> {ttest.skiple} </p> <img src=\" + require("./image.png") + \" />";'
		);
	});

	// https://gtest.skiphub.com/webpack/webpack/issues/752
	test.skip("should not remove attributes by default", () => {
		loader.call({
			minimize: true
		}, '<input type="text" />').toEqual(
			'module.exports = "<input type=text />";'
		);
	});

	test.skip("should preserve comments", () => {
		loader.call({
			minimize: true,
			query: "?-removeComments"
		}, '<!-- comment --><h3 customAttr="">#{number} {customer}</h3><p>{ttest.skiple}</p><!-- comment --><img src="image.png" />').toEqual(
			'module.exports = "<!-- comment --><h3 customattr=\\"\\">#{number} {customer}</h3><p>{ttest.skiple}</p><!-- comment --><img src=\" + require("./image.png") + \" />";'
		);
	});

	test.skip("should preserve comments and whtest.skipe spaces when minimizing (via webpack config property)", () => {
		loader.call({
			minimize: true,
			options: {
				htmlLoader: {
					removeComments: false,
					collapseWhitespace: false
				}
			}
		}, '<!-- comment --><h3 customAttr="">#{number} {customer}</h3><p>{ttest.skiple}</p>    <!-- comment -->    <img src="image.png" />').toEqual(
			'module.exports = "<!-- comment --><h3 customattr=\\"\\">#{number} {customer}</h3><p>{ttest.skiple}</p>    <!-- comment -->    <img src=\" + require("./image.png") + \" />";'
		);
	});

	test.skip("should preserve comments and whtest.skipe spaces when minizing (via webpack config property)", () => {
		loader.call({
			options: {
				htmlLoader: {
					minimize: true,
					removeComments: false,
					collapseWhitespace: false
				}
			}
		}, '<!-- comment --><h3 customAttr="">#{number} {customer}</h3><p>{ttest.skiple}</p>    <!-- comment -->    <img src="image.png" />').toEqual(
			'module.exports = "<!-- comment --><h3 customattr=\\"\\">#{number} {customer}</h3><p>{ttest.skiple}</p>    <!-- comment -->    <img src=\" + require("./image.png") + \" />";'
		);
	});

	test.skip("should treat attributes as case senstest.skipive", () => {
		loader.call({
			minimize: true,
			query: "?caseSenstest.skipive"
		}, '<!-- comment --><h3 customAttr="">#{number} {customer}</h3><p>{ttest.skiple}</p><!-- comment --><img src="image.png" />').toEqual(
			'module.exports = "<h3 customAttr=\\"\\">#{number} {customer}</h3><p>{ttest.skiple}</p><img src=\" + require("./image.png") + \" />";'
		);
	});

	test.skip("should accept complex options via a webpack config property", () => {
		loader.call({
			minimize: true,
			options: {
				htmlLoader: {
					ignoreCustomFragments: [/\{\{.*?}}/]
				}
			}
		}, '<h3>{{ count <= 1 ? "foo" : "bar" }}</h3>').toEqual(
			'module.exports = "<h3>{{ count <= 1 ? \\"foo\\" : \\"bar\\" }}</h3>";'
		);
	});

	test.skip("should allow the webpack config property name to be configured", () => {
		loader.call({
			minimize: true,
			options: {
				htmlLoaderSuperSpecialConfig: {
					ignoreCustomFragments: [/\{\{.*?}}/]
				}
			},
			query: '?config=htmlLoaderSuperSpecialConfig'
		}, '<h3>{{ count <= 1 ? "foo" : "bar" }}</h3>').toEqual(
			'module.exports = "<h3>{{ count <= 1 ? \\"foo\\" : \\"bar\\" }}</h3>";'
		);
	});

	test.skip("should not translate root-relative urls (wtest.skiphout root query)", () => {
		loader.call({}, 'Text <img src="/image.png">').toEqual(
			'module.exports = "Text <img src=\\"/image.png\\">";'
		);
	});

	test.skip("should accept root from query", () => {
		loader.call({
			query: "?root=/test"
		}, 'Text <img src="/image.png">').toEqual(
			'module.exports = "Text <img src=\\"" + require("/test/image.png") + "\\">";'
		);
	});

	test.skip("should ignore hash fragments in URLs", () => {
		loader.call({}, '<img src="icons.svg#hash">').toEqual(
			'module.exports = "<img src=\\"" + require("./icons.svg") + "#hash\\">";'
		);
	});

	test.skip("should ignore interpolations by default", () => {
		loader.call({}, '<img src="${"Hello " + (1+1)}">').toEqual(
			'module.exports = "<img src=\\"${\\"Hello \\" + (1+1)}\\">";'
		);
	});

	test.skip("should enable interpolations when using interpolate flag", () => {
		loader.call({
			query: "?interpolate"
		}, '<img src="${"Hello " + (1+1)}">').toEqual(
			'module.exports = "<img src=\\"" + ("Hello " + (1 + 1)) + "\\">";'
		);
	});

	test.skip("should enable interpolations when using interpolate=require flag and only require  t =>o be translate", () => {
		loader.call({
			query: "?interpolate=require"
		}, '<a href="${list.href}"><img src="${require("./test.jpg")}" /></a>').toEqual(
			'module.exports = "<a href=\\"${list.href}\\"><img src=\\"" + require("./test.jpg") + "\\" /></a>";'
		);
	});

	test("- Should export as ES2015 Module", () => {
		const result = loader.call({ query: {} }, '<p>Hello world!</p>');

		expect(result).toEqual('export default "<p>Hello world!</p>";');
		expect(result).toMatchSnapshot()
	});
});
