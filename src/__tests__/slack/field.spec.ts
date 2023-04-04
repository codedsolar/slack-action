import * as github from '@actions/github';
import expect from 'expect';
import * as helpers from '../../helpers';
import { Field } from '../../slack';
import { FieldType } from '../../types';
import status from '../../status';

jest.mock('@actions/github');
jest.mock('../../helpers');

describe('Field', () => {
  let field: Field;

  beforeEach(() => {
    field = new Field({
      name: 'Test Name',
      value: 'Test Value',
    });
  });

  describe('keywordRefFn()', () => {
    it('should set the name and value for a pull request', () => {
      // arrange
      const issueNumber = 42;
      github.context.eventName = 'pull_request';
      (github as any).context.issue = {
        number: issueNumber,
      };

      const prUrl = 'https://example.com/pr/42';
      (helpers.getPRUrl as jest.Mock).mockReturnValue(prUrl);

      // act
      const [name, value] = Field.keywordRefFn();

      // assert
      expect(name).toBe('Pull Request');
      expect(value).toBe(`<${prUrl}|#${issueNumber}>`);
    });

    it('should set the name and value for a push', () => {
      // arrange
      const branchName = 'main';
      const commitShort = 'abcdefg';
      github.context.eventName = 'push';

      const commitUrl = 'https://example.com/commit/abcdefg';
      (helpers.getCommitUrl as jest.Mock).mockReturnValue(commitUrl);
      (helpers.getCommitShort as jest.Mock).mockReturnValue(commitShort);
      (helpers.getBranchName as jest.Mock).mockReturnValue(branchName);

      // act
      const [name, value] = Field.keywordRefFn();

      // assert
      expect(name).toBe('Commit');
      expect(value).toBe(`<${commitUrl}|\`${commitShort} (${branchName})\`>`);
    });

    it('should set the default name and value for unsupported events', () => {
      // arrange
      const commitShort = 'abcdefg';
      github.context.eventName = 'release';

      const commitUrl = 'https://example.com/commit/abcdefg';
      (helpers.getCommitUrl as jest.Mock).mockReturnValue(commitUrl);
      (helpers.getCommitShort as jest.Mock).mockReturnValue(commitShort);

      // act
      const [name, value] = Field.keywordRefFn();

      // assert
      expect(name).toBe('Commit');
      expect(value).toBe('<https://example.com/commit/abcdefg|`abcdefg`>');
    });
  });

  describe('keywordStatusFn()', () => {
    it('should set the name and value to the status title', () => {
      // arrange
      field.options.status = status.success;

      // act
      const [name, value] = Field.keywordStatusFn(field);

      // assert
      expect(name).toBe('Status');
      expect(value).toBe('Success');
    });
  });

  describe('get()', () => {
    it('should call keywordRefFn() for the REF keyword', () => {
      // arrange
      field.options.value = '{REF}';
      const keywordRefFnSpy = jest.spyOn(Field, 'keywordRefFn');

      // act
      expect(field.get());

      // assert
      expect(keywordRefFnSpy).toHaveBeenCalledTimes(1);
    });

    it('should call keywordStatusFn() for the STATUS keyword', () => {
      // arrange
      field.options.value = '{STATUS}';
      const keywordStatusFnSpy = jest.spyOn(Field, 'keywordStatusFn');

      // act
      expect(field.get());

      // assert
      expect(keywordStatusFnSpy).toHaveBeenCalledTimes(1);
    });

    it('returns a FieldElement object', () => {
      expect(field.get()).toEqual({
        type: 'mrkdwn',
        text: '*Test Name*\nTest Value',
      });
    });
  });
});
