import * as github from '@actions/github';
import { sprintf } from 'sprintf-js';
import constants from './constants';

/**
 * Interface for context options.
 *
 * @see getContextString
 */
export interface ContextOptions {
  /** Optional. Whether the context is required. If required and not present,
   * will throw an error. Defaults to false */
  required?: boolean;

  /** Optional. Error message to be thrown when the required context is missing.
   * Defaults to "Context required and not supplied: %s". */
  requiredErrorMsg?: string;
}

/**
 * Interface for {@link getEnv} options.
 *
 * @see getEnv
 */
export interface EnvOptions {
  /** Optional. Whether the environment variable is required. If required and
   * not present, will throw an error. Defaults to false */
  required?: boolean;

  /** Optional. Error message to be thrown when the required environment
   * variable is missing. Defaults to "Environment variable required and not
   * supplied: %s". */
  requiredErrorMsg?: string;
}

/**
 * Gets the value of a context.
 *
 * @param name - The name of the context
 * @param options - Optional options
 * @returns The value of the context
 *
 * @throws Error Thrown if the required context is not supplied
 *
 * @example
 * ```typescript
 * // prints: "Error: Context required and not supplied: name"
 * try {
 *   const test: string = getContextString('test', { required: true });
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
 * @see ContextOptions
 */
export function getContextString(
  name: string,
  options?: ContextOptions,
): string {
  const value: string = github.context[name];

  const required: boolean = options?.required ?? false;
  const requiredErrorMsg: string =
    options?.requiredErrorMsg ?? 'Context required and not supplied: %s';

  if (required && (value === undefined || value.trim().length === 0)) {
    throw new Error(sprintf(requiredErrorMsg, name));
  }

  return value;
}

/**
 * Gets the value of an environment variable.
 *
 * @param name - The name of the environment variable
 * @param options - Optional options
 * @returns The value of the environment variable
 *
 * @throws Error Thrown if the required environment variable is not supplied
 *
 * @example
 * ```typescript
 * // prints: "example"
 * process.env.TEST = 'example';
 * const test: string = getEnv('TEST', { required: true });
 * console.log(test);
 * ```
 *
 * @example
 * ```typescript
 * // prints: "Error: Environment variable required and not supplied: TEST"
 * process.env.TEST = '';
 * try {
 *   const test: string = getEnv('TEST', { required: true });
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
 * @see EnvOptions
 */
export function getEnv(name: string, options?: EnvOptions): string {
  const required: boolean = options?.required ?? false;
  const requiredErrorMsg: string =
    options?.requiredErrorMsg ??
    'Environment variable required and not supplied: %s';
  const value: string = process.env[name] || '';

  if (required && value.trim().length === 0) {
    throw new Error(sprintf(requiredErrorMsg, name));
  }

  return value;
}

export const isUndefined = (value: any): boolean => {
  if (value === undefined) {
    return true;
  }
  switch (typeof value) {
    case 'number':
      return Number.isNaN(value);
    case 'string':
      return value.length === 0;
    default:
      return true;
  }
};

export const getBranchName = (): string => {
  const { ref } = github.context;
  return ref.length > 0 && ref.indexOf('refs/heads/') > -1
    ? ref.slice('refs/heads/'.length)
    : '';
};

export const getActor = (): string => {
  return getContextString('actor', { required: true });
};

export const getActorUrl = (): string => {
  const { actor, serverUrl } = github.context;
  if (isUndefined(actor) || isUndefined(serverUrl)) {
    throw new Error(
      sprintf(constants.ERROR.UNDEFINED_GITHUB_CONTEXT, 'actor or server URL'),
    );
  }
  return `${serverUrl}/${actor}`;
};

export const getJob = (): string => {
  return getContextString('job', { required: true });
};

export const getRepoUrl = (): string => {
  const {
    repo: { owner, repo },
    serverUrl,
  } = github.context;
  if (isUndefined(owner) || isUndefined(repo) || isUndefined(serverUrl)) {
    throw new Error(sprintf(constants.ERROR.UNDEFINED_GITHUB_CONTEXT, 'repo'));
  }
  return `${serverUrl}/${owner}/${repo}`;
};

export const getCommit = (): string => {
  return getContextString('sha', { required: true });
};

export const getCommitShort = (): string => {
  return `${getCommit().substring(0, 7)}`;
};

export const getCommitUrl = (): string => {
  return `${getRepoUrl()}/commit/${getCommitShort()}`;
};

export const getPRUrl = (): string => {
  const {
    eventName,
    issue: { number },
  } = github.context;
  return eventName === 'pull_request' && number > 0
    ? `${getRepoUrl()}/pull/${number}`
    : '';
};

export const getWorkflow = (): string => {
  return getContextString('workflow', { required: true });
};

export const getWorkflowUrl = (): string => {
  const { runId } = github.context;
  if (isUndefined(runId)) {
    throw new Error(
      sprintf(constants.ERROR.UNDEFINED_GITHUB_CONTEXT, 'run ID'),
    );
  }
  return `${getRepoUrl()}/actions/runs/${runId}`;
};

export default {
  getActor,
  getActorUrl,
  getBranchName,
  getCommit,
  getCommitShort,
  getCommitUrl,
  getEnv,
  getJob,
  getPRUrl,
  getRepoUrl,
  getWorkflow,
  getWorkflowUrl,
};
