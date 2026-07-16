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

(async () => {
  await getCore();
  run().then((result) => {
    core.setOutput('issues', result.total);
  });
})();
