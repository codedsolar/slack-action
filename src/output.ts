import * as core from '@actions/core';
import { Output } from './types/output';

export default async function set(output: Output): Promise<void> {
  core.startGroup('Set output');
  core.setOutput('slack-timestamp', output.slackTimestamp);
  core.endGroup();
}
