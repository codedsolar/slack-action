import { jest } from '@jest/globals';
import { WebAPIPlatformError } from '@slack/web-api';
import type { Slack } from '../slack/index.js';
import type Input from '../input.js';
import type Output from '../output.js';

jest.unstable_mockModule('@actions/core', () => ({
  startGroup: jest.fn(),
  endGroup: jest.fn(),
  debug: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  setOutput: jest.fn(),
  setFailed: jest.fn(),
  getBooleanInput: jest.fn(),
  getInput: jest.fn(),
  getMultilineInput: jest.fn(),
}));

const { send, run } = await import('../run.js');
const { default: InputClass } = await import('../input.js');
const { default: OutputClass } = await import('../output.js');
const core = await import('@actions/core');

function createInput(overrides: Partial<Input> = {}): Input {
  const input = new InputClass();
  input.fields = [];
  input.text = 'hello';
  input.status = 'unknown';
  input.color = '';
  input.timestamp = '';
  input.ignoreMessageNotFound = true;
  input.port = 3000;
  input.portRetries = 3;
  Object.assign(input, overrides);
  return input;
}

function createSlackMock(
  overrides: Partial<{
    post: ReturnType<typeof jest.fn>;
    update: ReturnType<typeof jest.fn>;
    start: ReturnType<typeof jest.fn>;
    stop: ReturnType<typeof jest.fn>;
    isRunning: boolean;
  }> = {},
): Slack & { isRunning: boolean } {
  const slack = {
    isRunning: overrides.isRunning ?? false,
    post: overrides.post ?? jest.fn(async () => '111.222'),
    update: overrides.update ?? jest.fn(async () => '111.222'),
    start:
      overrides.start ??
      jest.fn(async () => {
        slack.isRunning = true;
      }),
    stop:
      overrides.stop ??
      jest.fn(async () => {
        slack.isRunning = false;
      }),
  };
  return slack as unknown as Slack & { isRunning: boolean };
}

describe('send()', () => {
  let output: Output;

  beforeEach(() => {
    output = new OutputClass();
    jest.clearAllMocks();
  });

  it('posts a new message when timestamp is empty', async () => {
    const post = jest.fn(async () => '123.456');
    const slack = createSlackMock({ post, isRunning: true });
    const input = createInput({ timestamp: '' });

    await send(slack, input, output);

    expect(post).toHaveBeenCalledTimes(1);
    expect(output.slackTimestamp).toBe('123.456');
    expect(core.startGroup).toHaveBeenCalledWith('Post Slack message');
    expect(core.endGroup).toHaveBeenCalled();
  });

  it('updates an existing message when timestamp is set', async () => {
    const update = jest.fn(async () => '123.456');
    const slack = createSlackMock({ update, isRunning: true });
    const input = createInput({ timestamp: '123.456' });

    await send(slack, input, output);

    expect(update).toHaveBeenCalledTimes(1);
    expect(output.slackTimestamp).toBe('123.456');
  });

  it('awaits post fallback when message_not_found and ignore is true', async () => {
    const notFound = new WebAPIPlatformError({
      ok: false,
      error: 'message_not_found',
    });
    const update = jest.fn(async () => {
      throw notFound;
    });
    const post = jest.fn(async () => '999.888');
    const slack = createSlackMock({ update, post, isRunning: true });
    const input = createInput({
      timestamp: '123.456',
      ignoreMessageNotFound: true,
    });

    await send(slack, input, output);

    expect(post).toHaveBeenCalledTimes(1);
    expect(output.slackTimestamp).toBe('999.888');
  });

  it('rethrows other platform errors even when ignore-message-not-found is true', async () => {
    const channelNotFound = new WebAPIPlatformError({
      ok: false,
      error: 'channel_not_found',
    });
    const update = jest.fn(async () => {
      throw channelNotFound;
    });
    const post = jest.fn(async () => '999.888');
    const slack = createSlackMock({ update, post, isRunning: true });
    const input = createInput({
      timestamp: '123.456',
      ignoreMessageNotFound: true,
    });

    await expect(send(slack, input, output)).rejects.toBe(channelNotFound);
    expect(post).not.toHaveBeenCalled();
    expect(output.slackTimestamp).toBe('');
  });

  it('rethrows message_not_found when ignore-message-not-found is false', async () => {
    const notFound = new WebAPIPlatformError({
      ok: false,
      error: 'message_not_found',
    });
    const update = jest.fn(async () => {
      throw notFound;
    });
    const post = jest.fn(async () => '999.888');
    const slack = createSlackMock({ update, post, isRunning: true });
    const input = createInput({
      timestamp: '123.456',
      ignoreMessageNotFound: false,
    });

    await expect(send(slack, input, output)).rejects.toBe(notFound);
    expect(post).not.toHaveBeenCalled();
  });
});

describe('run()', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.SLACK_CHANNEL = 'general';
    process.env.SLACK_SIGNING_SECRET = 'secret';
    process.env.SLACK_TOKEN = 'token';
  });

  it('rethrows start failures without calling stop when never started', async () => {
    const startError = new Error('channel missing');
    const start = jest.fn(async () => {
      throw startError;
    });
    const stop = jest.fn(async () => undefined);
    const slack = createSlackMock({ start, stop, isRunning: false });
    const input = createInput();
    const output = new OutputClass();

    await expect(run(input, output, () => slack)).rejects.toThrow(
      'channel missing',
    );

    expect(stop).not.toHaveBeenCalled();
    expect(core.error).toHaveBeenCalledWith('channel missing');
    expect(output.slackTimestamp).toBe('');
  });

  it('stops slack after a successful send', async () => {
    const post = jest.fn(async () => '123.456');
    const stop = jest.fn(async () => undefined);
    const slack = createSlackMock({ post, stop, isRunning: false });
    const input = createInput({ timestamp: '' });
    const output = new OutputClass();

    await run(input, output, () => slack);

    expect(post).toHaveBeenCalledTimes(1);
    expect(stop).toHaveBeenCalledTimes(1);
    expect(output.slackTimestamp).toBe('123.456');
    expect(core.setOutput).toHaveBeenCalledWith('slack-timestamp', '123.456');
  });

  it('stops slack and rethrows when send fails after start', async () => {
    const sendError = new Error('post failed');
    const post = jest.fn(async () => {
      throw sendError;
    });
    const stop = jest.fn(async () => undefined);
    const slack = createSlackMock({ post, stop, isRunning: false });
    const input = createInput({ timestamp: '' });
    const output = new OutputClass();

    await expect(run(input, output, () => slack)).rejects.toThrow(
      'post failed',
    );

    expect(stop).toHaveBeenCalledTimes(1);
    expect(core.error).toHaveBeenCalledWith('post failed');
  });
});
