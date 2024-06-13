import * as core from '@actions/core';

/**
 * Class Output for retrieving and storing all output values.
 */
export default class Output {
  /**
   * Previous Slack message timestamp
   *
   * Use-case: use to update an already posted message by using this value as
   * the "timestamp" input value.
   */
  public slackTimestamp: string = '';

  /**
   * Set all outputs.
   */
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
