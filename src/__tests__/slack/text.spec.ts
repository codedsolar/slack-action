import * as github from '@actions/github';
import * as helpers from '../../helpers';
import Text from '../../slack/text';

jest.mock('@actions/github');
jest.mock('../../helpers');

describe('Text', () => {
  let text: Text;

  beforeEach(() => {
    text = new Text();

    jest.resetAllMocks();

    (github as any).context = {
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
    };

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
        github.context.eventName = 'pull_request';
        github.context.issue.number = 1;

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
        github.context.eventName = 'release';

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
