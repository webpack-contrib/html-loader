import getUrl from '../../src/runtime/getUrl';

describe('getUrl', () => {
  it('should work', () => {
    expect(getUrl(true)).toMatchSnapshot();
    expect(getUrl(null)).toMatchSnapshot();
    // eslint-disable-next-line no-undefined
    expect(getUrl(undefined)).toMatchSnapshot();
    expect(getUrl('image.png')).toMatchSnapshot();
    expect(
      getUrl({ default: 'image.png', __esModule: true })
    ).toMatchSnapshot();
  });
});
