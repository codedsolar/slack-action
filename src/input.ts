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
 * Gets the value of an input. Unless `trimWhitespace` is set to `false` in
 * {@link InputOptions}, the value is also trimmed. Returns an empty string if
 * the value is not defined.
 *
 * @param name - The name of the input to get
 * @param options - Optional options
 * @returns The value of an input
 *
 * @throws Error Thrown if the required input is missing or empty
 * @throws Error Thrown if the input is not valid
 *
 * @example Example of getting the validated value:
 * ```typescript
 * // prints: "example"
 * process.env.INPUT_TEST = 'example';
 * const test: string = getInput('test', {
 *   validateFn: (value: string): boolean => {
 *     return value === 'example';
 *   },
 * });
 * console.log(test);
 * ```
 *
 * @example Example of catching an error:
 * ```typescript
 * // prints: "Error: Input required and not supplied: test"
 * process.env.INPUT_TEST = '';
 * try {
 *   const test: string = getInput('test', { required: true });
 *   console.log(test);
 * } catch (e: any) {
 *   if (e instanceof Error) {
 *     console.error(e.toString());
 *   } else {
 *     console.error('An unknown error occurred:', e);
 *   }
 * }
 * ```
 *
 * @see InputOptions
 */
export const getInput: Function = (
  name: string,
  options?: InputOptions,
): string => {
  const required: boolean = options?.required ?? false;
  const trimWhitespace: boolean = options?.trimWhitespace ?? true;
  const validateErrorMsg: string =
    options?.validateErrorMsg ?? 'Input is not valid: %s';
  const validateFn: Function | undefined = options?.validateFn ?? undefined;

  const value: string = core.getInput(name, {
    required,
    trimWhitespace,
  });

  if (validateFn !== undefined) {
    if (!required && value.length === 0) {
      return value;
    }

    if (!validateFn(value)) {
      throw new Error(sprintf(validateErrorMsg, name));
    }
  }

  return value;
};

/**
 * Gets the value of a multiline input. Unlike {@link getInput},
 * {@link InputOptions.validateFn} validates each line.
 *
 * Utilizes {@link getInput} under the hood.
 *
 * @param name - The name of the input to get
 * @param options - Optional options
 * @returns The value of a multiline input
 *
 * @throws Error Thrown if the required input is missing or empty
 * @throws Error Thrown if the input is not valid
 *
 * @example
 * ```typescript
 * // prints: "[ 'one', 'two' ]"
 * process.env.INPUT_TEST = 'one\ntwo';
 * const test: string[] = getMultilineInput('test', { required: true });
 * console.log(test);
 * ```
 *
 * @see InputOptions
 * @see getInput
 */
export const getMultilineInput: Function = (
  name: string,
  options?: InputOptions,
): string[] => {
  const inputs: string[] = getInput(name, options)
    .split('\n')
    .filter((x: string): boolean => x !== '');

  if (options && options.trimWhitespace === false) {
    return inputs;
  }

  const lines: string[] = inputs.map((input: string) => input.trim());
  const validateErrorMsg: string =
    options?.validateErrorMsg ?? 'Input on line %d is not valid: %s';

  if (options?.validateFn !== undefined) {
    const { validateFn }: InputOptions = options;
    let lineNr: number = 0;
    lines.forEach((line: string) => {
      lineNr += 1;
      if (validateFn !== undefined && !validateFn(line)) {
        throw new Error(sprintf(validateErrorMsg, lineNr, name));
      }
    });
  }

  return lines;
};

/**
 * Gets the value of an input representing a HEX color.
 *
 * Utilizes {@link getInput} under the hood.
 *
 * @param name - The name of the input to get
 * @param options - Optional options
 * @returns The value of an input representing a HEX color
 *
 * @throws Error Thrown if the required input is missing or empty
 * @throws Error Thrown if the input is not a HEX color
 *
 * @example
 * ```typescript
 * // prints: "#000000"
 * process.env.INPUT_TEST = '#000000';
 * const test: string = getHEXColor('test', { required: true });
 * console.log(test);
 * ```
 *
 * @see getInput
 */
export const getHEXColor: Function = (
  name: string,
  options?: InputOptions,
): string => {
  return getInput(name, {
    ...options,
    validateErrorMsg:
      options?.validateErrorMsg ?? 'Input is not a HEX color: %s',
    validateFn: options?.validateFn ?? isValidHEXColor,
  });
};

/**
 * Gets the value of an input representing a job status: cancelled, failure,
 * in-progress, skipped, success, unknown.
 *
 * Utilizes {@link getInput} under the hood.
 *
 * @param name - The name of the input to get
 * @param options - Optional options
 * @returns The value of an input representing a job status
 *
 * @throws Error Thrown if the required input is missing or empty
 * @throws Error Thrown if the input is not a job status
 *
 * @example
 * ```typescript
 * // prints: "success"
 * process.env.INPUT_TEST = 'success';
 * const test: string = getJobStatus('test', { required: true });
 * console.log(test);
 * ```
 *
 * @see getInput
 */
export const getJobStatus: Function = (
  name: string,
  options?: InputOptions,
): string => {
  return getInput(name, {
    ...options,
    validateErrorMsg:
      options?.validateErrorMsg ??
      'Input is not a job status (unknown|in-progress|success|failure|cancelled|skipped): %s',
    validateFn: options?.validateFn ?? isStatusType,
  });
};

/**
 * Gets the value of an input representing a UNIX timestamp.
 *
 * Utilizes {@link getInput} under the hood.
 *
 * @param name - The name of the input to get
 * @param options - Optional options
 * @returns The value of an input representing a UNIX timestamp
 *
 * @throws Error Thrown if the required input is missing or empty
 * @throws Error Thrown if the input is not a UNIX timestamp
 *
 * @example
 * ```typescript
 * // prints: "1672524000"
 * process.env.INPUT_TEST = '1672524000';
 * const test: string = getTimestamp('test', { required: true });
 * console.log(test);
 * ```
 *
 * @see getInput
 */
export const getTimestamp: Function = (
  name: string,
  options?: InputOptions,
): string => {
  return getInput(name, {
    ...options,
    validateErrorMsg:
      options?.validateErrorMsg ?? 'Input is not a UNIX timestamp: %s',
    validateFn:
      options?.validateFn ??
      function isTimestamp(value: string): boolean {
        return new Date(parseFloat(value)).getTime() > 0;
      },
  });
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
      this.fields = getMultilineInput('fields');
      this.ignoreFailures = core.getBooleanInput('ignore-failures');
      this.ignoreMessageNotFound = core.getBooleanInput(
        'ignore-message-not-found',
      );
      this.port = getUnsignedInt('port');
      this.portRetries = getUnsignedInt('port-retries');
      this.status = getJobStatus('status');
      this.text = getInput('text', { required: true });
      this.timestamp = getTimestamp('timestamp');
      return Promise.resolve(this);
    } catch (error) {
      return Promise.reject(error);
    }
  }
}
