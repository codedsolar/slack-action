import expect from 'expect';
import { Slack } from '../../slack';

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
  });
});
