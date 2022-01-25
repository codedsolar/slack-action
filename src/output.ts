import * as core from '@actions/core';
import { Input } from './input';

export interface Output {
  slackTimestamp: string;
}

export async function set(input: Input, output: Output): Promise<void> {
  core.startGroup('Set output');
  core.setOutput('slack-timestamp', output.slackTimestamp);
  core.endGroup();
}
