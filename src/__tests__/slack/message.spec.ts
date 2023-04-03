import * as github from '@actions/github';
import * as helpers from '../../helpers';
import { Message, Slack } from '../../slack';
import { MessageOptions } from '../../types';
import status from '../../status';

jest.mock('@actions/github');
jest.mock('../../helpers');
jest.mock('../../slack/slack');

describe('Message', () => {
  let slack: Slack;
  let message: Message;
  let options: MessageOptions;

  beforeEach(() => {
    slack = new Slack({
      channel: 'test',
      signingSecret: 'test',
      token: 'test',
    });
    options = {
      text: 'Test message',
      fields: ['{STATUS}', '{REF}', 'Field 1: Value 1', 'Field 2: Value 2'],
      status: status.success,
    };
    message = new Message(slack, options);
  });

  describe('constructor', () => {
    it('should set the options and Slack instance', () => {
      expect(message.options).toEqual(options);
      expect(message.slack).toEqual(slack);
    });

    it('should initialize the timestamp property', () => {
      expect(message.timestamp).toBe('');
    });
  });

  describe('getFields()', () => {
    it('should return an array of Slack elements', () => {
      // arrange
      const branchName = 'main';
      const commitShort = 'abcdefg';
      const commitUrl = 'https://example.com/commit/abcdefg';
      github.context.eventName = 'push';

      (helpers.getBranchName as jest.Mock).mockReturnValue(branchName);
      (helpers.getCommitShort as jest.Mock).mockReturnValue(commitShort);
      (helpers.getCommitUrl as jest.Mock).mockReturnValue(commitUrl);

      // act
      const fields = message.getFields();

      // assert
      expect(fields).toHaveLength(4);
      expect(fields[0]).toEqual({
        text: '*Status*\nSuccess',
        type: 'mrkdwn',
      });
      expect(fields[1]).toEqual({
        text: '*Commit*\n<https://example.com/commit/abcdefg|`abcdefg (main)`>',
        type: 'mrkdwn',
      });
      expect(fields[2]).toEqual({
        text: '*Field 1*\nValue 1',
        type: 'mrkdwn',
      });
      expect(fields[3]).toEqual({
        text: '*Field 2*\nValue 2',
        type: 'mrkdwn',
      });
    });
  });

  describe('getText()', () => {
    it('should return formatted message text', () => {
      const text = message.getText();
      expect(text).toBe('Test message');
    });
  });

  describe('post()', () => {
    it('should call the Slack "post" method and update the timestamp', async () => {
      // arrange
      const mockTimestamp = '1234567890.123456';
      jest.spyOn(slack, 'post').mockResolvedValue(mockTimestamp);

      // act
      const timestamp = await message.post();

      // assert
      expect(slack.post).toHaveBeenCalledTimes(1);
      expect(slack.post).toHaveBeenCalledWith(message);
      expect(message.timestamp).toBe(mockTimestamp);
      expect(timestamp).toBe(mockTimestamp);
    });
  });

  describe('update()', () => {
    it('should call the Slack "update" method and update the timestamp', async () => {
      // arrange
      const mockTimestamp = '0987654321.654321';
      jest.spyOn(slack, 'update').mockResolvedValue(mockTimestamp);
      message.timestamp = '1234567890.123456';

      // act
      const timestamp = await message.update();

      // assert
      expect(slack.update).toHaveBeenCalledTimes(1);
      expect(slack.update).toHaveBeenCalledWith(message);
      expect(message.timestamp).toBe(mockTimestamp);
      expect(timestamp).toBe(mockTimestamp);
    });
  });
});
