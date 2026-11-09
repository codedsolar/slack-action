import { randomUUID } from 'node:crypto';
import * as core from '@actions/core';
import { ErrorCode, WebAPIPlatformError } from '@slack/web-api';
import { Message, Slack } from './slack/index.js';
import type { SlackOptions } from './slack/index.js';
import {
  mergeAttemptSucceeded,
  mergeNamedFields,
  stripLegacyMergeFenceFields,
  toFieldLines,
} from './slack/fields.js';
import type { NamedField } from './slack/fields.js';
import Input from './input.js';
import Output from './output.js';
import constants from './constants.js';
import { getEnv } from './helpers.js';
import status from './status.js';
import type { Status } from './status.js';

export type SlackFactory = (options: SlackOptions) => Slack;
export type SleepFn = (ms: number) => Promise<void>;
export type CreateWriterIdFn = () => string;

export interface SendOptions {
  sleep?: SleepFn;
  createWriterId?: CreateWriterIdFn;
}

export const MERGE_LOCK_ACQUIRE_TIMEOUT_MS = 30_000;
export const MERGE_LOCK_EMOJI = 'lock';
export const MERGE_MAX_ATTEMPTS = 10;

const defaultSleep: SleepFn = (ms) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const defaultCreateWriterId: CreateWriterIdFn = () => randomUUID();

function mergeBackoffMs(attempt: number): number {
  return 50 * attempt + Math.floor(Math.random() * 100);
}

function lockWaitMs(): number {
  return 50 + Math.floor(Math.random() * 100);
}

function isPlatformError(
  err: unknown,
  code: string,
): err is WebAPIPlatformError {
  return (
    err instanceof WebAPIPlatformError &&
    err.code === ErrorCode.PlatformError &&
    err.data.error === code
  );
}

async function acquireMergeLock(
  slack: Slack,
  ts: string,
  sleep: SleepFn,
): Promise<void> {
  let started = Date.now();
  let forceCleared = false;

  for (;;) {
    try {
      await slack.addReaction(ts, MERGE_LOCK_EMOJI);
      core.debug(`Acquired merge lock (:${MERGE_LOCK_EMOJI}:)`);
      return;
    } catch (err) {
      if (isPlatformError(err, 'already_reacted')) {
        if (Date.now() - started >= MERGE_LOCK_ACQUIRE_TIMEOUT_MS) {
          if (!forceCleared) {
            core.warning(
              `Merge lock acquire timed out; clearing stale :${MERGE_LOCK_EMOJI}: reaction`,
            );
            try {
              await slack.removeReaction(ts, MERGE_LOCK_EMOJI);
            } catch (removeErr) {
              core.debug(
                `Failed to clear stale merge lock: ${
                  removeErr instanceof Error
                    ? removeErr.message
                    : String(removeErr)
                }`,
              );
            }
            forceCleared = true;
            started = Date.now();
            continue;
          }
          throw new Error(constants.ERROR.MERGE_LOCK_TIMEOUT, { cause: err });
        }

        await sleep(lockWaitMs());
        continue;
      }
      throw err;
    }
  }
}

async function releaseMergeLock(slack: Slack, ts: string): Promise<void> {
  try {
    await slack.removeReaction(ts, MERGE_LOCK_EMOJI);
    core.debug(`Released merge lock (:${MERGE_LOCK_EMOJI}:)`);
  } catch (err) {
    core.debug(
      `Failed to release merge lock: ${
        err instanceof Error ? err.message : String(err)
      }`,
    );
  }
}

function applyPreserveColor(
  msg: Message,
  input: Input,
  existingColor: string,
): void {
  if (
    input.preserveColor &&
    input.color.length === 0 &&
    existingColor.length > 0
  ) {
    msg.options.status = {
      ...msg.options.status,
      color: existingColor,
    };
  }
}

async function postFallback(
  slack: Slack,
  msg: Message,
  output: Output,
): Promise<void> {
  msg.textOverride = '';
  msg.mergeFence = undefined;
  output.slackTimestamp = await slack.post(msg);
}

async function updateWithIgnore(
  slack: Slack,
  msg: Message,
  input: Input,
  output: Output,
): Promise<void> {
  try {
    output.slackTimestamp = await msg.update();
  } catch (err) {
    if (
      err instanceof WebAPIPlatformError &&
      err.code === ErrorCode.PlatformError &&
      input.ignoreMessageNotFound &&
      err.data.error === 'message_not_found'
    ) {
      core.debug('Slack message not found');
      await postFallback(slack, msg, output);
      return;
    }
    throw err;
  }
}

async function mergeWithRetry(
  slack: Slack,
  msg: Message,
  input: Input,
  output: Output,
  sleep: SleepFn,
  createWriterId: CreateWriterIdFn,
): Promise<void> {
  const incoming: NamedField[] = msg.getNamedFields();

  await acquireMergeLock(slack, input.timestamp, sleep);
  try {
    for (let attempt = 1; attempt <= MERGE_MAX_ATTEMPTS; attempt++) {
      const writerId = createWriterId();

      try {
        const existing = await slack.fetchMessage(input.timestamp);
        const rev = existing.fence.rev;
        const expectedRev = rev + 1;
        const base = stripLegacyMergeFenceFields(existing.fields);
        const merged = mergeNamedFields(base, incoming);
        msg.options.fields = toFieldLines(merged);
        msg.mergeFence = { rev: expectedRev, writer: writerId };
        msg.textOverride = existing.text;
        applyPreserveColor(msg, input, existing.color);

        await updateWithIgnore(slack, msg, input, output);
        if (output.slackTimestamp !== input.timestamp) {
          // Posted a new message after message_not_found on update.
          return;
        }

        const live = await slack.fetchMessage(input.timestamp);
        if (
          mergeAttemptSucceeded(
            live.fence,
            expectedRev,
            writerId,
            live.fields,
            incoming,
          )
        ) {
          core.info(
            `Merged ${incoming.length} field(s) into existing message` +
              (attempt > 1 ? ` after ${attempt} attempt(s)` : ''),
          );
          return;
        }

        core.warning(
          `Merge verification failed (attempt ${attempt}/${MERGE_MAX_ATTEMPTS}); concurrent update likely`,
        );
      } catch (err) {
        if (
          input.ignoreMessageNotFound &&
          err instanceof Error &&
          err.message === constants.ERROR.MESSAGE_NOT_FOUND
        ) {
          core.debug('Slack message not found during merge; posting a new one');
          await postFallback(slack, msg, output);
          return;
        }
        throw err;
      }

      if (attempt < MERGE_MAX_ATTEMPTS) {
        await sleep(mergeBackoffMs(attempt));
      }
    }

    throw new Error(constants.ERROR.MERGE_CONFLICT_RETRY_EXHAUSTED);
  } finally {
    await releaseMergeLock(slack, input.timestamp);
  }
}

export async function send(
  slack: Slack,
  input: Input,
  output: Output,
  options: SendOptions = {},
): Promise<void> {
  const sleep = options.sleep ?? defaultSleep;
  const createWriterId = options.createWriterId ?? defaultCreateWriterId;
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
      await mergeWithRetry(slack, msg, input, output, sleep, createWriterId);
    } finally {
      core.endGroup();
    }
    return;
  }

  core.startGroup('Update Slack message');
  try {
    await updateWithIgnore(slack, msg, input, output);
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
