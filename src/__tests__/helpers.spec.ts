import * as github from '@actions/github';
import { cloneDeep } from 'lodash';
import expect from 'expect';
import {
  getActor,
  getActorUrl,
  getBranchName,
  getCommit,
  getCommitShort,
  getCommitUrl,
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

describe('helpers', () => {
  const testValue = (fn: Function, expected: string) => {
    it('should return its value', async () => {
      expect(fn()).toMatch(expected);
    });
  };

  const testValueReturn = (
    description: string,
    fn: Function,
    values: Object,
    expected: string,
  ) => {
    describe(description, () => {
      mockContext(values);
      testValue(fn, expected);
    });
  };

  const testThrow = (fn: Function, expected: string) => {
    it('should throw an error', async () => {
      expect(() => fn()).toThrowError(expected);
    });
  };

  const testEmptyThrow = (
    description: string,
    fn: Function,
    values: Object,
    expected: string,
  ) => {
    describe(description, () => {
      mockContext(values);
      testThrow(fn, expected);
    });
  };

  const testReturnEmpty = (fn: Function, values: Object, expected: string) => {
    describe(`${fn.name}()`, () => {
      describe('when corresponding GitHub context', () => {
        testValueReturn('exists', fn, values, expected);
        const valuesEmpty = cloneDeep(values);
        Object.keys(valuesEmpty).forEach((key) => {
          valuesEmpty[key] = '';
        });
        testValueReturn("doesn't exist", fn, valuesEmpty, '');
      });
    });
  };

  const testReturnThrow = (
    fn: Function,
    values: Object,
    expected: string,
    expectedError: string,
  ) => {
    describe(`${fn.name}()`, () => {
      describe('when corresponding GitHub context', () => {
        testValueReturn('exists', fn, values, expected);
        const valuesError = cloneDeep(values);
        Object.keys(valuesError).forEach((key) => {
          valuesError[key] = '';
        });
        testEmptyThrow("doesn't exist", fn, valuesError, expectedError);
      });
    });
  };

  describe('isUndefined()', () => {
    describe('when the provided value is', () => {
      const testTrue = (description: string, value: any) => {
        describe(description, () => {
          it('should return true', () => {
            expect(isUndefined(value)).toBeTruthy();
          });
        });
      };

      const testFalse = (description: string, value: any) => {
        describe(description, () => {
          it('should return false', () => {
            expect(isUndefined(value)).toBeFalsy();
          });
        });
      };

      testFalse('number', 1);
      testFalse('string', 'test');
      testTrue('NaN', NaN);
      testTrue('object', {});
      testTrue('undefined', undefined);
    });
  });

  describe('getEnv()', () => {
    describe("when env doesn't exist", () => {
      describe('and is not required', () => {
        it('should return an empty string', async () => {
          expect(getEnv('TEST')).toMatch('');
        });
      });

      describe('and is required', () => {
        it('should throw an error', async () => {
          expect(() => getEnv('TEST', true)).toThrowError(
            'Failed to get a required environment variable TEST',
          );
        });
      });
    });

    describe('when env exists', () => {
      beforeEach(() => {
        process.env.TEST = 'test';
      });

      it('should return its value', async () => {
        expect(getEnv('TEST')).toMatch('test');
        expect(getEnv('TEST', true)).toMatch('');
      });
    });
  });

  testReturnEmpty(getBranchName, { ref: 'refs/heads/develop' }, 'develop');

  testReturnThrow(
    getActor,
    { actor: 'user' },
    'user',
    'GitHub actor context is undefined',
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
    'GitHub job context is undefined',
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
    'GitHub SHA context is undefined',
  );

  testReturnThrow(
    getCommitShort,
    { sha: '0bf2c9eb66d0a76fcd90b93e66074876ebc4405a' },
    '0bf2c9e',
    'GitHub SHA context is undefined',
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
    'GitHub workflow context is undefined',
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
