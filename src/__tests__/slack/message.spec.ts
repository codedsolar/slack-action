import expect from 'expect';
import { Message, Slack } from '../../slack';
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
});
