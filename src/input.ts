import * as core from '@actions/core';
import { isValidHEXColor, keyValuePairToObject } from './helpers';
import { isStatusType } from './status';

export const getHEXColor = (name: string): string => {
  const value = core.getInput(name);
  if (value.length === 0 || isValidHEXColor(value)) {
    return value;
  }
  throw new Error(
    `Invalid ${name} input value. Should be an empty string or a HEX color`,
  );
};

export const getJobStatus = (name: string): string => {
  const value = core.getInput(name);
  if (value.length === 0 || isStatusType(value)) {
    return value;
  }
  throw new Error(
    `Invalid ${name} input value. Should an empty string or: unknown|in-progress|success|failure|cancelled|skipped`,
  );
};

export const getKeyValuePairs = (
  name: string,
  valueValidationFn?: Function,
): object => {
  const multilineInput = core.getMultilineInput(name);
  const error = new Error(
    `Invalid ${name} input value. Should be key value pair(s)`,
  );

  if (multilineInput.length === 0) {
    throw error;
  }

  let result = {};
  let pairs: string[] = multilineInput;

  if (multilineInput.length === 1) {
    const item = multilineInput[0];
    pairs = item.split(',');
  }

  pairs.forEach((pair) => {
    const object = keyValuePairToObject(pair);
    if (object === null) {
      throw error;
    }
    if (
      valueValidationFn === undefined ||
      valueValidationFn(Object.values(object)[0])
    ) {
      result = { ...result, ...object };
    }
  });

  return result;
};

export const getNonEmptyString = (name: string): string => {
  const value = core.getInput(name);
  if (value.length > 0) {
    return value;
  }
  throw new Error(`Invalid ${name} input value. Shouldn't be an empty string`);
};

export const getTimestamp = (name: string): string => {
  const value = core.getInput(name);
  if (value.length === 0 || new Date(parseFloat(value)).getTime() > 0) {
    return value;
  }
  throw new Error(
    `Invalid ${name} input value. Should be an empty string or a UNIX timestamp`,
  );
};

export const getUnsignedInt = (name: string): number => {
  const value = core.getInput(name);
  const int = parseInt(value, 10);
  if (Number.isInteger(int) && int >= 0) {
    return int;
  }
  throw new Error(`Invalid ${name} input value. Should be an unsigned integer`);
};

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
      this.color = getHEXColor('color');
      this.fields = core.getMultilineInput('fields');
      this.ignoreFailures = core.getBooleanInput('ignore-failures');
      this.ignoreMessageNotFound = core.getBooleanInput(
        'ignore-message-not-found',
      );
      this.port = getUnsignedInt('port');
      this.portRetries = getUnsignedInt('port-retries');
      this.status = getJobStatus('status');
      this.text = getNonEmptyString('text');
      this.timestamp = getTimestamp('timestamp');
      return Promise.resolve(this);
    } catch (error) {
      return Promise.reject(error);
    }
  }
}
