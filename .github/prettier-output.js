import { promisify } from 'node:util';
import { exec as execCb } from 'node:child_process';
import * as core from '@actions/core';

const exec = promisify(execCb);

const getNrOfIssues = async () => {
  let result = {};

  try {
    result = await exec(`prettier --check .`);
  } catch (error) {
    result.stderr = error.stderr;
  }

  if (result.stderr.length > 0) {
    return result.stderr.trim().split(/\r\n|\r|\n/).length - 1;
  }

  return 0;
};

const run = async () => ({
  total: (await getNrOfIssues()) || 0,
});

run().then((result) => {
  core.setOutput('issues', result.total);
});
