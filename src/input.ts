import * as core from '@actions/core';
import { sprintf } from 'sprintf-js';

/**
 * Interface for input options.
 *
 * @see InputIntOptions
 * @see getHEXColor
 * @see getInput
 * @see getJobStatus
 * @see getMultilineInput
 * @see getTimestamp
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
  validateFn?: (value: string) => boolean; // eslint-disable-line no-unused-vars
}

/**
 * Interface for input integer options. Extends {@link InputOptions}.
 *
 * @see InputOptions
 * @see getInt
 */
export interface InputIntOptions extends InputOptions {
  /** Optional. Maximum allowed integer value. */
  max?: number;

  /** Optional. Minimum allowed integer value. */
  min?: number;

  /** Optional. Whether an integer is unsigned. Defaults to false */
  unsigned?: boolean;
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
export function getInput(name: string, options?: InputOptions): string {
  const required: boolean = options?.required ?? false;
  const trimWhitespace: boolean = options?.trimWhitespace ?? true;
  const validateErrorMsg: string =
    options?.validateErrorMsg ?? 'Input is not valid: %s';

  // eslint-disable-next-line no-unused-vars
  const validateFn: ((value: string) => boolean) | undefined =
    options?.validateFn ?? undefined;

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
}

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
export function getMultilineInput(
  name: string,
  options?: InputOptions,
): string[] {
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
}

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
export function getHEXColor(name: string, options?: InputOptions): string {
  const validateFn = (value: string): boolean => /^#[\dA-F]{6}$/i.test(value);
  return getInput(name, {
    ...options,
    validateErrorMsg:
      options?.validateErrorMsg ?? 'Input is not a HEX color: %s',
    validateFn: options?.validateFn ?? validateFn,
  });
}

/**
 * Gets the value of an input representing an integer.
 *
 * Utilizes {@link getInput} under the hood.
 *
 * @param name - The name of the input to get
 * @param options - Optional options
 * @returns The value of an input representing an integer
 *
 * @throws Error Thrown if the required input is missing or empty
 * @throws Error Thrown if the input is not a valid integer
 *
 * @example Example of getting the validated value:
 * ```typescript
 * // prints: `100`
 * process.env.INPUT_TEST = '100';
 * const test: number = getInt('test');
 * console.log(test);
 * ```
 *
 * @example Example of catching an error:
 * ```typescript
 * // prints: "Error: Input is not a valid integer (min: -10, max: 100): test"
 * process.env.INPUT_TEST = '-100';
 * try {
 *   const test: number = getInt('test', {
 *     min: -10,
 *     max: 100,
 *     required: true,
 *   });
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
 * @see getInput
 */
export function getInt(name: string, options?: InputIntOptions): number {
  // eslint-disable-next-line no-unused-vars
  const validateFn: (value: string) => boolean = (value: string): boolean => {
    const int: number = parseInt(value, 10);
    const isInt: boolean = value === int.toString();

    let typeName: string = 'integer';
    if (options?.unsigned) {
      typeName = 'unsigned integer';
    }

    if (options?.unsigned && int < 0) {
      throw new Error(`Input is not an ${typeName}: ${name}`);
    }

    const msg: string = `Input is not a valid ${typeName}`;
    if (options?.min !== undefined && options?.max !== undefined) {
      if (int < options.min || int > options.max) {
        if (options?.unsigned) {
          throw new Error(`${msg} (max: ${options.max}): ${name}`);
        } else {
          throw new Error(
            `${msg} (min: ${options.min}, max: ${options.max}): ${name}`,
          );
        }
      }
    } else if (options?.min !== undefined) {
      if (int < options.min) {
        if (options?.unsigned) {
          throw new Error(`${msg}: ${name}`);
        } else {
          throw new Error(`${msg} (min: ${options.min}): ${name}`);
        }
      }
    } else if (options?.max !== undefined) {
      if (int > options.max) {
        throw new Error(`${msg} (max: ${options.max}): ${name}`);
      }
    }

    return isInt;
  };

  const value = getInput(name, {
    ...options,
    validateErrorMsg: 'Input is not an integer: test',
    validateFn: options?.validateFn ?? validateFn,
  });

  return parseInt(value, 10);
}

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
export function getJobStatus(name: string, options?: InputOptions): string {
  const validateFn = (value: string): boolean =>
    [
      'cancelled',
      'failure',
      'in-progress',
      'skipped',
      'success',
      'unknown',
    ].indexOf(value) >= 0;
  return getInput(name, {
    ...options,
    validateErrorMsg:
      options?.validateErrorMsg ??
      'Input is not a job status (unknown|in-progress|success|failure|cancelled|skipped): %s',
    validateFn: options?.validateFn ?? validateFn,
  });
}

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
export function getTimestamp(name: string, options?: InputOptions): string {
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
}

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
      this.port = getInt('port', { unsigned: true });
      this.portRetries = getInt('port-retries', { unsigned: true });
      this.status = getJobStatus('status');
      this.text = getInput('text', { required: true });
      this.timestamp = getTimestamp('timestamp');
      return Promise.resolve(this);
    } catch (error) {
      return Promise.reject(error);
    }
  }
}
