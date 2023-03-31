import * as github from '@actions/github';
import expect from 'expect';
import * as helpers from '../../helpers';
import { FieldKeyword, FieldType } from '../../types/slack/field';
import { Field } from '../../slack';
import status from '../../status';

jest.mock('../../helpers');
jest.mock('@actions/github');

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

  describe('setToRef()', () => {
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
      field.setToRef();

      // assert
      expect(field.name).toBe('Pull Request');
      expect(field.value).toBe(`<${prUrl}|#${issueNumber}>`);
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
      field.setToRef();

      // assert
      expect(field.name).toBe('Commit');
      expect(field.value).toBe(
        `<${commitUrl}|\`${commitShort} (${branchName})\`>`,
      );
    });

    it('should set the default name and value for unsupported events', () => {
      // arrange
      const commitShort = 'abcdefg';
      github.context.eventName = 'release';

      const commitUrl = 'https://example.com/commit/abcdefg';
      (helpers.getCommitUrl as jest.Mock).mockReturnValue(commitUrl);
      (helpers.getCommitShort as jest.Mock).mockReturnValue(commitShort);

      // act
      field.setToRef();

      // assert
      expect(field.name).toBe('Commit');
      expect(field.value).toBe(
        '<https://example.com/commit/abcdefg|`abcdefg`>',
      );
    });
  });

  describe('setToStatus()', () => {
    it('should set the name and value to the status title', () => {
      // arrange
      field.status.title = 'Test';

      // act
      field.setToStatus();

      // assert
      expect(field.name).toBe('Status');
      expect(field.value).toBe('Test');
    });
  });

  describe('setByKeyword()', () => {
    it('should call setToRef() for the REF keyword', () => {
      // arrange
      const setToRefSpy = jest.spyOn(field, 'setToRef');

      // act
      field.setByKeyword(FieldKeyword.REF);

      // assert
      expect(setToRefSpy).toHaveBeenCalledTimes(1);
    });

    it('should call setToStatus() for the STATUS keyword', () => {
      // arrange
      const setToStatusSpy = jest.spyOn(field, 'setToStatus');

      // act
      field.setByKeyword(FieldKeyword.STATUS);

      // assert
      expect(setToStatusSpy).toHaveBeenCalledTimes(1);
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
