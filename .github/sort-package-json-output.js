import { promisify } from 'node:util';
import { exec as execCb } from 'node:child_process';
import * as core from '@actions/core';

const exec = promisify(execCb);

const getNrOfIssues = async () => {
  let result = {};

  try {
    result = await exec(`sort-package-json --check`);
  } catch (error) {
    result.stdout = error.stdout;
  }

  const lines = (result.stdout || '').trim().split(/\r\n|\r|\n/);
  return lines.filter((line) => line.includes('was not sorted')).length;
};

const run = async () => ({
  total: (await getNrOfIssues()) || 0,
});

run().then((result) => {
  core.setOutput('issues', result.total);
});
