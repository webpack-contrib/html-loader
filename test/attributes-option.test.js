import loader from '../src';

describe("'attributes' option", () => {
  it('should work by default', () => {
    const result = loader.call(
      { mode: 'development' },
      'Text <img src="image.png"><img src="~bootstrap-img"> Text <img src=""><img src="image.png">'
    );

    expect(result).toMatchSnapshot();
  });

  it('should work by default with ES module syntax', () => {
    const result = loader.call(
      {
        mode: 'development',
        query: {
          esModule: true,
        },
      },
      'Text <img src="image.png"><img src="~bootstrap-img"> Text <img src=""><img src="image.png">'
    );

    expect(result).toMatchSnapshot();
  });

  it('should work with a "string" notation', () => {
    const result = loader.call(
      {
        mode: 'development',
        query: '?attributes=script:src',
      },
      'Text <script src="script.js"><img src="image.png">'
    );

    expect(result).toMatchSnapshot();
  });

  it('should work with multiple a "string" notations', () => {
    const result = loader.call(
      {
        mode: 'development',
        query: '?attributes=script:src img:src',
      },
      'Text <script src="script.js"><img src="image.png">'
    );

    expect(result).toMatchSnapshot();
  });

  it('should work with an "array" notations', () => {
    const result = loader.call(
      {
        mode: 'development',
        query: '?attributes[]=img:src',
      },
      'Text <script src="script.js"><img src="image.png">'
    );

    expect(result).toMatchSnapshot();
  });

  it('should work with multiple an "array" notations', () => {
    const result = loader.call(
      {
        mode: 'development',
        query: '?attributes[]=script:src&attributes[]=img:src',
      },
      'Text <script src="script.js"><img src="image.png">'
    );

    expect(result).toMatchSnapshot();
  });

  it('should work with a custom attribute', () => {
    const result = loader.call(
      {
        mode: 'development',
        query: '?attributes[]=:custom-src',
      },
      'Text <custom-element custom-src="image1.png"><custom-img custom-src="image2.png"/></custom-element>'
    );

    expect(result).toMatchSnapshot();
  });

  it('should not handle attributes with a "boolean" notation equals "false"', () => {
    const result = loader.call(
      {
        mode: 'development',
        query: '?attributes=false',
      },
      'Text <script src="script.js"><img src="image.png">'
    );

    expect(result).toMatchSnapshot();
  });

  it('should handle attributes with a "boolean" notation equals "true"', () => {
    const result = loader.call(
      {
        mode: 'development',
        query: '?attributes=true',
      },
      'Text <script src="script.js"><img src="image.png">'
    );

    expect(result).toMatchSnapshot();
  });

  it('should ignore hash fragments in URLs', () => {
    const result = loader.call(
      { mode: 'development' },
      '<img src="icons.svg#hash">'
    );

    expect(result).toMatchSnapshot();
  });

  it('should ignore some anchor by default in attributes', () => {
    const result = loader.call(
      { mode: 'development' },
      '<a href="mailto:username@exampledomain.com"></a>'
    );

    expect(result).toMatchSnapshot();
  });
});
