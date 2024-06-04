import * as core from '@actions/core';
import { ErrorCode } from '@slack/web-api';
import { Message, Slack } from './slack';
import Input from './input';
import Output from './output';
import constants from './constants';
import { getEnv } from './helpers';
import status from './status';

const input = new Input();
const output = new Output();

async function send(slack: Slack) {
  const s = status[input.status];
  if (s !== undefined && input.color.length > 0) {
    s.color = input.color;
  }

  const msg = new Message(slack, {
    fields: input.fields,
    text: input.text,
    status: s,
  });

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

async function run() {
  const slack: Slack | null = new Slack({
    channel: getEnv('SLACK_CHANNEL', { required: true }),
    signingSecret: getEnv('SLACK_SIGNING_SECRET', { required: true }),
    token: getEnv('SLACK_TOKEN', { required: true }),
  });

  if (slack == null) {
    throw new Error(constants.ERROR.INIT_FAILURE);
  }

  try {
    await slack.start(input.port, input.portRetries);
    await send(slack);
    await slack.stop();
    await output.set();
  } catch (error) {
    if (error instanceof Error) {
      core.error(error.message);
    }
    await slack.stop();
  }
}

input
  .get()
  .then(() => {
    run().catch((err) => {
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
