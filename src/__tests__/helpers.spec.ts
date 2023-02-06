import * as github from '@actions/github';
import expect from 'expect';
import {
  getActor,
  getActorUrl,
  getBranchName,
  getCommit,
  getCommitShort,
  getEnv,
  getJob,
  getRepoUrl,
  getWorkflow,
} from '../helpers';

describe('helpers', () => {
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

  describe('getBranchName()', () => {
    describe('when corresponding GitHub context', () => {
      describe('exists', () => {
        beforeAll(() => {
          github.context.ref = 'refs/heads/develop';
        });

        it('should return its value', async () => {
          expect(getBranchName()).toMatch('develop');
        });
      });

      describe("doesn't exist", () => {
        beforeAll(() => {
          github.context.ref = '';
        });

        it('should return an empty string', async () => {
          expect(getBranchName()).toMatch('');
        });
      });
    });
  });

  describe('getActor()', () => {
    describe('when corresponding GitHub context', () => {
      describe('exists', () => {
        beforeAll(() => {
          github.context.actor = 'user';
        });

        it('should return its value', async () => {
          expect(getActor()).toMatch('user');
        });
      });

      describe("doesn't exist", () => {
        beforeAll(() => {
          github.context.actor = '';
        });

        it('should throw an error', async () => {
          expect(() => getActor()).toThrowError(
            'GitHub actor context is undefined',
          );
        });
      });
    });
  });

  describe('getActorUrl()', () => {
    describe('when corresponding GitHub context', () => {
      describe('exists', () => {
        beforeAll(() => {
          github.context.actor = 'user';
          github.context.serverUrl = 'https://github.com';
        });

        it('should return its value', async () => {
          expect(getActorUrl()).toMatch('https://github.com/user');
        });
      });

      describe("doesn't exist", () => {
        beforeAll(() => {
          github.context.actor = '';
          github.context.serverUrl = '';
        });

        it('should throw an error', async () => {
          expect(() => getActorUrl()).toThrowError(
            'GitHub actor or server URL context is undefined',
          );
        });
      });
    });
  });

  describe('getJob()', () => {
    describe('when corresponding GitHub context', () => {
      describe('exists', () => {
        beforeAll(() => {
          github.context.job = 'test';
        });

        it('should return its value', async () => {
          expect(getJob()).toMatch('test');
        });
      });

      describe("doesn't exist", () => {
        beforeAll(() => {
          github.context.job = '';
        });

        it('should throw an error', async () => {
          expect(() => getJob()).toThrowError(
            'GitHub job context is undefined',
          );
        });
      });
    });
  });

  describe('getRepoUrl()', () => {
    describe('when corresponding GitHub context', () => {
      afterAll(() => {
        jest.restoreAllMocks();
      });

      describe('exists', () => {
        beforeAll(() => {
          github.context.serverUrl = 'https://github.com';
          jest.spyOn(github.context, 'repo', 'get').mockImplementation(() => {
            return {
              owner: 'user',
              repo: 'repository',
            };
          });
        });

        it('should return its value', async () => {
          expect(getRepoUrl()).toMatch('https://github.com/user/repository');
        });
      });

      describe("doesn't exist", () => {
        beforeAll(() => {
          github.context.serverUrl = '';
          jest.spyOn(github.context, 'repo', 'get').mockImplementation(() => {
            return {
              owner: '',
              repo: '',
            };
          });
        });

        it('should throw an error', async () => {
          expect(() => getRepoUrl()).toThrowError(
            'GitHub repo context is undefined',
          );
        });
      });
    });
  });

  describe('getCommit()', () => {
    describe('when corresponding GitHub context', () => {
      describe('exists', () => {
        beforeAll(() => {
          github.context.sha = '0bf2c9eb66d0a76fcd90b93e66074876ebc4405a';
        });

        it('should return its value', async () => {
          expect(getCommit()).toMatch(
            '0bf2c9eb66d0a76fcd90b93e66074876ebc4405a',
          );
        });
      });

      describe("doesn't exist", () => {
        beforeAll(() => {
          github.context.sha = '';
        });

        it('should throw an error', async () => {
          expect(() => getCommit()).toThrowError(
            'GitHub SHA context is undefined',
          );
        });
      });
    });
  });

  describe('getCommitShort()', () => {
    describe('when corresponding GitHub context', () => {
      describe('exists', () => {
        beforeAll(() => {
          github.context.sha = '0bf2c9eb66d0a76fcd90b93e66074876ebc4405a';
        });

        it('should return its value', async () => {
          expect(getCommitShort()).toMatch('0bf2c9e');
        });
      });

      describe("doesn't exist", () => {
        beforeAll(() => {
          github.context.sha = '';
        });

        it('should throw an error', async () => {
          expect(() => getCommitShort()).toThrowError(
            'GitHub SHA context is undefined',
          );
        });
      });
    });
  });

  describe('getWorkflow()', () => {
    describe('when corresponding GitHub context', () => {
      describe('exists', () => {
        beforeAll(() => {
          github.context.workflow = 'test';
        });

        it('should return its value', async () => {
          expect(getWorkflow()).toMatch('test');
        });
      });

      describe("doesn't exist", () => {
        beforeAll(() => {
          github.context.workflow = '';
        });

        it('should throw an error', async () => {
          expect(() => getWorkflow()).toThrowError(
            'GitHub workflow context is undefined',
          );
        });
      });
    });
  });
});
