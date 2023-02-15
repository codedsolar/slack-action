import * as github from '@actions/github';
import expect from 'expect';
import { MrkdwnElement } from '@slack/bolt';
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
    const testFields = (
      mrkdwnStatus: MrkdwnElement,
      mrkdwnCommit: MrkdwnElement,
    ) => {
      describe('with the default fields', () => {
        it('should return the expected values', () => {
          expect(message.getFields()).toStrictEqual([
            mrkdwnStatus,
            mrkdwnCommit,
          ]);
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
    };

    describe('when is triggered by', () => {
      const mrkdwnStatus: MrkdwnElement = {
        type: 'mrkdwn',
        text: '*Status*\nUnknown',
      };

      mockRepoContext();

      describe('push event', () => {
        mockContext({ eventName: 'push' });
        testFields(mrkdwnStatus, {
          type: 'mrkdwn',
          text: '*Commit*\n<https://github.com/user/repository/commit/0bf2c9e|`0bf2c9e (develop)`>',
        });
      });

      describe('pull request event', () => {
        describe('with an issue number', () => {
          mockContext({ eventName: 'pull_request' });

          beforeEach(() => {
            jest
              .spyOn(github.context, 'issue', 'get')
              .mockImplementation(() => {
                return { owner: '', repo: '', number: 1 };
              });
          });

          testFields(mrkdwnStatus, {
            type: 'mrkdwn',
            text: '*Pull Request*\n<https://github.com/user/repository/pull/1|#1>',
          });
        });

        describe('without an issue number', () => {
          mockContext({ eventName: 'pull_request' });
          testFields(mrkdwnStatus, {
            type: 'mrkdwn',
            text: '*Commit*\n<https://github.com/user/repository/commit/0bf2c9e|`0bf2c9e`>',
          });
        });
      });
    });
  });
});
