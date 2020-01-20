import loader from '../src';
import { GET_URL_CODE } from '../src/constants';

describe('loader', () => {
  it('should not make bad things with templates', () => {
    const result = loader.call(
      { mode: 'development' },
      '<h3>#{number} {customer}</h3>\n<p>   {title}   </p>'
    );

    expect(result).toBe(
      `${GET_URL_CODE}module.exports = "<h3>#{number} {customer}</h3>\\n<p>   {title}   </p>";`
    );
  });

  it('should preserve escaped quotes', () => {
    const result = loader.call(
      { mode: 'development' },
      '<script>{"json": "with \\"quotes\\" in value"}</script>'
    );

    expect(result).toBe(
      `${GET_URL_CODE}module.exports = "<script>{\\"json\\": \\"with \\\\\\"quotes\\\\\\" in value\\"}</script>";`
    );
  });
});
