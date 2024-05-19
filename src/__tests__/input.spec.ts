import expect from 'expect';
import { sprintf } from 'sprintf-js';
import Input, {
  InputOptions,
  getHEXColor,
  getJobStatus,
  getKeyValuePairs,
  getNonEmptyString,
  getTimestamp,
  getUnsignedInt,
} from '../input';
import { setInput } from './helpers';

const TEST_INPUT_INVALID_STRING = 'test';
const TEST_INPUT_NAME = 'test';

const expectInvalid = (fn: Function, value: string, errorMsg: string = '') => {
  setInput(value);
  expect(() => fn(TEST_INPUT_NAME)).toThrowError(
    sprintf(errorMsg, TEST_INPUT_NAME),
  );
};

const expectValid = (fn: Function, value: string, expected: any = '') => {
  setInput(value);
  expect(fn(TEST_INPUT_NAME)).toEqual(
    typeof expected === 'string' && expected.length === 0 ? value : expected,
  );
};

const testInvalid = (
  description: string,
  fn: Function,
  value: string,
  errorMsg: string,
) => {
  describe(`${description}`, () => {
    it('should throw an error', async () => {
      expectInvalid(fn, value, errorMsg);
    });
  });
};

const testInvalidEmptyString = (fn: Function, errorMsg: string) =>
  testInvalid('an empty string', fn, '', errorMsg);

const testInvalidString = (fn: Function, errorMsg: string) =>
  testInvalid('a string', fn, TEST_INPUT_INVALID_STRING, errorMsg);

const testValid = (
  description: string,
  fn: Function,
  values: string | Array<string>,
  expected: any = '',
) => {
  describe(`${description}`, () => {
    it('should return it', () => {
      const newValues: Array<string> = Array.isArray(values)
        ? values
        : [values];
      const newExpected: any = Array.isArray(expected)
        ? expected
        : newValues.map(() => expected);

      if (newValues.length !== newExpected.length) {
        throw new Error("values length doesn't match the expected length");
      }

      newValues.forEach((value: string, i: number) => {
        expectValid(fn, value, newExpected[i]);
      });
    });
  });
};

describe('input', () => {
  describe('getHEXColor()', () => {
    const testCases = (
      description: string,
      options: InputOptions | undefined,
      tests: { value: string; expected: string | Error }[],
    ) => {
      describe(description, () => {
        tests.forEach(({ value, expected }) => {
          const testDescription: string =
            value === '' ? 'is missing' : `is "${value}"`;
          describe(`when the provided value ${testDescription}`, () => {
            it(`should ${expected instanceof Error ? 'throw an error' : 'return it'}`, () => {
              setInput(value, 'test');
              if (expected instanceof Error) {
                expect(() => getHEXColor('test', options)).toThrowError(
                  expected.message,
                );
              } else {
                expect(getHEXColor('test', options)).toBe(expected);
              }
            });
          });
        });
      });
    };

    const errorCustom: Error = new Error('Input is invalid: test');
    const errorInvalid: Error = new Error('Input is not a HEX color: test');
    const errorMissing: Error = new Error(
      'Input required and not supplied: test',
    );

    const validColorsTests: { value: string; expected: string | Error }[] = [
      { value: '#000000', expected: '#000000' },
      { value: '#FFFFFF', expected: '#FFFFFF' },
      { value: '#FF0000', expected: '#FF0000' },
      { value: '#00FF00', expected: '#00FF00' },
      { value: '#0000FF', expected: '#0000FF' },
    ];

    const defaultTests: { value: string; expected: string | Error }[] = [
      { value: '', expected: '' },
      { value: 'test', expected: errorInvalid },
      ...validColorsTests,
    ];

    testCases('with default options', undefined, defaultTests);

    testCases('with `required: true` option', { required: true }, [
      { value: '', expected: errorMissing },
      { value: 'test', expected: errorInvalid },
      ...validColorsTests,
    ]);

    testCases(
      'with `required: false` option',
      { required: false },
      defaultTests,
    );

    testCases(
      'with `trimWhitespace: true` option',
      { trimWhitespace: true },
      defaultTests,
    );

    testCases(
      'with `trimWhitespace: false` option',
      { trimWhitespace: false },
      [
        { value: '', expected: '' },
        { value: 'test', expected: errorInvalid },
        ...validColorsTests,
      ],
    );

    testCases(
      'with custom `validateFn` option',
      {
        validateFn: () => {
          return false;
        },
      },
      [
        { value: '', expected: '' },
        { value: 'test', expected: errorInvalid },
        { value: '#000000', expected: errorInvalid },
        { value: '#FFFFFF', expected: errorInvalid },
        { value: '#FF0000', expected: errorInvalid },
        { value: '#00FF00', expected: errorInvalid },
        { value: '#0000FF', expected: errorInvalid },
      ],
    );

    testCases(
      'with custom `validateErrorMsg` option',
      {
        validateErrorMsg: 'Input is invalid: %s',
      },
      [
        { value: '', expected: '' },
        { value: 'test', expected: errorCustom },
        ...validColorsTests,
      ],
    );
  });

  describe('getJobStatus()', () => {
    describe('when the provided value is', () => {
      const errorMsg: string =
        'Invalid %s input value. Should an empty string or: unknown|in-progress|success|failure|cancelled|skipped';

      testInvalidString(getJobStatus, errorMsg);
      testValid('an empty string', getJobStatus, '');
      testValid('a job status', getJobStatus, [
        'cancelled',
        'failure',
        'in-progress',
        'skipped',
        'success',
      ]);
    });
  });

  describe('getKeyValuePairs()', () => {
    const expected = {
      one: 'One',
      two: 'Two',
      three: 'Three',
      four: 'Four',
    };

    describe('when the provided value is', () => {
      const errorMsg: string =
        'Invalid %s input value. Should be key value pair(s)';

      testInvalidEmptyString(getKeyValuePairs, errorMsg);
      testInvalidString(getKeyValuePairs, errorMsg);

      describe('a multiline string', () => {
        testInvalid(
          'with an invalid pair',
          getKeyValuePairs,
          'one=One\ntwo=Two\nthree\nfour=Four',
          errorMsg,
        );
        testValid(
          'with multiple key value pairs',
          getKeyValuePairs,
          ['one=One\ntwo=Two\nthree=Three\nfour=Four'],
          [expected],
        );
      });

      describe('a single-line string', () => {
        testInvalid(
          'with an invalid pair',
          getKeyValuePairs,
          'one=One,two=Two,three,four=Four',
          errorMsg,
        );
        testValid(
          'with a single key value pair',
          getKeyValuePairs,
          [`one=One`],
          [{ one: 'One' }],
        );
        testValid(
          'with multiple key value pairs separated by comma',
          getKeyValuePairs,
          ['one=One,two=Two,three=Three,four=Four'],
          [expected],
        );
      });
    });
  });

  describe('getNonEmptyString()', () => {
    describe('when the provided value is', () => {
      const errorMsg: string =
        "Invalid %s input value. Shouldn't be an empty string";

      testInvalidEmptyString(getNonEmptyString, errorMsg);
      testValid('a string', getNonEmptyString, 'test');
    });
  });

  describe('getTimestamp()', () => {
    const errorMsg: string =
      'Invalid %s input value. Should be an empty string or a UNIX timestamp';

    testInvalidString(getTimestamp, errorMsg);
    testValid(
      'a UNIX timestamp',
      getTimestamp,
      '1672524000',
      new Date(parseFloat('1672524000')).getTime().toString(),
    );
  });

  describe('getUnsignedInt()', () => {
    const errorMsg: string =
      'Invalid %s input value. Should be an unsigned integer';

    describe('when the provided value is', () => {
      testInvalidEmptyString(getUnsignedInt, errorMsg);

      describe('a negative number string', () => {
        it('should throw an error', async () => {
          expectInvalid(
            getUnsignedInt,
            '-1',
            'Invalid %s input value. Should be an unsigned integer',
          );
        });
      });

      testValid(
        'an unsigned integer',
        getUnsignedInt,
        ['0', '00', '9', '99', '999999999999999'],
        [0, 0, 9, 99, 999999999999999],
      );
    });
  });

  describe('get()', () => {
    describe('when no inputs are provided', () => {
      it('should reject with an error', async () => {
        const input = new Input();
        await expect(input.get()).rejects.toThrowError(
          `Input does not meet YAML 1.2 "Core Schema" specification: ignore-failures
Support boolean input list: \`true | True | TRUE | false | False | FALSE\``,
        );
      });
    });

    describe('when default inputs are provided', () => {
      beforeEach(() => {
        setInput('', 'color');
        setInput('{STATUS}\n{REF}', 'fields');
        setInput('false', 'ignore-failures');
        setInput('true', 'ignore-message-not-found');
        setInput('3000', 'port');
        setInput('3', 'port-retries');
        setInput('unknown', 'status');
        setInput(
          'GitHub Actions {GITHUB_JOB} job in {GITHUB_REF} by {GITHUB_ACTOR}',
          'text',
        );
        setInput('', 'timestamp');
      });

      it('should resolve with an object', async () => {
        const input = new Input();
        await expect(input.get()).resolves.toMatchObject({
          color: '',
          fields: ['{STATUS}', '{REF}'],
          ignoreFailures: false,
          ignoreMessageNotFound: true,
          port: 3000,
          portRetries: 3,
          status: 'unknown',
          text: 'GitHub Actions {GITHUB_JOB} job in {GITHUB_REF} by {GITHUB_ACTOR}',
          timestamp: '',
        });
      });
    });
  });
});
