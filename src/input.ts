import * as core from '@actions/core';
import * as input from './toolkit/input';

export default class Input {
  public color: string = '';

  public fields: string[] = ['{STATUS}', '{REF}'];

  public ignoreFailures: boolean = false;

  public ignoreMessageNotFound: boolean = true;

  public port: number = 3000;

  public portRetries: number = 3;

  public status: string = 'unknown';

  public text: string =
    'GitHub Actions {GITHUB_JOB} job in {GITHUB_REF} by {GITHUB_ACTOR}';

  public timestamp: string = '';

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
