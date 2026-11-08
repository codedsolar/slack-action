import * as core from '@actions/core';
import { ErrorCode, WebAPIPlatformError } from '@slack/web-api';
import { Message, Slack } from './slack/index.js';
import type { SlackOptions } from './slack/index.js';
import { mergeNamedFields, toFieldLines } from './slack/fields.js';
import Input from './input.js';
import Output from './output.js';
import constants from './constants.js';
import { getEnv } from './helpers.js';
import status from './status.js';
import type { Status } from './status.js';

export type SlackFactory = (options: SlackOptions) => Slack;

export async function send(
  slack: Slack,
  input: Input,
  output: Output,
): Promise<void> {
  const statusEntry = status[input.status as Status];
  const s =
    statusEntry !== undefined && input.color.length > 0
      ? { ...statusEntry, color: input.color }
      : statusEntry;

  const msg = new Message(slack, {
    fields: input.fields,
    text: input.text,
    status: s,
  });

  if (input.timestamp.length === 0) {
    if (input.fieldsMode === 'merge') {
      throw new Error(constants.ERROR.MERGE_REQUIRES_TIMESTAMP);
    }

    core.startGroup('Post Slack message');
    try {
      output.slackTimestamp = await msg.post();
    } finally {
      core.endGroup();
    }
    return;
  }

  msg.timestamp = input.timestamp;

  if (input.fieldsMode === 'merge') {
    core.startGroup('Merge Slack message fields');
    try {
      try {
        const existing = await slack.fetchMessage(input.timestamp);
        const incoming = msg.getNamedFields();
        const merged = mergeNamedFields(existing.fields, incoming);
        msg.options.fields = toFieldLines(merged);
        msg.textOverride = existing.text;
        if (
          input.preserveColor &&
          input.color.length === 0 &&
          existing.color.length > 0
        ) {
          msg.options.status = {
            ...msg.options.status,
            color: existing.color,
          };
        }
        core.info(`Merged ${incoming.length} field(s) into existing message`);
      } catch (err) {
        if (
          input.ignoreMessageNotFound &&
          err instanceof Error &&
          err.message === constants.ERROR.MESSAGE_NOT_FOUND
        ) {
          core.debug('Slack message not found during merge; posting a new one');
          msg.textOverride = '';
          output.slackTimestamp = await slack.post(msg);
          return;
        }
        throw err;
      }
    } finally {
      core.endGroup();
    }
  }

  core.startGroup('Update Slack message');
  try {
    try {
      output.slackTimestamp = await msg.update();
    } catch (err) {
      if (
        err instanceof WebAPIPlatformError &&
        err.code === ErrorCode.PlatformError &&
        input.ignoreMessageNotFound
      ) {
        if (err.data.error === 'message_not_found') {
          core.debug('Slack message not found');
          msg.textOverride = '';
          output.slackTimestamp = await slack.post(msg);
        } else {
          throw err;
        }
      } else {
        throw err;
      }
    }
  } finally {
    core.endGroup();
  }
}

export async function run(
  input: Input,
  output: Output,
  createSlack: SlackFactory = (options) => new Slack(options),
): Promise<void> {
  const slack = createSlack({
    channel: getEnv('SLACK_CHANNEL', { required: true }),
    signingSecret: getEnv('SLACK_SIGNING_SECRET', { required: true }),
    token: getEnv('SLACK_TOKEN', { required: true }),
  });

  try {
    await slack.start(input.port, input.portRetries);
    await send(slack, input, output);
    await output.set();
  } catch (error) {
    if (error instanceof Error) {
      core.error(error.message);
    }
    throw error instanceof Error ? error : new Error(String(error));
  } finally {
    if (slack.isRunning) {
      await slack.stop();
    }
  }
}
