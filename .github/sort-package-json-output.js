const core = require('@actions/core');
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);

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
