import getUrl from '../../src/runtime/getUrl';

describe('getUrl', () => {
  it('should work', () => {
    expect(getUrl(true)).toMatchSnapshot();
    expect(getUrl(null)).toMatchSnapshot();
    // eslint-disable-next-line no-undefined
    expect(getUrl(undefined)).toMatchSnapshot();
    expect(getUrl('image.png')).toMatchSnapshot();
    expect(getUrl('image\timage.png')).toMatchSnapshot();
    expect(getUrl('image\nimage.png')).toMatchSnapshot();
    expect(getUrl('image\fimage.png')).toMatchSnapshot();
    expect(getUrl('image\rimage.png')).toMatchSnapshot();
    expect(getUrl('image image.png')).toMatchSnapshot();
    expect(getUrl('image"image.png')).toMatchSnapshot();
    expect(getUrl("image'image.png")).toMatchSnapshot();
    expect(getUrl('image=image.png')).toMatchSnapshot();
    expect(getUrl('image>image.png')).toMatchSnapshot();
    expect(getUrl('image<image.png')).toMatchSnapshot();
    expect(getUrl('image`image.png')).toMatchSnapshot();
    expect(getUrl('image.png', true)).toMatchSnapshot();
    expect(getUrl('image\timage.png', true)).toMatchSnapshot();
    expect(getUrl('image\nimage.png', true)).toMatchSnapshot();
    expect(getUrl('image\fimage.png', true)).toMatchSnapshot();
    expect(getUrl('image\rimage.png', true)).toMatchSnapshot();
    expect(getUrl('image image.png', true)).toMatchSnapshot();
    expect(getUrl('image"image.png', true)).toMatchSnapshot();
    expect(getUrl("image'image.png", true)).toMatchSnapshot();
    expect(getUrl('image=image.png', true)).toMatchSnapshot();
    expect(getUrl('image>image.png', true)).toMatchSnapshot();
    expect(getUrl('image<image.png', true)).toMatchSnapshot();
    expect(getUrl('image`image.png', true)).toMatchSnapshot();
    expect(
      getUrl({ default: 'image.png', __esModule: true })
    ).toMatchSnapshot();
  });
});
