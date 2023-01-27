const core = require('@actions/core');

class JestCiReporter {
  // eslint-disable-next-line class-methods-use-this
  onRunComplete(testContexts, results) {
    core.setOutput('total', results.numTotalTests || 0);
    core.setOutput('passed', results.numPassedTests || 0);
  }
}

module.exports = JestCiReporter;
