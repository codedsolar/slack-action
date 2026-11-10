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
  warning: jest.fn(),
  setOutput: jest.fn(),
  setFailed: jest.fn(),
  getBooleanInput: jest.fn(),
  getInput: jest.fn(),
  getMultilineInput: jest.fn(),
}));

const { send, run, MERGE_MAX_ATTEMPTS } = await import('../run.js');
const { default: InputClass } = await import('../input.js');
const { default: OutputClass } = await import('../output.js');
const { default: constants } = await import('../constants.js');
const core = await import('@actions/core');

const noSleep = async (): Promise<void> => undefined;

function sequentialWriterIds(...ids: string[]): () => string {
  let index = 0;
  return () => {
    const id = ids[Math.min(index, ids.length - 1)];
    index += 1;
    return id;
  };
}

function fence(rev: number, writer: string): { rev: number; writer: string } {
  return { rev, writer };
}

function createInput(overrides: Partial<Input> = {}): Input {
  const input = new InputClass();
  input.fields = [];
  input.fieldsMode = 'replace';
  input.preserveColor = false;
  input.text = 'hello';
  input.status = 'unknown';
  input.color = '';
  input.timestamp = '';
  input.ignoreMergeLock = false;
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
    fetchMessage: ReturnType<typeof jest.fn>;
    addReaction: ReturnType<typeof jest.fn>;
    removeReaction: ReturnType<typeof jest.fn>;
    start: ReturnType<typeof jest.fn>;
    stop: ReturnType<typeof jest.fn>;
    isRunning: boolean;
  }> = {},
): Slack & { isRunning: boolean } {
  const slack = {
    isRunning: overrides.isRunning ?? false,
    post: overrides.post ?? jest.fn(async () => '111.222'),
    update: overrides.update ?? jest.fn(async () => '111.222'),
    fetchMessage:
      overrides.fetchMessage ??
      jest.fn(async () => ({
        color: '#dcad04',
        fence: fence(0, ''),
        fields: [
          { name: 'Status', value: 'In Progress' },
          { name: 'ESLint issues', value: 'Checking...' },
        ],
        text: 'existing text',
      })),
    addReaction: overrides.addReaction ?? jest.fn(async () => undefined),
    removeReaction: overrides.removeReaction ?? jest.fn(async () => undefined),
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

function alreadyReactedError(): WebAPIPlatformError {
  return new WebAPIPlatformError({
    ok: false,
    error: 'already_reacted',
  });
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

  it('rejects merge mode without a timestamp', async () => {
    const slack = createSlackMock({ isRunning: true });
    const input = createInput({
      fieldsMode: 'merge',
      timestamp: '',
    });

    await expect(send(slack, input, output)).rejects.toThrow(
      'fields-mode "merge" requires a timestamp of the message to update',
    );
  });

  it('merges fields by name before updating', async () => {
    const update = jest.fn(
      async (msg: {
        options: { fields: string[]; status: { color: string } };
        mergeFence?: { rev: number; writer: string };
        textOverride: string;
      }) => {
        expect(msg.options.fields).toEqual([
          'Status: Success',
          'ESLint issues: 0',
        ]);
        expect(msg.mergeFence).toEqual({ rev: 1, writer: 'writer-1' });
        expect(msg.options.status.color).toBe('#24a943');
        expect(msg.textOverride).toBe('existing text');
        return '123.456';
      },
    );
    const fetchMessage = jest
      .fn<(ts: string) => Promise<object>>()
      .mockResolvedValueOnce({
        color: '#dcad04',
        fence: fence(0, ''),
        fields: [
          { name: 'Status', value: 'In Progress' },
          { name: 'ESLint issues', value: 'Checking...' },
        ],
        text: 'existing text',
      })
      .mockResolvedValueOnce({
        color: '#24a943',
        fence: fence(1, 'writer-1'),
        fields: [
          { name: 'Status', value: 'Success' },
          { name: 'ESLint issues', value: '0' },
        ],
        text: 'existing text',
      });
    const slack = createSlackMock({ update, fetchMessage, isRunning: true });
    const input = createInput({
      timestamp: '123.456',
      fieldsMode: 'merge',
      fields: ['ESLint issues: 0', '{STATUS}'],
      status: 'success',
    });

    await send(slack, input, output, {
      sleep: noSleep,
      createWriterId: sequentialWriterIds('writer-1'),
    });

    expect(fetchMessage).toHaveBeenCalledTimes(2);
    expect(update).toHaveBeenCalledTimes(1);
    expect(slack.addReaction).toHaveBeenCalledTimes(1);
    expect(slack.removeReaction).toHaveBeenCalledTimes(1);
    expect(output.slackTimestamp).toBe('123.456');
  });

  it('preserves fetched attachment color when preserve-color is true', async () => {
    const update = jest.fn(
      async (msg: { options: { status: { color: string } } }) => {
        expect(msg.options.status.color).toBe('#dcad04');
        return '123.456';
      },
    );
    const fetchMessage = jest
      .fn<(ts: string) => Promise<object>>()
      .mockResolvedValueOnce({
        color: '#dcad04',
        fence: fence(0, ''),
        fields: [{ name: 'Status', value: 'In Progress' }],
        text: 'existing text',
      })
      .mockResolvedValueOnce({
        color: '#dcad04',
        fence: fence(1, 'writer-1'),
        fields: [{ name: 'Status', value: 'Success' }],
        text: 'existing text',
      });
    const slack = createSlackMock({ update, fetchMessage, isRunning: true });
    const input = createInput({
      timestamp: '123.456',
      fieldsMode: 'merge',
      preserveColor: true,
      fields: ['{STATUS}'],
      status: 'success',
    });

    await send(slack, input, output, {
      sleep: noSleep,
      createWriterId: sequentialWriterIds('writer-1'),
    });

    expect(update).toHaveBeenCalledTimes(1);
    expect(fetchMessage).toHaveBeenCalledTimes(2);
  });

  it('retries merge when verification shows a lost concurrent update', async () => {
    const update = jest.fn(async () => '123.456');
    const fetchMessage = jest
      .fn<(ts: string) => Promise<object>>()
      .mockResolvedValueOnce({
        color: '#dcad04',
        fence: fence(0, ''),
        fields: [
          { name: 'Image A', value: 'Pending...' },
          { name: 'Image B', value: 'Pending...' },
        ],
        text: 'existing text',
      })
      .mockResolvedValueOnce({
        color: '#dcad04',
        fence: fence(1, 'other-writer'),
        fields: [
          { name: 'Image A', value: 'Pending...' },
          { name: 'Image B', value: 'Completed' },
        ],
        text: 'existing text',
      })
      .mockResolvedValueOnce({
        color: '#dcad04',
        fence: fence(1, 'other-writer'),
        fields: [
          { name: 'Image A', value: 'Pending...' },
          { name: 'Image B', value: 'Completed' },
        ],
        text: 'existing text',
      })
      .mockResolvedValueOnce({
        color: '#dcad04',
        fence: fence(2, 'writer-2'),
        fields: [
          { name: 'Image A', value: 'Completed' },
          { name: 'Image B', value: 'Completed' },
        ],
        text: 'existing text',
      });
    const slack = createSlackMock({ update, fetchMessage, isRunning: true });
    const input = createInput({
      timestamp: '123.456',
      fieldsMode: 'merge',
      fields: ['Image A: Completed'],
    });

    await send(slack, input, output, {
      sleep: noSleep,
      createWriterId: sequentialWriterIds('writer-1', 'writer-2'),
    });

    expect(update).toHaveBeenCalledTimes(2);
    expect(fetchMessage).toHaveBeenCalledTimes(4);
    expect(output.slackTimestamp).toBe('123.456');
    expect(core.warning).toHaveBeenCalled();
  });

  it('retries after a stale-base clobber from another writer', async () => {
    const update = jest.fn(async () => '123.456');
    const fetchMessage = jest
      .fn<(ts: string) => Promise<object>>()
      .mockResolvedValueOnce({
        color: '#dcad04',
        fence: fence(0, ''),
        fields: [
          { name: 'Image A', value: 'Pending...' },
          { name: 'Image B', value: 'Pending...' },
        ],
        text: 'existing text',
      })
      .mockResolvedValueOnce({
        color: '#dcad04',
        fence: fence(1, 'writer-A'),
        fields: [
          { name: 'Image A', value: 'Success' },
          { name: 'Image B', value: 'Pending...' },
        ],
        text: 'existing text',
      })
      .mockResolvedValueOnce({
        color: '#dcad04',
        fence: fence(1, 'writer-A'),
        fields: [
          { name: 'Image A', value: 'Success' },
          { name: 'Image B', value: 'Pending...' },
        ],
        text: 'existing text',
      })
      .mockResolvedValueOnce({
        color: '#dcad04',
        fence: fence(2, 'writer-B2'),
        fields: [
          { name: 'Image A', value: 'Success' },
          { name: 'Image B', value: 'Success' },
        ],
        text: 'existing text',
      });
    const slack = createSlackMock({ update, fetchMessage, isRunning: true });
    const input = createInput({
      timestamp: '123.456',
      fieldsMode: 'merge',
      fields: ['Image B: Success'],
    });

    await send(slack, input, output, {
      sleep: noSleep,
      createWriterId: sequentialWriterIds('writer-B1', 'writer-B2'),
    });

    expect(update).toHaveBeenCalledTimes(2);
    const secondMsg = update.mock.calls[1][0] as {
      options: { fields: string[] };
      mergeFence?: { rev: number; writer: string };
    };
    expect(secondMsg.options.fields).toEqual([
      'Image A: Success',
      'Image B: Success',
    ]);
    expect(secondMsg.mergeFence).toEqual({ rev: 2, writer: 'writer-B2' });
    expect(fetchMessage).toHaveBeenCalledTimes(4);
    expect(core.warning).toHaveBeenCalled();
  });

  it('treats only a matching merge writer as success', async () => {
    const update = jest.fn(async () => '123.456');
    const fetchMessage = jest
      .fn<(ts: string) => Promise<object>>()
      .mockResolvedValueOnce({
        color: '#dcad04',
        fence: fence(0, ''),
        fields: [{ name: 'A', value: 'Pending...' }],
        text: 'existing text',
      })
      .mockResolvedValueOnce({
        color: '#dcad04',
        fence: fence(1, 'writer-other'),
        fields: [{ name: 'A', value: 'Completed' }],
        text: 'existing text',
      })
      .mockResolvedValueOnce({
        color: '#dcad04',
        fence: fence(1, 'writer-other'),
        fields: [{ name: 'A', value: 'Pending...' }],
        text: 'existing text',
      })
      .mockResolvedValueOnce({
        color: '#dcad04',
        fence: fence(2, 'writer-2'),
        fields: [{ name: 'A', value: 'Completed' }],
        text: 'existing text',
      });
    const slack = createSlackMock({ update, fetchMessage, isRunning: true });
    const input = createInput({
      timestamp: '123.456',
      fieldsMode: 'merge',
      fields: ['A: Completed'],
    });

    await send(slack, input, output, {
      sleep: noSleep,
      createWriterId: sequentialWriterIds('writer-1', 'writer-2'),
    });

    expect(update).toHaveBeenCalledTimes(2);
    expect(core.warning).toHaveBeenCalled();
  });

  it('throws when merge verification keeps failing', async () => {
    const update = jest.fn(async () => '123.456');
    const fetchMessage = jest.fn(async () => ({
      color: '#dcad04',
      fence: fence(99, 'other'),
      fields: [{ name: 'A', value: 'Pending...' }],
      text: 'existing text',
    }));
    const slack = createSlackMock({ update, fetchMessage, isRunning: true });
    const input = createInput({
      timestamp: '123.456',
      fieldsMode: 'merge',
      fields: ['A: Completed'],
    });

    await expect(
      send(slack, input, output, {
        sleep: noSleep,
        createWriterId: () => 'writer-self',
      }),
    ).rejects.toThrow(constants.ERROR.MERGE_CONFLICT_RETRY_EXHAUSTED);
    expect(update).toHaveBeenCalledTimes(MERGE_MAX_ATTEMPTS);
  });

  it('posts a new message when merge fetch cannot find the timestamp', async () => {
    const post = jest.fn(async () => '999.888');
    const update = jest.fn(async () => '123.456');
    const fetchMessage = jest.fn(async () => {
      throw new Error(constants.ERROR.MESSAGE_NOT_FOUND);
    });
    const slack = createSlackMock({
      post,
      update,
      fetchMessage,
      isRunning: true,
    });
    const input = createInput({
      timestamp: '123.456',
      fieldsMode: 'merge',
      fields: ['A: Completed'],
      ignoreMessageNotFound: true,
    });

    await send(slack, input, output, { sleep: noSleep });

    expect(post).toHaveBeenCalledTimes(1);
    expect(update).not.toHaveBeenCalled();
    expect(slack.removeReaction).toHaveBeenCalledTimes(1);
    expect(output.slackTimestamp).toBe('999.888');
  });

  it('skips the reaction lock when ignore-merge-lock is true', async () => {
    const addReaction = jest.fn(async () => undefined);
    const removeReaction = jest.fn(async () => undefined);
    const update = jest.fn(async () => '123.456');
    const fetchMessage = jest
      .fn<(ts: string) => Promise<object>>()
      .mockResolvedValueOnce({
        color: '#dcad04',
        fence: fence(0, ''),
        fields: [{ name: 'A', value: 'Pending...' }],
        text: 'existing text',
      })
      .mockResolvedValueOnce({
        color: '#dcad04',
        fence: fence(1, 'writer-1'),
        fields: [{ name: 'A', value: 'Done' }],
        text: 'existing text',
      });
    const slack = createSlackMock({
      addReaction,
      removeReaction,
      update,
      fetchMessage,
      isRunning: true,
    });
    const input = createInput({
      timestamp: '123.456',
      fieldsMode: 'merge',
      ignoreMergeLock: true,
      fields: ['A: Done'],
    });

    await send(slack, input, output, {
      sleep: noSleep,
      createWriterId: sequentialWriterIds('writer-1'),
    });

    expect(addReaction).not.toHaveBeenCalled();
    expect(removeReaction).not.toHaveBeenCalled();
    expect(update).toHaveBeenCalledTimes(1);
    expect(output.slackTimestamp).toBe('123.456');
  });

  it('retries reaction lock acquire after already_reacted', async () => {
    const addReaction = jest
      .fn(async () => undefined)
      .mockRejectedValueOnce(alreadyReactedError())
      .mockResolvedValueOnce(undefined);
    const removeReaction = jest.fn(async () => undefined);
    const fetchMessage = jest
      .fn<(ts: string) => Promise<object>>()
      .mockResolvedValueOnce({
        color: '#dcad04',
        fence: fence(0, ''),
        fields: [{ name: 'A', value: 'Pending...' }],
        text: 'existing text',
      })
      .mockResolvedValueOnce({
        color: '#dcad04',
        fence: fence(1, 'writer-1'),
        fields: [{ name: 'A', value: 'Done' }],
        text: 'existing text',
      });
    const slack = createSlackMock({
      addReaction,
      removeReaction,
      fetchMessage,
      isRunning: true,
    });
    const input = createInput({
      timestamp: '123.456',
      fieldsMode: 'merge',
      fields: ['A: Done'],
    });

    await send(slack, input, output, {
      sleep: noSleep,
      createWriterId: sequentialWriterIds('writer-1'),
    });

    expect(addReaction).toHaveBeenCalledTimes(2);
    expect(removeReaction).toHaveBeenCalledTimes(1);
  });

  it('releases the reaction lock when merge verification keeps failing', async () => {
    const removeReaction = jest.fn(async () => undefined);
    const update = jest.fn(async () => '123.456');
    const fetchMessage = jest.fn(async () => ({
      color: '#dcad04',
      fence: fence(99, 'other'),
      fields: [{ name: 'A', value: 'Pending...' }],
      text: 'existing text',
    }));
    const slack = createSlackMock({
      update,
      fetchMessage,
      removeReaction,
      isRunning: true,
    });
    const input = createInput({
      timestamp: '123.456',
      fieldsMode: 'merge',
      fields: ['A: Completed'],
    });

    await expect(
      send(slack, input, output, {
        sleep: noSleep,
        createWriterId: () => 'writer-self',
      }),
    ).rejects.toThrow(constants.ERROR.MERGE_CONFLICT_RETRY_EXHAUSTED);
    expect(removeReaction).toHaveBeenCalledTimes(1);
  });

  it('serializes concurrent merges with the reaction lock', async () => {
    let locked = false;
    const addReaction = jest.fn(async () => {
      if (locked) {
        throw alreadyReactedError();
      }
      locked = true;
    });
    const removeReaction = jest.fn(async () => {
      locked = false;
    });

    let shared = [
      { name: 'Worker A', value: 'Pending...' },
      { name: 'Worker B', value: 'Pending...' },
    ];
    let liveFence = fence(0, '');

    const fetchMessage = jest.fn(async () => ({
      color: '#dcad04',
      fence: { ...liveFence },
      fields: shared.map((field) => ({ ...field })),
      text: 'existing text',
    }));

    const update = jest.fn(
      async (msg: {
        options: { fields: string[] };
        mergeFence?: { rev: number; writer: string };
      }) => {
        shared = msg.options.fields.map((line) => {
          const index = line.indexOf(': ');
          return {
            name: line.slice(0, index),
            value: line.slice(index + 2),
          };
        });
        if (msg.mergeFence !== undefined) {
          liveFence = { ...msg.mergeFence };
        }
        return '123.456';
      },
    );

    const slack = createSlackMock({
      addReaction,
      removeReaction,
      fetchMessage,
      update,
      isRunning: true,
    });

    const inputA = createInput({
      timestamp: '123.456',
      fieldsMode: 'merge',
      fields: ['Worker A: Done'],
    });
    const inputB = createInput({
      timestamp: '123.456',
      fieldsMode: 'merge',
      fields: ['Worker B: Done'],
    });
    const outputA = new OutputClass();
    const outputB = new OutputClass();

    await Promise.all([
      send(slack, inputA, outputA, {
        sleep: noSleep,
        createWriterId: sequentialWriterIds('writer-A'),
      }),
      send(slack, inputB, outputB, {
        sleep: noSleep,
        createWriterId: sequentialWriterIds('writer-B'),
      }),
    ]);

    expect(shared).toEqual([
      { name: 'Worker A', value: 'Done' },
      { name: 'Worker B', value: 'Done' },
    ]);
    expect(removeReaction).toHaveBeenCalled();
    expect(addReaction.mock.calls.length).toBeGreaterThanOrEqual(2);
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
