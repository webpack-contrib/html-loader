import loader from '../src';

describe("'root' option", () => {
  it('should not translate root-relative urls by default', () => {
    const result = loader.call(
      { mode: 'development' },
      'Text <img src="/image.png">'
    );

    expect(result).toMatchSnapshot();
  });

  it('should work', () => {
    const result = loader.call(
      {
        mode: 'development',
        query: '?root=/test',
      },
      'Text <img src="/image.png">'
    );

    expect(result).toMatchSnapshot();
  });
});
