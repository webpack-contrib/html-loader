import getUrl from "../../src/runtime/getUrl";

describe("getUrl", () => {
  it("should work", () => {
    expect(getUrl(true)).toMatchSnapshot();
    expect(getUrl(null)).toMatchSnapshot();
    // eslint-disable-next-line no-undefined
    expect(getUrl(undefined)).toMatchSnapshot();
    expect(getUrl("image.png")).toMatchSnapshot();
    expect(getUrl("image\timage.png")).toMatchSnapshot();
    expect(getUrl("image\nimage.png")).toMatchSnapshot();
    expect(getUrl("image\fimage.png")).toMatchSnapshot();
    expect(getUrl("image\rimage.png")).toMatchSnapshot();
    expect(getUrl("image image.png")).toMatchSnapshot();
    expect(getUrl('image"image.png')).toMatchSnapshot();
    expect(getUrl("image'image.png")).toMatchSnapshot();
    expect(getUrl("image=image.png")).toMatchSnapshot();
    expect(getUrl("image>image.png")).toMatchSnapshot();
    expect(getUrl("image<image.png")).toMatchSnapshot();
    expect(getUrl("image`image.png")).toMatchSnapshot();
    expect(getUrl("image.png", { maybeNeedQuotes: true })).toMatchSnapshot();
    expect(
      getUrl("image\timage.png", { maybeNeedQuotes: true }),
    ).toMatchSnapshot();
    expect(
      getUrl("image\nimage.png", { maybeNeedQuotes: true }),
    ).toMatchSnapshot();
    expect(
      getUrl("image\fimage.png", { maybeNeedQuotes: true }),
    ).toMatchSnapshot();
    expect(
      getUrl("image\rimage.png", { maybeNeedQuotes: true }),
    ).toMatchSnapshot();
    expect(
      getUrl("image image.png", { maybeNeedQuotes: true }),
    ).toMatchSnapshot();
    expect(
      getUrl('image"image.png', { maybeNeedQuotes: true }),
    ).toMatchSnapshot();
    expect(
      getUrl("image'image.png", { maybeNeedQuotes: true }),
    ).toMatchSnapshot();
    expect(
      getUrl("image=image.png", { maybeNeedQuotes: true }),
    ).toMatchSnapshot();
    expect(
      getUrl("image>image.png", { maybeNeedQuotes: true }),
    ).toMatchSnapshot();
    expect(
      getUrl("image<image.png", { maybeNeedQuotes: true }),
    ).toMatchSnapshot();
    expect(
      getUrl("image`image.png", { maybeNeedQuotes: true }),
    ).toMatchSnapshot();
  });
});
