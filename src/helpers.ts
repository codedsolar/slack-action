import * as github from '@actions/github';
import { sprintf } from 'sprintf-js';
import constants from './constants';

const getContextString = (name: string, description: string = ''): string => {
  const value = github.context[name];
  if (value.length === 0) {
    throw new Error(
      sprintf(
        constants.ERROR.UNDEFINED_GITHUB_CONTEXT,
        description.length > 0 ? description : name,
      ),
    );
  }
  return value;
};

export const getEnv = (name: string, isRequired: boolean = false): string => {
  const result = process.env[name] || '';
  if (isRequired && result.length === 0) {
    throw new Error(`Failed to get a required environment variable ${name}`);
  }
  return result;
};

export const getBranchName = (): string => {
  const { ref } = github.context;
  return ref.length > 0 && ref.indexOf('refs/heads/') > -1
    ? ref.slice('refs/heads/'.length)
    : '';
};

export const getActor = (): string => {
  return getContextString('actor');
};

export const getActorUrl = (): string => {
  const { actor, serverUrl } = github.context;
  if (actor.length === 0 || serverUrl.length === 0) {
    throw new Error(
      sprintf(constants.ERROR.UNDEFINED_GITHUB_CONTEXT, 'actor or server URL'),
    );
  }
  return `${serverUrl}/${actor}`;
};

export const getJob = (): string => {
  return getContextString('job');
};

export const getRepoUrl = (): string => {
  const {
    repo: { owner, repo },
    serverUrl,
  } = github.context;
  if (owner.length === 0 || repo.length === 0 || serverUrl.length === 0) {
    throw new Error(sprintf(constants.ERROR.UNDEFINED_GITHUB_CONTEXT, 'repo'));
  }
  return `${serverUrl}/${owner}/${repo}`;
};

export const getCommit = (): string => {
  return getContextString('sha', 'SHA');
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
  return getContextString('workflow');
};

export const getWorkflowUrl = (): string => {
  const { runId } = github.context;
  if (Number.isNaN(runId)) {
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
