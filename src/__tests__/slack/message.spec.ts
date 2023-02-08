import expect from 'expect';
import { Message, Slack } from '../../slack';
import status from '../../status';

describe('Message', () => {
  describe('when initialized', () => {
    describe('with only the required parameters', () => {
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
      let message: Message;

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
});
