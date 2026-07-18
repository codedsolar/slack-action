import { jest } from '@jest/globals';

const mockContext = {
  eventName: 'push',
  issue: { number: 0, owner: '', repo: '' },
  repo: { owner: 'owner', repo: 'repo' },
  serverUrl: 'https://github.com',
  sha: 'abcdef123456',
  runId: 123,
  runNumber: 1,
  workflow: 'workflow',
  workflowRunId: 456,
  workflowRunNumber: 1,
};

jest.unstable_mockModule('@actions/github', () => ({
  context: mockContext,
}));
jest.unstable_mockModule('../../helpers.js', () => ({
  getCommitShort: jest.fn(),
  getBranchName: jest.fn(),
  getCommitUrl: jest.fn(),
  getPRUrl: jest.fn(),
}));

const helpers = await import('../../helpers.js');
const { Field } = await import('../../slack/index.js');
const status = (await import('../../status.js')).default;

describe('Field', () => {
  describe('keywordRefFn()', () => {
    describe('for a pull request"', () => {
      beforeEach(() => {
        mockContext.eventName = 'pull_request';
        (helpers.getPRUrl as jest.Mock).mockReturnValue(
          'https://example.com/pr/123',
        );
        mockContext.issue = { number: 123, owner: '', repo: '' };
      });

      describe('and "plain_text" type', () => {
        it('should return the pull request number as a plain text', () => {
          // arrange
          const field = new Field({ type: 'plain_text', value: 'Test Value' });

          // act
          const result = Field.keywordRefFn(field);

          // assert
          expect(result).toEqual(['Pull Request', '#123']);
        });
      });

      describe('and "mrkdwn" type', () => {
        it('should return the pull request number as a Markdown', () => {
          // arrange
          const field = new Field({ type: 'mrkdwn', value: 'Test Value' });

          // act
          const result = Field.keywordRefFn(field);

          // assert
          expect(result).toEqual([
            'Pull Request',
            '<https://example.com/pr/123|#123>',
          ]);
        });
      });
    });

    describe('for a push', () => {
      beforeEach(() => {
        mockContext.eventName = 'push';
        (helpers.getCommitShort as jest.Mock).mockReturnValue('abc123');
        (helpers.getBranchName as jest.Mock).mockReturnValue('main');
        (helpers.getCommitUrl as jest.Mock).mockReturnValue(
          'https://example.com/commit/abc123',
        );
      });

      describe('and "plain_text" type', () => {
        it('should return commit short sha and branch as a plain text', () => {
          // arrange
          const field = new Field({ type: 'plain_text', value: 'Test Value' });

          // act
          const result = Field.keywordRefFn(field);

          // assert
          expect(result).toEqual(['Commit', 'abc123 (main)']);
        });
      });

      describe('and "mrkdwn" type', () => {
        it('should return commit short sha and branch as a Markdown', () => {
          // arrange
          const field = new Field({ type: 'mrkdwn', value: 'Test Value' });

          // act
          const result = Field.keywordRefFn(field);

          // assert
          expect(result).toEqual([
            'Commit',
            '<https://example.com/commit/abc123|`abc123 (main)`>',
          ]);
        });
      });
    });

    describe('for an unsupported event', () => {
      beforeEach(() => {
        mockContext.eventName = 'unknown';
        (helpers.getCommitShort as jest.Mock).mockReturnValue('abc123');
      });

      it('should return commit short sha as a plain text', () => {
        // arrange
        const field = new Field({ type: 'plain_text', value: 'Test Value' });

        // act
        const result = Field.keywordRefFn(field);

        // assert
        expect(result).toEqual(['Commit', 'abc123']);
      });
    });
  });

  describe('keywordStatusFn()', () => {
    describe('when status is passed', () => {
      it('should return "Status" with the passed status title', () => {
        // arrange
        const field = new Field({
          value: 'Test Value',
          status: status.success,
        });

        // act
        const [name, value] = Field.keywordStatusFn(field);

        // assert
        expect(name).toBe('Status');
        expect(value).toBe('Success');
      });
    });

    describe('when status is undefined', () => {
      it('should return "Status" with an unknown status title', () => {
        // arrange
        const field = new Field({
          value: 'Test Value',
        });

        // act
        const [name, value] = Field.keywordStatusFn(field);

        // assert
        expect(name).toBe('Status');
        expect(value).toBe('Unknown');
      });
    });
  });

  describe('get()', () => {
    it('should return a plain text field element for "plain_text" type', () => {
      // arrange
      const field = new Field({
        name: 'Test Name',
        value: 'Test Value',
        type: 'plain_text',
      });

      // act
      const fieldElement = field.get();

      // assert
      expect(fieldElement).toEqual({
        type: 'plain_text',
        text: 'Test Name\nTest Value',
      });
    });

    it('should return a Markdown field element for "mrkdwn" type', () => {
      // arrange
      const field = new Field({
        name: 'Test Name',
        value: 'Test Value',
        type: 'mrkdwn',
      });

      // act
      const fieldElement = field.get();

      // assert
      expect(fieldElement).toEqual({
        type: 'mrkdwn',
        text: '*Test Name*\nTest Value',
      });
    });

    it('should apply a keyword function to the field', () => {
      const field = new Field({
        value: '{TEST}',
        keywords: {
          '{TEST}': () => ['Test Name', 'Test Value'],
        },
      });

      expect(field.get()).toEqual({
        type: 'mrkdwn',
        text: '*Test Name*\nTest Value',
      });
    });
  });
});
