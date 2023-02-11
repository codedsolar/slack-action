import * as core from '@actions/core';

export interface Output {
  slackTimestamp: string;
}

export async function set(output: Output): Promise<void> {
  core.startGroup('Set output');
  core.setOutput('slack-timestamp', output.slackTimestamp);
  core.endGroup();
}
