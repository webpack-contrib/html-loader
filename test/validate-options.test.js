import { getCompiler, compile } from './helpers';

describe('validate options', () => {
  const tests = {
    attributes: {
      success: [
        true,
        false,
        {
          list: [
            {
              tag: 'img',
              attribute: 'src',
              type: 'src',
            },
          ],
        },
        {
          list: [
            {
              tag: 'img',
              attribute: 'src',
              type: 'src',
              filter: () => true,
            },
          ],
        },
        {
          list: [
            {
              tag: 'img',
              attribute: 'src',
              type: 'src',
            },
            {
              tag: 'img',
              attribute: 'srcset',
              type: 'srcset',
            },
          ],
        },
        { urlFilter: () => true },
        { root: '.' },
        {
          list: [
            {
              tag: 'img',
              attribute: 'src',
              type: 'src',
            },
            {
              tag: 'img',
              attribute: 'srcset',
              type: 'srcset',
            },
          ],
          urlFilter: () => true,
          root: '.',
        },
      ],
      failure: [
        'true',
        [],
        {
          list: [],
        },
        {
          list: [
            {
              tag: 'img',
              attribute: 'src',
            },
          ],
        },
        {
          list: [
            {
              tag: 'img',
              attribute: 'src',
              type: 'src',
            },
            {
              tag: 'img',
              attribute: 'src',
              type: 'src',
            },
          ],
        },
        {
          list: [
            {
              tag: 'img',
              attribute: 'src',
              type: 'src',
              filter: 'test',
            },
          ],
        },
        { urlFilter: false },
        { root: false },
        { unknown: true },
      ],
    },
    esModule: {
      success: [true, false],
      failure: ['true'],
    },
    unknown: {
      success: [],
      failure: [1, true, false, 'test', /test/, [], {}, { foo: 'bar' }],
    },
  };

  function stringifyValue(value) {
    if (
      Array.isArray(value) ||
      (value && typeof value === 'object' && value.constructor === Object)
    ) {
      return JSON.stringify(value);
    }

    return value;
  }

  async function createTestCase(key, value, type) {
    it(`should ${
      type === 'success' ? 'successfully validate' : 'throw an error on'
    } the "${key}" option with "${stringifyValue(value)}" value`, async () => {
      // For loaders
      const compiler = getCompiler('simple.js', { [key]: value });

      let stats;

      try {
        stats = await compile(compiler);
      } finally {
        if (type === 'success') {
          expect(stats.hasErrors()).toBe(false);
        } else if (type === 'failure') {
          const {
            compilation: { errors },
          } = stats;

          expect(errors).toHaveLength(1);
          expect(() => {
            throw new Error(errors[0].error.message);
          }).toThrowErrorMatchingSnapshot();
        }
      }
    });
  }

  for (const [key, values] of Object.entries(tests)) {
    for (const type of Object.keys(values)) {
      for (const value of values[type]) {
        createTestCase(key, value, type);
      }
    }
  }
});
