import * as core from '@actions/core';
import * as input from './toolkit/input';

/**
 * Class Input for retrieving and storing all input values.
 */
export default class Input {
  /**
   * Attachment color in HEX format.
   */
  public color: string = '';

  /**
   * Fields in the multiline format.
   * Each field must match: "<your name>: <your value>".
   * Supported keywords: `{REF}`, `{STATUS}`.
   */
  public fields: string[] = ['{STATUS}', '{REF}'];

  /**
   * When the action exits it will be with an exit code of 0.
   */
  public ignoreFailures: boolean = false;

  /**
   * When the previous message to update isn't found, a new one will be posted
   * instead.
   */
  public ignoreMessageNotFound: boolean = true;

  /**
   * Port on which to run the Slack application.
   */
  public port: number = 3000;

  /**
   * Port retries number for an automatic bumping of unavailable ports.
   */
  public portRetries: number = 3;

  /**
   * Status: `unknown`, `in-progress`, `success`, `failure`, `cancelled`,
   * `skipped`.
   *
   * Respects: `job.status`, `steps.<step id>.conclusion`,
   * `steps.<step id>.outcome`.
   *
   * @see {@link https://docs.github.com/en/actions/learn-github-actions/contexts#job-context}
   * @see {@link https://docs.github.com/en/actions/learn-github-actions/contexts#steps-context}
   */
  public status: string = 'unknown';

  /**
   * Message text. Supported keywords: `{GITHUB_ACTOR}`, `{GITHUB_JOB}`,
   * `{GITHUB_REF}`.
   */
  public text: string =
    'GitHub Actions {GITHUB_JOB} job in {GITHUB_REF} by {GITHUB_ACTOR}';

  /**
   * Timestamp in Slack UNIX format of the previous message to update.
   *
   * Use-case: update an already posted message from the previous step based on
   * the "slack-timestamp" output.
   */
  public timestamp: string = '';

  /**
   * Get all inputs.
   */
  public async get(): Promise<Input> {
    try {
      this.color = input.getHEXColor('color');
      this.fields = input.getMultilineInput('fields');
      this.ignoreFailures = core.getBooleanInput('ignore-failures');
      this.ignoreMessageNotFound = core.getBooleanInput(
        'ignore-message-not-found',
      );
      this.port = input.getInt('port', { unsigned: true });
      this.portRetries = input.getInt('port-retries', { unsigned: true });
      this.status = input.getJobStatus('status');
      this.text = input.getInput('text', { required: true });
      this.timestamp = input.getTimestamp('timestamp');
      return Promise.resolve(this);
    } catch (error) {
      return Promise.reject(error);
    }
  }
}
