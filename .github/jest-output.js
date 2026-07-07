const core = require('@actions/core');

class JestOutput {
  onRunComplete(testContexts, results) {
    core.setOutput('total', results.numTotalTests || 0);
    core.setOutput('passed', results.numPassedTests || 0);
  }
}

module.exports = JestOutput;
