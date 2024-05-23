import expect from 'expect';
import { sprintf } from 'sprintf-js';
import Input, {
  InputOptions,
  getHEXColor,
  getInput,
  getJobStatus,
  getKeyValuePairs,
  getMultilineInput,
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
  type TestCase = {
    value: string;
    expected: string | string[] | Error;
  };

  const testCases = (
    description: string,
    fn: Function,
    options: InputOptions | undefined,
    tests: TestCase[],
  ) => {
    describe(description, () => {
      tests.forEach(({ value, expected }: TestCase) => {
        const testDescription: string =
          value === '' ? 'missing' : `"${value.replace(/\n/gi, '\\n')}"`;
        describe(`when the provided value is ${testDescription}`, () => {
          it(`should ${expected instanceof Error ? 'throw an error' : 'return it'}`, () => {
            setInput(value, 'test');
            if (expected instanceof Error) {
              expect(() => fn('test', options)).toThrowError(expected.message);
            } else {
              expect(fn('test', options)).toStrictEqual(expected);
            }
          });
        });
      });
    });
  };

  describe('getInput()', () => {
    const errorInvalid: Error = new Error('Input is not valid: test');
    const defaultTests: { value: string; expected: string | Error }[] = [
      { value: '', expected: '' },
      { value: 'test', expected: errorInvalid },
    ];

    testCases('with default options', getInput, undefined, defaultTests);

    testCases('with `required: true` option', getInput, { required: true }, [
      {
        value: '',
        expected: new Error('Input required and not supplied: test'),
      },
      { value: 'test', expected: errorInvalid },
    ]);

    testCases(
      'with `required: false` option',
      getInput,
      { required: false },
      defaultTests,
    );

    testCases(
      'with `trimWhitespace: true` option',
      getInput,
      { trimWhitespace: true },
      defaultTests,
    );

    testCases(
      'with `trimWhitespace: false` option',
      getInput,
      { trimWhitespace: false },
      defaultTests,
    );

    testCases(
      'with custom `validateFn` option',
      getInput,
      {
        validateFn: (value: string) => {
          return value === 'valid';
        },
      },
      [...defaultTests, { value: 'valid', expected: 'valid' }],
    );

    testCases(
      'with custom `validateErrorMsg` option',
      getInput,
      {
        validateErrorMsg: 'Input is invalid: %s',
      },
      [
        { value: '', expected: '' },
        { value: 'test', expected: new Error('Input is invalid: test') },
      ],
    );
  });

  describe('getMultilineInput()', () => {
    const generalTests: TestCase[] = [
      { value: 'test', expected: ['test'] },
      { value: 'one\ntwo\nthree', expected: ['one', 'two', 'three'] },
    ];

    const defaultTests: TestCase[] = [
      { value: '', expected: [] },
      ...generalTests,
    ];

    testCases(
      'with default options',
      getMultilineInput,
      undefined,
      defaultTests,
    );

    testCases(
      'with `required: true` option',
      getMultilineInput,
      { required: true },
      [
        {
          value: '',
          expected: new Error('Input required and not supplied: test'),
        },
        { value: 'test', expected: ['test'] },
        { value: 'one\ntwo\nthree', expected: ['one', 'two', 'three'] },
      ],
    );

    testCases(
      'with `required: false` option',
      getMultilineInput,
      { required: false },
      defaultTests,
    );

    testCases(
      'with `trimWhitespace: true` option',
      getMultilineInput,
      { trimWhitespace: true },
      defaultTests,
    );

    testCases(
      'with `trimWhitespace: false` option',
      getMultilineInput,
      { trimWhitespace: false },
      defaultTests,
    );

    testCases(
      'with custom `validateFn` option',
      getMultilineInput,
      {
        validateFn: (value: string) => {
          return value !== 'error';
        },
      },
      [
        ...defaultTests,
        {
          value: 'one\nerror\nthree',
          expected: new Error('Input on line 2 is not valid: test'),
        },
      ],
    );

    testCases(
      'with custom `validateErrorMsg` option',
      getMultilineInput,
      {
        validateFn: (value: string) => {
          return value !== 'error';
        },
        validateErrorMsg: 'Input is invalid (line %d): %s',
      },
      [
        ...defaultTests,
        {
          value: 'one\nerror\nthree',
          expected: new Error('Input is invalid (line 2): test'),
        },
      ],
    );
  });

  describe('getHEXColor()', () => {
    testCases('with default options', getHEXColor, undefined, [
      { value: '', expected: '' },
      { value: 'test', expected: new Error('Input is not a HEX color: test') },
      { value: '#000000', expected: '#000000' },
      { value: '#FFFFFF', expected: '#FFFFFF' },
      { value: '#FF0000', expected: '#FF0000' },
      { value: '#00FF00', expected: '#00FF00' },
      { value: '#0000FF', expected: '#0000FF' },
    ]);
  });

  describe('getJobStatus()', () => {
    testCases('with default options', getJobStatus, undefined, [
      { value: '', expected: '' },
      {
        value: 'test',
        expected: new Error(
          'Input is not a job status (unknown|in-progress|success|failure|cancelled|skipped): test',
        ),
      },
      { value: 'cancelled', expected: 'cancelled' },
      { value: 'failure', expected: 'failure' },
      { value: 'in-progress', expected: 'in-progress' },
      { value: 'skipped', expected: 'skipped' },
      { value: 'success', expected: 'success' },
    ]);
  });

  describe('getTimestamp()', () => {
    testCases('with default options', getTimestamp, undefined, [
      { value: '', expected: '' },
      {
        value: 'test',
        expected: new Error('Input is not a UNIX timestamp: test'),
      },
      { value: '1672524000', expected: '1672524000' },
    ]);
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
