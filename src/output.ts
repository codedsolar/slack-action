import * as core from '@actions/core';

export default class Output {
  public slackTimestamp: string = '';

  public async set(): Promise<Output> {
    try {
      core.startGroup('Set output');
      core.setOutput('slack-timestamp', this.slackTimestamp);
      core.endGroup();
      return Promise.resolve(this);
    } catch (error) {
      return Promise.reject(error);
    }
  }
}
