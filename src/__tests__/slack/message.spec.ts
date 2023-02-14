import expect from 'expect';
import { Message, Slack } from '../../slack';
import { mockContext, mockRepoContext } from '../helpers';
import status from '../../status';

describe('Message', () => {
  let message: Message;

  beforeEach(() => {
    message = new Message(
      new Slack({
        channel: 'test',
        signingSecret: 'test',
        token: 'test',
      }),
    );
  });

  describe('when initialized', () => {
    describe('with only the required parameters', () => {
      it('should have the expected values for the public fields', () => {
        expect(message.status).toStrictEqual({
          color: '#1f242b',
          title: 'Unknown',
        });
        expect(message.text).toBe(
          'GitHub Actions {GITHUB_JOB} job in {GITHUB_REF} by {GITHUB_ACTOR}',
        );
        expect(message.timestamp).toBe('');
      });
    });

    describe('with all parameters', () => {
      beforeEach(() => {
        message = new Message(
          new Slack({
            channel: 'test',
            signingSecret: 'test',
            token: 'test',
          }),
          'test',
          status.success,
        );
      });

      it('should have the expected values for the public fields', () => {
        expect(message.status).toStrictEqual({
          color: '#24a943',
          title: 'Success',
        });
        expect(message.text).toBe('test');
        expect(message.timestamp).toBe('');
      });
    });
  });

  describe('setFields()', () => {
    it('should set fields', () => {
      message.setFields(['']);
      expect(message.getFields()).toStrictEqual([]);
      message.setFields(['Name:Value']);
      expect(message.getFields()).toStrictEqual([
        { type: 'mrkdwn', text: '*Name*\nValue' },
      ]);
    });
  });

  describe('getFields()', () => {
    const mrkdwnStatus = { type: 'mrkdwn', text: '*Status*\nUnknown' };
    const mrkdwnCommit = {
      type: 'mrkdwn',
      text: '*Commit*\n<https://github.com/user/repository/commit/0bf2c9e|`0bf2c9e`>',
    };

    mockRepoContext();
    mockContext({
      sha: '0bf2c9eb66d0a76fcd90b93e66074876ebc4405a',
    });

    describe('with the default fields', () => {
      it('should return the expected values', () => {
        expect(message.getFields()).toStrictEqual([mrkdwnStatus, mrkdwnCommit]);
      });
    });

    describe('with the {STATUS} keyword field', () => {
      beforeEach(() => {
        message.setFields(['{STATUS}']);
      });

      it('should return the expected values', () => {
        expect(message.getFields()).toStrictEqual([mrkdwnStatus]);
      });
    });

    describe('with the {REF} keyword field', () => {
      beforeEach(() => {
        message.setFields(['{REF}']);
      });

      it('should return the expected values', () => {
        expect(message.getFields()).toStrictEqual([mrkdwnCommit]);
      });
    });

    describe('with the unknown keyword field', () => {
      beforeEach(() => {
        message.setFields(['{TEST}']);
      });

      it('should return the expected values', () => {
        expect(message.getFields()).toStrictEqual([]);
      });
    });
  });
});
