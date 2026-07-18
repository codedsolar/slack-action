import { jest } from '@jest/globals';

const mockContext = {
  eventName: 'push',
  issue: { number: 0 },
  ref: 'refs/heads/main',
  repo: { owner: 'owner', repo: 'repo' },
  runId: 123,
  runNumber: 1,
  serverUrl: 'https://github.com',
  sha: 'abcdef123456',
  workflow: 'workflow',
  workflowRunId: 456,
  workflowRunNumber: 1,
  payload: {} as never,
};

jest.unstable_mockModule('@actions/github', () => ({
  context: mockContext,
}));
jest.unstable_mockModule('../../helpers.js', () => ({
  getActor: jest.fn(),
  getActorUrl: jest.fn(),
  getWorkflow: jest.fn(),
  getWorkflowUrl: jest.fn(),
  getJob: jest.fn(),
  getBranchName: jest.fn(),
}));

const helpers = await import('../../helpers.js');
const { default: TextBlock } = await import('../../slack/text.js');

describe('Text', () => {
  let text: InstanceType<typeof TextBlock>;

  beforeEach(() => {
    text = new TextBlock();

    Object.assign(mockContext, {
      eventName: 'push',
      issue: { number: 0, owner: '', repo: '' },
      ref: 'refs/heads/main',
      repo: { owner: 'owner', repo: 'repo' },
      runId: 123,
      runNumber: 1,
      serverUrl: 'https://github.com',
      sha: 'abcdef123456',
      workflow: 'workflow',
      workflowRunId: 456,
      workflowRunNumber: 1,
    });

    (helpers.getActor as jest.Mock).mockReturnValue('octocat');
    (helpers.getActorUrl as jest.Mock).mockReturnValue(
      'https://github.com/octocat',
    );
    (helpers.getWorkflow as jest.Mock).mockReturnValue('workflow');
    (helpers.getWorkflowUrl as jest.Mock).mockReturnValue(
      'https://github.com/owner/repo/actions/runs/123',
    );
    (helpers.getJob as jest.Mock).mockReturnValue('job');
    (helpers.getBranchName as jest.Mock).mockReturnValue('main');
  });

  describe('get()', () => {
    it('interpolates GITHUB_ACTOR keyword', () => {
      text.set('GitHub Actions GITHUB_JOB job in GITHUB_REF by {GITHUB_ACTOR}');
      expect(text.get()).toEqual(
        'GitHub Actions GITHUB_JOB job in GITHUB_REF by <https://github.com/octocat|octocat>',
      );
    });

    it('interpolates GITHUB_JOB keyword', () => {
      text.set('GitHub Actions {GITHUB_JOB} job in GITHUB_REF by GITHUB_ACTOR');
      expect(text.get()).toEqual(
        'GitHub Actions <https://github.com/owner/repo/actions/runs/123|workflow / job> job in GITHUB_REF by GITHUB_ACTOR',
      );
    });

    describe('interpolates GITHUB_REF keyword', () => {
      it('for a push', () => {
        text.set(
          'GitHub Actions GITHUB_JOB job in {GITHUB_REF} by GITHUB_ACTOR',
        );
        expect(text.get()).toEqual(
          'GitHub Actions GITHUB_JOB job in <https://github.com/owner/repo|owner/repo>@<https://github.com/owner/repo/tree/main|main> by GITHUB_ACTOR',
        );
      });

      it('for a pull request', () => {
        // arrange
        mockContext.eventName = 'pull_request';
        mockContext.issue.number = 1;

        text.set(
          'GitHub Actions GITHUB_JOB job in {GITHUB_REF} by GITHUB_ACTOR',
        );

        // assert
        expect(text.get()).toEqual(
          'GitHub Actions GITHUB_JOB job in <https://github.com/owner/repo|owner/repo>#<https://github.com/owner/repo/pull/1|1> by GITHUB_ACTOR',
        );
      });

      it('for an unsupported event', () => {
        // arrange
        mockContext.eventName = 'release';

        text.set(
          'GitHub Actions GITHUB_JOB job in {GITHUB_REF} by GITHUB_ACTOR',
        );

        // assert
        expect(text.get()).toEqual(
          'GitHub Actions GITHUB_JOB job in <https://github.com/owner/repo|owner/repo> by GITHUB_ACTOR',
        );
      });
    });

    it('ignores unsupported keywords', () => {
      text.set('GitHub Actions {FIRST} job in {SECOND} by {THIRD}');
      expect(text.get()).toEqual(
        'GitHub Actions {FIRST} job in {SECOND} by {THIRD}',
      );
    });
  });
});
