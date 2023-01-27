class JestReporter {
  onRunComplete(testContexts, results) {
    console.log(`::set-output name=total::${results.numTotalTests || 0}`);
    console.log(`::set-output name=passed::${results.numPassedTests || 0}`);
  }
}

module.exports = JestReporter;
