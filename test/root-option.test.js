import loader from '../src';
import { GET_URL_CODE } from '../src/constants';

describe("'root' option", () => {
  it('should not translate root-relative urls by default', () => {
    const result = loader.call(
      { mode: 'development' },
      'Text <img src="/image.png">'
    );

    expect(result).toBe('module.exports = "Text <img src=\\"/image.png\\">";');
  });

  it('should work', () => {
    const result = loader.call(
      {
        mode: 'development',
        query: '?root=/test',
      },
      'Text <img src="/image.png">'
    );

    expect(result).toBe(
      `${GET_URL_CODE}module.exports = "Text <img src=\\"" + __url__(require("/test/image.png")) + "\\">";`
    );
  });
});
