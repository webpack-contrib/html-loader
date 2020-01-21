import loader from '../src';

describe('loader', () => {
  it('should not make bad things with templates', () => {
    const result = loader.call(
      { mode: 'development' },
      '<h3>#{number} {customer}</h3>\n<p>   {title}   </p>'
    );

    expect(result).toMatchSnapshot();
  });

  it('should preserve escaped quotes', () => {
    const result = loader.call(
      { mode: 'development' },
      '<script>{"json": "with \\"quotes\\" in value"}</script>'
    );

    expect(result).toMatchSnapshot();
  });
});
