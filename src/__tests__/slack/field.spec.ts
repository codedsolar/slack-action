import * as github from '@actions/github';
import expect from 'expect';
import * as helpers from '../../helpers';
import { FieldKeyword, FieldType } from '../../types';
import { Field } from '../../slack';
import status from '../../status';

jest.mock('@actions/github');
jest.mock('../../helpers');

describe('Field', () => {
  let field: Field;

  beforeEach(() => {
    field = new Field();
  });

  describe('when initialized', () => {
    it('without optional parameters', () => {
      field = new Field();
      expect(field.name).toBe('');
      expect(field.status).toBe(status.unknown);
      expect(field.type).toBe('mrkdwn');
      expect(field.value).toBe('');
    });

    it('with optional parameters', () => {
      field = new Field('Name', 'Value');
      expect(field.name).toBe('Name');
      expect(field.status).toBe(status.unknown);
      expect(field.type).toBe('mrkdwn');
      expect(field.value).toBe('Value');
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
      field.status.title = 'Test';

      // act
      const [name, value] = Field.keywordStatusFn(field);

      // assert
      expect(name).toBe('Status');
      expect(value).toBe('Test');
    });
  });

  describe('setByKeyword()', () => {
    it('should call setToRef() for the REF keyword', () => {
      // arrange
      const keywordRefFnSpy = jest.spyOn(Field, 'keywordRefFn');

      // act
      field.setByKeyword('{REF}');

      // assert
      expect(keywordRefFnSpy).toHaveBeenCalledTimes(1);
    });

    it('should call setToStatus() for the STATUS keyword', () => {
      // arrange
      const keywordStatusFnSpy = jest.spyOn(Field, 'keywordStatusFn');

      // act
      field.setByKeyword('{STATUS}');

      // assert
      expect(keywordStatusFnSpy).toHaveBeenCalledTimes(1);
    });

    it('should do nothing to the name and value for other keywords', () => {
      // act
      field.setByKeyword('test' as FieldKeyword);

      // assert
      expect(field.name).toBe('');
      expect(field.value).toBe('');
    });
  });

  describe('get()', () => {
    it('returns null if type is not "mrkdwn"', () => {
      field.type = 'plain_text' as FieldType;
      expect(field.get()).toBeNull();
    });

    it('returns a FieldElement object', () => {
      field.name = 'Field Name';
      field.value = 'Field Value';
      expect(field.get()).toEqual({
        type: 'mrkdwn',
        text: '*Field Name*\nField Value',
      });
    });
  });
});
