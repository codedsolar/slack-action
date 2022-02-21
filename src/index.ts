import * as core from '@actions/core';
import { ErrorCode } from '@slack/web-api';
import { Input, get as inputGet } from './input';
import { Message, Slack } from './slack';
import { Output, set as outputSet } from './output';
import { getEnv } from './helpers';
import constants from './constants';
import status from './status';

const output: Output = <Output>{};

async function send(slack: Slack, input: Input) {
  const s = status[input.status];
  if (s !== undefined && input.color.length > 0) {
    s.color = input.color;
  }

  const msg = new Message(slack, input.text, s);
  msg.setFields(input.fields);

  if (input.timestamp.length === 0) {
    core.startGroup('Post Slack message');
    output.slackTimestamp = await msg.post().finally(() => core.endGroup());
  } else {
    msg.timestamp = input.timestamp;
    core.startGroup('Update Slack message');
    await msg
      .update()
      .then((ts) => {
        output.slackTimestamp = ts;
      })
      .catch((err) => {
        if (
          err.code === ErrorCode.PlatformError &&
          input.ignoreMessageNotFound
        ) {
          const {
            data: { error },
          } = err;
          if (error === 'message_not_found') {
            core.debug('Slack message not found');
            slack.post(msg).then((ts) => {
              output.slackTimestamp = ts;
            });
          }
        } else {
          throw err;
        }
      })
      .finally(() => core.endGroup());
  }
}

async function run(input: Input) {
  const slack: Slack | null = new Slack({
    channel: getEnv('SLACK_CHANNEL', true),
    signingSecret: getEnv('SLACK_SIGNING_SECRET', true),
    token: getEnv('SLACK_TOKEN', true),
  });

  if (slack == null) {
    throw new Error(constants.ERROR.INIT_FAILURE);
  }

  try {
    // start
    await slack.start();

    // message
    await send(slack, input);

    // stop
    await slack.stop();

    // output
    await outputSet(input, output);
  } catch (error) {
    await slack.stop();
    if (error instanceof Error) {
      throw error;
    }
  }
}

inputGet()
  .then((input) => {
    run(input).catch((err) => {
      if (input.ignoreFailures) {
        core.error(err.message);
        process.exit(0);
      } else {
        core.setFailed(err.message);
      }
    });
  })
  .catch((err) => {
    core.setFailed(err.message);
  });
