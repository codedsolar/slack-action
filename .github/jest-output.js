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

module.exports = class JestOutput {
  async onRunComplete(testContexts, results) {
    await getCore();
    core.setOutput('total', results.numTotalTests || 0);
    core.setOutput('passed', results.numPassedTests || 0);
  }
};
