/* eslint-disable
  quotes,
  comma-dangle,
  no-useless-escape,
  no-template-curly-in-string,
*/
import loader from '../src';

describe('Options', () => {
  describe('Root', () => {
    test("Should accept root from query", () => {
      const html = 'Text <img src="/image.png">';
      const result = loader.call({ query: "?root=/test" }, html);

      expect(result).toEqual(
        'export default "Text <img src=\\"" + require("/test/image.png") + "\\">";'
      );
    });
  });

  describe('Atrributes', () => {
    test("Should accept attrs from query (space separated)", () => {
      const html = 'Text <script src="script.js"><img src="image.png">';
      const result = loader.call({ query: "?attrs=script:src img:src" }, html);

      expect(result).toEqual(
        'export default "Text <script src=\\"" + require("./script.js") + "\\"><img src=\\"" + require("./image.png") + "\\">";'
      );
    });

    test("Should accept attrs from query (multiple)", () => {
      const html = 'Text <script src="script.js"><img src="image.png">';
      const result = loader.call({ query: "?attrs[]=script:src&attrs[]=img:src" }, html);

      expect(result).toEqual(
        'export default "Text <script src=\\"" + require("./script.js") + "\\"><img src=\\"" + require("./image.png") + "\\">";'
      );
    });

    test("Should not make bad things wtest.skiph templates", () => {
      const html = '<h3>#{number} {customer}</h3>\n<p>   {ttest.skiple}   </p>';
      const result = loader.call({}, html);

      expect(result).toEqual(
        'export default "<h3>#{number} {customer}</h3>\\n<p>   {ttest.skiple}   </p>";'
      );
    });
  });

  describe('Interpolate', () => {
    test("Should ignore interpolations by default", () => {
      const result = loader.call({}, '<img src="${"Hello " + (1+1)}">');

      expect(result).toEqual(
        'export default "<img src=\\"${\\"Hello \\" + (1+1)}\\">";'
      );
    });

    test("Should enable interpolations when using interpolate flag", () => {
      const html = '<img src="${"Hello " + (1+1)}">';
      const result = loader.call({ query: "?interpolate" }, html);

      expect(result).toEqual(
        'export default "<img src=\\"" + ("Hello " + (1 + 1)) + "\\">";'
      );
    });

    test("Should enable interpolations when using interpolate=require flag and only require  t =>o be translate", () => {
      const html = '<a href="${list.href}"><img src="${require("./test.jpg")}" /></a>';
      const result = loader.call({ query: "?interpolate=require" }, html);

      expect(result).toEqual(
        'export default "<a href=\\"${list.href}\\"><img src=\\"" + require("./test.jpg") + "\\" /></a>";'
      );
    });
  });

  describe('Minimize', () => {
    test("Should minimize", () => {
      const html = '<!-- comment --><h3 customAttr="">#{number} {customer}</h3>\n<p>   {ttest.skiple}   </p>\n\t <!-- comment --> <img src="image.png" />';
      const result = loader.call({ minimize: true }, html);

      expect(result).toEqual(
        'export default "<h3 customattr=\\"\\">#{number} {customer}</h3> <p> {ttest.skiple} </p> <img src=\" + require("./image.png") + \" />";'
      );

      test.skip("should preserve comments", () => {
        loader.call({
          minimize: true,
          query: "?-removeComments"
        }, '<!-- comment --><h3 customAttr="">#{number} {customer}</h3><p>{ttest.skiple}</p><!-- comment --><img src="image.png" />').toEqual(
          'module.exports = "<!-- comment --><h3 customattr=\\"\\">#{number} {customer}</h3><p>{ttest.skiple}</p><!-- comment --><img src=\" + require("./image.png") + \" />";'
        );
      });


      test.skip("should treat attributes as case sensetive", () => {
        loader.call({
          minimize: true,
          query: "?caseSenstest.skipive"
        }, '<!-- comment --><h3 customAttr="">#{number} {customer}</h3><p>{ttest.skiple}</p><!-- comment --><img src="image.png" />').toEqual(
          'module.exports = "<h3 customAttr=\\"\\">#{number} {customer}</h3><p>{ttest.skiple}</p><img src=\" + require("./image.png") + \" />";'
        );
      });
    });
  });
});
