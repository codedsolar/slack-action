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
});
