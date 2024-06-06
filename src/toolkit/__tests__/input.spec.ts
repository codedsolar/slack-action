import expect from 'expect';
import {
  InputIntOptions,
  InputOptions,
  getHEXColor,
  getInput,
  getInt,
  getJobStatus,
  getMultilineInput,
  getTimestamp,
} from '../input';

const setInput = (value: string, name: string = 'test') => {
  process.env[`INPUT_${name.toUpperCase()}`] = value;
};

describe('input', () => {
  type TestCase = {
    value: string;
    expected: string | string[] | number | Error;
  };

  const testCases = (
    description: string,
    fn: Function,
    options: InputOptions | InputIntOptions | undefined,
    tests: TestCase[],
  ) => {
    describe(description, () => {
      tests.forEach(({ value, expected }: TestCase) => {
        let testDescription: string = '';
        switch (typeof value) {
          case 'number':
            testDescription = `\`${value}\``;
            break;
          case 'string':
            testDescription =
              value === '' ? 'missing' : `"${value.replace(/\n/gi, '\\n')}"`;
            break;
          default:
            testDescription = '';
            break;
        }

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
    const defaultTests: TestCase[] = [
      { value: '', expected: '' },
      { value: 'test', expected: 'test' },
    ];

    testCases('with default options', getInput, undefined, defaultTests);

    testCases('with `required: true` option', getInput, { required: true }, [
      {
        value: '',
        expected: new Error('Input required and not supplied: test'),
      },
      { value: 'test', expected: 'test' },
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
          return value !== 'valid';
        },
      },
      [...defaultTests, { value: 'valid', expected: errorInvalid }],
    );

    testCases(
      'with custom `validateErrorMsg` option',
      getInput,
      {
        validateFn: (value: string) => {
          return value !== 'valid';
        },
        validateErrorMsg: 'Input is invalid: %s',
      },
      [
        ...defaultTests,
        { value: 'valid', expected: new Error('Input is invalid: test') },
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

  describe('getInt()', () => {
    let error: Error;

    const errorInvalid: Error = new Error('Input is not an integer: test');
    const errorUnsigned: Error = new Error(
      'Input is not an unsigned integer: test',
    );

    const unsignedTests: TestCase[] = [
      { value: '-11', expected: errorUnsigned },
      { value: '-10', expected: errorUnsigned },
      { value: '-1', expected: errorUnsigned },
    ];
    const negativeTests: TestCase[] = [
      { value: '-9999999', expected: -9999999 },
      { value: '-1', expected: -1 },
    ];
    const positiveTests: TestCase[] = [
      { value: '0', expected: 0 },
      { value: '1', expected: 1 },
      { value: '9999999', expected: 9999999 },
    ];
    const edgeTests: TestCase[] = [
      { value: '', expected: NaN },
      { value: 'test', expected: errorInvalid },
    ];
    const validTests: TestCase[] = [...negativeTests, ...positiveTests];
    const defaultTests: TestCase[] = [
      ...negativeTests,
      ...positiveTests,
      ...edgeTests,
    ];

    testCases('with default options', getInt, undefined, [...defaultTests]);

    testCases('with `required: true` option', getInt, { required: true }, [
      ...validTests,
      {
        value: '',
        expected: new Error('Input required and not supplied: test'),
      },
      { value: 'test', expected: new Error('Input is not an integer: test') },
    ]);

    testCases(
      'with `required: false` option',
      getInt,
      { required: false },
      defaultTests,
    );

    testCases(
      'with `trimWhitespace: true` option',
      getInt,
      { trimWhitespace: true },
      defaultTests,
    );

    testCases(
      'with `trimWhitespace: false` option',
      getInt,
      { trimWhitespace: false },
      defaultTests,
    );

    testCases(
      'with custom `validateFn` option',
      getInt,
      {
        validateFn: (value: string): boolean => value !== '99',
      },
      [
        { value: '', expected: NaN },
        { value: '99', expected: errorInvalid },
      ],
    );

    testCases(
      'with custom `validateErrorMsg` option',
      getInt,
      {
        validateFn: (value: string): boolean => value !== '99',
        validateErrorMsg: 'Input is invalid: %s',
      },
      [
        { value: '', expected: NaN },
        { value: '99', expected: errorInvalid },
      ],
    );

    error = new Error('Input is not a valid integer (min: -10): test');
    testCases('with `min: -10` option', getInt, { min: -10 }, [
      { value: '-9999999', expected: error },
      { value: '-11', expected: error },
      { value: '-10', expected: -10 },
      { value: '-1', expected: -1 },
      ...positiveTests,
      ...edgeTests,
    ]);

    testCases('with `max: 10000000` option', getInt, { max: 10000000 }, [
      ...defaultTests,
      { value: '10000000', expected: 10000000 },
      {
        value: '10000001',
        expected: new Error(
          'Input is not a valid integer (max: 10000000): test',
        ),
      },
    ]);

    error = new Error(
      'Input is not a valid integer (min: -10, max: 10000000): test',
    );
    testCases(
      'with `min: -10` and `max: 10000000` options',
      getInt,
      {
        min: -10,
        max: 10000000,
      },
      [
        { value: '-9999999', expected: error },
        { value: '-11', expected: error },
        { value: '-10', expected: -10 },
        { value: '-1', expected: -1 },
        ...positiveTests,
        { value: '10000000', expected: 10000000 },
        { value: '10000001', expected: error },
        ...edgeTests,
      ],
    );

    testCases('with `unsigned: true` option', getInt, { unsigned: true }, [
      ...unsignedTests,
      ...positiveTests,
    ]);

    testCases(
      'with `unsigned: true` and `min: -10` option',
      getInt,
      { min: -10, unsigned: true },
      [...unsignedTests, ...positiveTests, ...edgeTests],
    );

    testCases(
      'with `unsigned: true` and `max: 10000000` option',
      getInt,
      { max: 10000000, unsigned: true },
      [
        ...unsignedTests,
        ...positiveTests,
        { value: '10000000', expected: 10000000 },
        {
          value: '10000001',
          expected: new Error(
            'Input is not a valid unsigned integer (max: 10000000): test',
          ),
        },
        ...edgeTests,
      ],
    );

    testCases(
      'with `unsigned: true`, `min: -10` and `max: 10000000` options',
      getInt,
      {
        min: -10,
        max: 10000000,
        unsigned: true,
      },
      [
        ...unsignedTests,
        ...positiveTests,
        { value: '10000000', expected: 10000000 },
        {
          value: '10000001',
          expected: new Error(
            'Input is not a valid unsigned integer (max: 10000000): test',
          ),
        },
        ...edgeTests,
      ],
    );
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
      { value: 'unknown', expected: 'unknown' },
      { value: 'in-progress', expected: 'in-progress' },
      { value: 'success', expected: 'success' },
      { value: 'failure', expected: 'failure' },
      { value: 'cancelled', expected: 'cancelled' },
      { value: 'skipped', expected: 'skipped' },
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
});
