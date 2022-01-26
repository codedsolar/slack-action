import * as core from '@actions/core';
import { Input, get as inputGet } from './input';
import { Message, Slack } from './slack';
import { Output, set as outputSet } from './output';
import { getEnv } from './helpers';
import constants from './constants';
import status from './status';

async function run() {
  const output: Output = <Output>{};
  const input: Input = await inputGet();
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
    const s = status[input.status];
    if (s !== undefined && input.color.length > 0) {
      s.color = input.color;
    }

    const msg = new Message(input.text, s);
    msg.setFields(input.fields);

    if (input.timestamp.length === 0) {
      output.slackTimestamp = await slack.post(msg);
    } else {
      output.slackTimestamp = await slack.update(msg, input.timestamp);
    }

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

run().catch((err) => {
  core.setFailed(err.message);
});
