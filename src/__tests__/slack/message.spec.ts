import expect from 'expect';
import { MrkdwnElement } from '@slack/bolt';
import { Message, Slack } from '../../slack';
import { mockContext, mockIssueContext, mockRepoContext } from '../helpers';
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
    const testStatus = (color: string, title: string, text: string) => {
      it('should have the expected values for the public fields', () => {
        expect(message.status).toStrictEqual({ color, title });
        expect(message.text).toBe(text);
        expect(message.timestamp).toBe('');
      });
    };

    describe('with only the required parameters', () => {
      testStatus(
        '#1f242b',
        'Unknown',
        'GitHub Actions {GITHUB_JOB} job in {GITHUB_REF} by {GITHUB_ACTOR}',
      );
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

      testStatus('#24a943', 'Success', 'test');
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
    const testField = (
      name: string,
      expected: MrkdwnElement | undefined = undefined,
    ) => {
      describe(`with the ${name} keyword field`, () => {
        beforeEach(() => {
          message.setFields([name]);
        });

        it('should return the expected values', () => {
          expect(message.getFields()).toStrictEqual(
            expected === undefined ? [] : [expected],
          );
        });
      });
    };

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

      testField('{STATUS}', mrkdwnStatus);
      testField('{REF}', mrkdwnCommit);
      testField('{TEST}');
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
          mockIssueContext();
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
