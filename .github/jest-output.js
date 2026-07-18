import * as core from '@actions/core';

export default class JestOutput {
  onRunComplete(testContexts, results) {
    core.setOutput('total', results.numTotalTests || 0);
    core.setOutput('passed', results.numPassedTests || 0);
  }
}
