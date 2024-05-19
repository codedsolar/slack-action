import * as core from '@actions/core';
import { sprintf } from 'sprintf-js';
import { isValidHEXColor, keyValuePairToObject } from './helpers';
import { isStatusType } from './status';

/**
 * Interface for input options.
 *
 * @see getHEXColor
 */
export interface InputOptions {
  /** Optional. Whether the input is required. If required and not present, will
   * throw an error. Defaults to false */
  required?: boolean;

  /** Optional. Whether leading/trailing whitespace will be trimmed for the
   * input. Defaults to true */
  trimWhitespace?: boolean;

  /** Optional. Error message to be thrown when validation fails. Defaults to
   * the error message based on the expected behaviour. */
  validateErrorMsg?: string;

  /** Optional. Function used to validate the input. Defaults to the appropriate
   * function based on the expected behaviour. */
  validateFn?: Function;
}

/**
 * Gets the value of an input representing a HEX color. Unless trimWhitespace is
 * set to false in InputOptions, the value is also trimmed. Returns an empty
 * string if the value is not defined.
 *
 * @param name - The name of the input to get
 * @param options - Optional options
 * @returns The value of an input representing a HEX color
 *
 * @throws Error Thrown if the required input is missing or empty
 * @throws Error Thrown if the input is not a HEX color
 *
 * @example Here's a simple example:
 * ```typescript
 * try {
 *   const color = getHEXColor('color', { required: true });
 *   console.log(color)
 * } catch (e) {
 *   console.error(e.toString())
 * }
 * ```
 *
 * @see InputOptions
 */
export const getHEXColor = (name: string, options?: InputOptions): string => {
  const required: boolean = options?.required ?? false;
  const trimWhitespace: boolean = options?.trimWhitespace ?? true;
  const validateErrorMsg: string =
    options?.validateErrorMsg ?? 'Input is not a HEX color: %s';
  const validateFn: Function = options?.validateFn ?? isValidHEXColor;

  const value: string = core.getInput(name, {
    required,
    trimWhitespace,
  });

  if (!required && value.length === 0) {
    return value;
  }

  if (validateFn(value)) {
    return value;
  }

  throw new Error(sprintf(validateErrorMsg, name));
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
