import * as core from '@actions/core';

export interface Input {
  color: string;
  fields: string[];
  ignoreFailures: boolean;
  ignoreMessageNotFound: boolean;
  status: string;
  text: string;
  timestamp: string;
}

const getHEXColor = (name: string): string => {
  const value = core.getInput(name);
  if (value.length === 0) {
    return '';
  }
  if (/^#[\dA-F]{6}$/i.test(value)) {
    return value;
  }
  throw new Error(`Invalid ${name} input value. Should be a valid HEX color`);
};

function getStatus(name: string): string {
  const value = core.getInput(name);
  if (value.length === 0) {
    return '';
  }
  if (
    value === 'in-progress' ||
    value === 'success' ||
    value === 'failure' ||
    value === 'cancelled' ||
    value === 'skipped'
  ) {
    return value;
  }
  throw new Error(
    `Invalid ${name} input value. Should be: in-progress|success|failure|cancelled|skipped`,
  );
}

const getText = (name: string): string => {
  const value = core.getInput(name);
  if (value.length > 0) {
    return value;
  }
  throw new Error(`Invalid ${name} input value. Shouldn't be an empty string`);
};

const getTimestamp = (name: string): string => {
  const value = core.getInput(name);
  if (value.length === 0 || new Date(parseFloat(value)).getTime() > 0) {
    return value;
  }
  throw new Error(
    `Invalid ${name} input value. Should be a valid UNIX timestamp`,
  );
};

export async function get(): Promise<Input> {
  try {
    const input: Input = <Input>{};
    input.color = getHEXColor('color');
    input.fields = core.getMultilineInput('fields');
    input.ignoreFailures = core.getBooleanInput('ignore-failures');
    input.ignoreMessageNotFound = core.getBooleanInput(
      'ignore-message-not-found',
    );
    input.status = getStatus('status');
    input.text = getText('text');
    input.timestamp = getTimestamp('timestamp');
    return input;
  } catch (error) {
    return Promise.reject(error);
  }
}
