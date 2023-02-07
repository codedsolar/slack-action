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
} from '../helpers';

describe('helpers', () => {
  const mockRepoContext = (
    serverUrl: string = 'https://github.com',
    owner: string = 'user',
    repo: string = 'repository',
  ) => {
    beforeEach(() => {
      github.context.serverUrl = serverUrl;
      jest.spyOn(github.context, 'repo', 'get').mockImplementation(() => {
        return { owner, repo };
      });
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });
  };

  const mockEmptyRepoContext = () => mockRepoContext('', '', '');

  const testValue = (fn: Function, expected: string) => {
    it('should return its value', async () => {
      expect(fn()).toMatch(expected);
    });
  };

  const testValueReturn = (
    description: string,
    fn: Function,
    values: any,
    expected: string,
  ) => {
    describe(description, () => {
      beforeEach(() => {
        const map = new Map<string, string>(values);
        map.forEach((value, key) => {
          github.context[key] = value;
        });
      });

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
    values: any,
    expected: string,
  ) => {
    describe(description, () => {
      beforeEach(() => {
        const map = new Map<string, string>(values);
        map.forEach((value, key) => {
          github.context[key] = value;
        });
      });

      testThrow(fn, expected);
    });
  };

  const testReturnEmpty = (fn: Function, values: any, expected: string) => {
    describe(`${fn.name}()`, () => {
      describe('when corresponding GitHub context', () => {
        testValueReturn('exists', fn, values, expected);
        const valuesEmpty = cloneDeep(values);
        valuesEmpty.forEach((value) => {
          // eslint-disable-next-line no-param-reassign
          value[1] = '';
        });
        testValueReturn("doesn't exist", fn, valuesEmpty, '');
      });
    });
  };

  const testReturnThrow = (
    fn: Function,
    values: any,
    expected: string,
    expectedError: string,
  ) => {
    describe(`${fn.name}()`, () => {
      describe('when corresponding GitHub context', () => {
        testValueReturn('exists', fn, values, expected);
        const valuesError = cloneDeep(values);
        valuesError.forEach((value) => {
          // eslint-disable-next-line no-param-reassign
          value[1] = '';
        });
        testEmptyThrow("doesn't exist", fn, valuesError, expectedError);
      });
    });
  };

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

  testReturnEmpty(getBranchName, [['ref', 'refs/heads/develop']], 'develop');

  testReturnThrow(
    getActor,
    [['actor', 'user']],
    'user',
    'GitHub actor context is undefined',
  );

  testReturnThrow(
    getActorUrl,
    [
      ['actor', 'user'],
      ['serverUrl', 'https://github.com'],
    ],
    'user',
    'GitHub actor or server URL context is undefined',
  );

  testReturnThrow(
    getJob,
    [['job', 'test']],
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
    [['sha', '0bf2c9eb66d0a76fcd90b93e66074876ebc4405a']],
    '0bf2c9eb66d0a76fcd90b93e66074876ebc4405a',
    'GitHub SHA context is undefined',
  );

  testReturnThrow(
    getCommitShort,
    [['sha', '0bf2c9eb66d0a76fcd90b93e66074876ebc4405a']],
    '0bf2c9e',
    'GitHub SHA context is undefined',
  );

  describe('getCommitUrl()', () => {
    describe('when corresponding GitHub context', () => {
      describe('exists', () => {
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
        mockRepoContext();

        beforeEach(() => {
          github.context.eventName = 'pull_request';
          jest.spyOn(github.context, 'issue', 'get').mockImplementation(() => {
            return { owner: '', repo: '', number: 1 };
          });
        });

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
    [['workflow', 'test']],
    'test',
    'GitHub workflow context is undefined',
  );
});
