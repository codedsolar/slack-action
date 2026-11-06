import { Slack, Message } from '../../slack/index.js';
import constants from '../../constants.js';
import status from '../../status.js';

describe('Slack', () => {
  describe('when initialized', () => {
    let slack: Slack;

    beforeEach(() => {
      slack = new Slack({
        channel: 'test',
        signingSecret: 'test',
        token: 'test',
      });
    });

    it('should have the expected values for the public fields', () => {
      expect(slack.isRunning).toBeFalsy();
    });

    it('stop() is a no-op when not running', async () => {
      await expect(slack.stop()).resolves.toBeUndefined();
      expect(slack.isRunning).toBeFalsy();
    });

    it('post() rejects with Error when not running', async () => {
      const msg = new Message(slack, {
        fields: [],
        text: 'test',
        status: status.unknown,
      });

      await expect(slack.post(msg)).rejects.toThrow(
        constants.ERROR.NOT_RUNNING,
      );
    });

    it('update() rejects with Error when not running', async () => {
      const msg = new Message(slack, {
        fields: [],
        text: 'test',
        status: status.unknown,
      });
      msg.timestamp = '1234567890.123456';

      await expect(slack.update(msg)).rejects.toThrow(
        constants.ERROR.NOT_RUNNING,
      );
    });

    it('update() rejects with Error when timestamp is empty', async () => {
      slack.isRunning = true;
      Object.assign(slack, { app: {} });

      const msg = new Message(slack, {
        fields: [],
        text: 'test',
        status: status.unknown,
      });

      await expect(slack.update(msg)).rejects.toThrow(
        constants.ERROR.UNDEFINED_MESSAGE_TIMESTAMP,
      );
    });
  });
});
