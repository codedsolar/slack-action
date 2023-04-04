import * as github from '@actions/github';
import expect from 'expect';
import * as helpers from '../../helpers';
import { Field } from '../../slack';
import status from '../../status';

jest.mock('@actions/github');
jest.mock('../../helpers');

describe('Field', () => {
  describe('keywordRefFn()', () => {
    describe('for a pull request"', () => {
      beforeEach(() => {
        (github.context.eventName as any) = 'pull_request';
        (helpers.getPRUrl as any) = jest
          .fn()
          .mockReturnValue('https://example.com/pr/123');
        (github.context.issue as any) = { number: 123 };
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
        (github.context.eventName as any) = 'push';
        (helpers.getCommitShort as any) = jest.fn().mockReturnValue('abc123');
        (helpers.getBranchName as any) = jest.fn().mockReturnValue('main');
        (helpers.getCommitUrl as any) = jest
          .fn()
          .mockReturnValue('https://example.com/commit/abc123');
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
        (github.context.eventName as any) = 'unknown';
        (helpers.getCommitShort as any) = jest.fn().mockReturnValue('abc123');
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
