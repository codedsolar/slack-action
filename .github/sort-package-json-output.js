const { promisify } = require('util');
const exec = promisify(require('child_process').exec);

let core;
async function getCore() {
  if (core) return core;
  try {
    core = require('@actions/core');
  } catch {
    core = await import('@actions/core');
  }
  return core;
}

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

(async () => {
  await getCore();
  run().then((result) => {
    core.setOutput('issues', result.total);
  });
})();
