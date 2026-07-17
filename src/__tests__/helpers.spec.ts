import * as github from '@actions/github';
import {
  EnvOptions,
  getActor,
  getActorUrl,
  getBranchName,
  getCommit,
  getCommitShort,
  getCommitUrl,
  getContextString,
  getEnv,
  getJob,
  getPRUrl,
  getRepoUrl,
  getWorkflow,
  getWorkflowUrl,
  isUndefined,
} from '../helpers';
import {
  mockContext,
  mockEmptyRepoContext,
  mockIssueContext,
  mockRepoContext,
} from './helpers';

const anyValues = {
  'HEX color': { value: `#000000`, expected: false },
  'key=value': { value: 'key=value', expected: false },
  NaN: { value: NaN, expected: false },
  number: { value: 1, expected: false },
  object: { value: {}, expected: false },
  string: { value: 'string', expected: false },
  undefined: { value: undefined, expected: false },
};

const testValue = (fn: (...args: unknown[]) => unknown, expected: string) => {
  it('should return its value', async () => {
    expect(fn()).toMatch(expected);
  });
};

const testValueReturn = (
  description: string,
  fn: (...args: unknown[]) => unknown,
  values: object,
  expected: string,
) => {
  describe(description, () => {
    mockContext(values);
    testValue(fn, expected);
  });
};

const testThrow = (fn: (...args: unknown[]) => unknown, expected: string) => {
  it('should throw an error', async () => {
    expect(() => fn()).toThrow(expected);
  });
};

const testEmptyThrow = (
  description: string,
  fn: (...args: unknown[]) => unknown,
  values: object,
  expected: string,
) => {
  describe(description, () => {
    mockContext(values);
    testThrow(fn, expected);
  });
};

const testReturn = (
  description: string,
  fn: (...args: unknown[]) => unknown,
  value: unknown,
  expected: boolean,
) => {
  describe(description, () => {
    it(`should return ${expected}`, () => {
      expect(fn(value)).toStrictEqual(expected);
    });
  });
};

const testReturnEmpty = (
  fn: (...args: unknown[]) => unknown,
  values: object,
  expected: string,
) => {
  describe(`${fn.name}()`, () => {
    describe('when corresponding GitHub context', () => {
      testValueReturn('exists', fn, values, expected);
      const valuesEmpty = structuredClone(values);
      Object.keys(valuesEmpty).forEach((key) => {
        valuesEmpty[key] = '';
      });
      testValueReturn("doesn't exist", fn, valuesEmpty, '');
    });
  });
};

const testReturnThrow = (
  fn: (...args: unknown[]) => unknown,
  values: object,
  expected: string,
  expectedError: string,
) => {
  describe(`${fn.name}()`, () => {
    describe('when corresponding GitHub context', () => {
      testValueReturn('exists', fn, values, expected);
      const valuesError = structuredClone(values);
      Object.keys(valuesError).forEach((key) => {
        valuesError[key] = '';
      });
      testEmptyThrow("doesn't exist", fn, valuesError, expectedError);
    });
  });
};

const testAnyValues = (fn: (...args: unknown[]) => unknown, values: object) => {
  describe('when the provided value is', () => {
    Object.keys(values).forEach((key) => {
      testReturn(key, fn, values[key].value, values[key].expected);
    });
  });
};

describe('helpers', () => {
  describe('getContextString()', () => {
    type TestScenario = {
      value: string[];
      expected: string | Error;
    };

    type TestCase = {
      description: string;
      options?: EnvOptions;
      scenarios: TestScenario[];
    };

    const error: Error = new Error('Context required and not supplied: sha');
    const errorCustom: Error = new Error('Context sha is required');

    const testCases: TestCase[] = [
      {
        description: 'with default options',
        scenarios: [
          { value: ['sha', ''], expected: '' },
          {
            value: ['sha', '0bf2c9eb66d0a76fcd90b93e66074876ebc4405a'],
            expected: '0bf2c9eb66d0a76fcd90b93e66074876ebc4405a',
          },
        ],
      },
      {
        description: 'with `required: true` option',
        options: { required: true },
        scenarios: [
          { value: ['sha', ''], expected: error },
          {
            value: ['sha', '0bf2c9eb66d0a76fcd90b93e66074876ebc4405a'],
            expected: '0bf2c9eb66d0a76fcd90b93e66074876ebc4405a',
          },
        ],
      },
      {
        description:
          'with `required: true` and custom `requiredErrorMsg` options',
        options: {
          required: true,
          requiredErrorMsg: 'Context %s is required',
        },
        scenarios: [
          { value: ['sha', ''], expected: errorCustom },
          {
            value: ['sha', '0bf2c9eb66d0a76fcd90b93e66074876ebc4405a'],
            expected: '0bf2c9eb66d0a76fcd90b93e66074876ebc4405a',
          },
        ],
      },
    ];

    testCases.forEach(({ description, options, scenarios }: TestCase) => {
      describe(description, () => {
        scenarios.forEach(({ expected, value }: TestScenario) => {
          const scenarioDescription: string =
            value[1] === ''
              ? `when the context "${value[0]}" is missing`
              : `when the context "${value[0]}" is "${value[1]}"`;

          describe(scenarioDescription, () => {
            it(`should ${expected instanceof Error ? 'throw an error' : 'return it'}`, () => {
              github.context[value[0]] = value[1];
              if (expected instanceof Error) {
                expect(() => getContextString('sha', options)).toThrow(
                  expected.message,
                );
              } else {
                expect(getContextString('sha', options)).toBe(expected);
              }
            });
          });
        });
      });
    });
  });

  describe('getEnv()', () => {
    type TestScenario = {
      value: string | undefined;
      expected: string | Error;
    };

    type TestCase = {
      description: string;
      options?: EnvOptions;
      scenarios: TestScenario[];
    };

    const error: Error = new Error(
      'Environment variable required and not supplied: TEST',
    );

    const errorCustom: Error = new Error(
      'Environment variable TEST is required',
    );

    const setEnv = (value: string | undefined) => {
      process.env.TEST = value;
    };

    const testCases: TestCase[] = [
      {
        description: 'with default options',
        scenarios: [
          { value: undefined, expected: '' },
          { value: '', expected: '' },
          { value: 'test', expected: 'test' },
        ],
      },
      {
        description: 'with `required: true` option',
        options: { required: true },
        scenarios: [
          { value: undefined, expected: error },
          { value: '', expected: error },
          { value: 'test', expected: 'test' },
        ],
      },
      {
        description:
          'with `required: true` and custom `requiredErrorMsg` options',
        options: {
          required: true,
          requiredErrorMsg: 'Environment variable %s is required',
        },
        scenarios: [
          { value: undefined, expected: errorCustom },
          { value: '', expected: errorCustom },
          { value: 'test', expected: 'test' },
        ],
      },
    ];

    testCases.forEach(({ description, options, scenarios }: TestCase) => {
      describe(description, () => {
        scenarios.forEach(({ expected, value }: TestScenario) => {
          const scenarioDescription: string =
            value === undefined
              ? 'when the environment variable is missing'
              : `when the environment variable is "${value}"`;

          describe(scenarioDescription, () => {
            it(`should ${expected instanceof Error ? 'throw an error' : 'return it'}`, () => {
              setEnv(value);
              if (expected instanceof Error) {
                expect(() => getEnv('TEST', options)).toThrow(expected.message);
              } else {
                expect(getEnv('TEST', options)).toBe(expected);
              }
            });
          });
        });
      });
    });
  });

  describe('isUndefined()', () => {
    testAnyValues(isUndefined, {
      ...anyValues,
      NaN: { expected: true },
      object: { expected: true },
      undefined: { expected: true },
    });
  });

  testReturnEmpty(getBranchName, { ref: 'refs/heads/develop' }, 'develop');

  testReturnThrow(
    getActor,
    { actor: 'user' },
    'user',
    'Context required and not supplied: actor',
  );

  testReturnThrow(
    getActorUrl,
    { actor: 'user', serverUrl: 'https://github.com' },
    'user',
    'GitHub actor or server URL context is undefined',
  );

  testReturnThrow(
    getJob,
    { job: 'test' },
    'test',
    'Context required and not supplied: job',
  );

  describe('getRepoUrl()', () => {
    describe('when corresponding GitHub context', () => {
      describe('exists', () => {
        mockRepoContext();
        testValue(getRepoUrl, 'https://github.com/user/repository');
      });

      describe("doesn't exist", () => {
        mockEmptyRepoContext();
        testThrow(getRepoUrl, 'GitHub repo context is undefined');
      });
    });
  });

  testReturnThrow(
    getCommit,
    { sha: '0bf2c9eb66d0a76fcd90b93e66074876ebc4405a' },
    '0bf2c9eb66d0a76fcd90b93e66074876ebc4405a',
    'Context required and not supplied: sha',
  );

  testReturnThrow(
    getCommitShort,
    { sha: '0bf2c9eb66d0a76fcd90b93e66074876ebc4405a' },
    '0bf2c9e',
    'Context required and not supplied: sha',
  );

  describe('getCommitUrl()', () => {
    describe('when corresponding GitHub context', () => {
      describe('exists', () => {
        mockContext({ sha: '0bf2c9eb66d0a76fcd90b93e66074876ebc4405a' });
        mockRepoContext();

        beforeEach(() => {
          github.context.sha = '0bf2c9eb66d0a76fcd90b93e66074876ebc4405a';
        });

        testValue(
          getCommitUrl,
          'https://github.com/user/repository/commit/0bf2c9e',
        );
      });

      describe("doesn't exist", () => {
        mockEmptyRepoContext();
        testThrow(getCommitUrl, 'GitHub repo context is undefined');
      });
    });
  });

  describe('getPRUrl()', () => {
    describe('when corresponding GitHub context', () => {
      describe('exists', () => {
        mockIssueContext();
        testValue(getPRUrl, 'https://github.com/user/repository/pull/1');
      });

      describe("doesn't exist", () => {
        mockEmptyRepoContext();

        it('should return an empty string', async () => {
          expect(getPRUrl()).toMatch('');
        });
      });
    });
  });

  testReturnThrow(
    getWorkflow,
    { workflow: 'test' },
    'test',
    'Context required and not supplied: workflow',
  );

  describe('getWorkflowUrl()', () => {
    describe('when corresponding GitHub context', () => {
      describe('exists', () => {
        mockContext({ runId: 1 });
        mockRepoContext();
        testValue(
          getWorkflowUrl,
          'https://github.com/user/repository/actions/runs/1',
        );
      });

      describe("doesn't exist", () => {
        mockEmptyRepoContext();
        testThrow(getWorkflowUrl, 'GitHub repo context is undefined');
      });

      describe('is invalid', () => {
        mockContext({ runId: NaN });
        mockRepoContext();
        testThrow(getWorkflowUrl, 'GitHub run ID context is undefined');
      });
    });
  });
});
