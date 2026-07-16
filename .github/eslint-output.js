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

module.exports = async (results) => {
  await getCore();
  const summary = results.reduce(
    (result, value) => ({
      ...result,
      errors: result.errors + value.errorCount,
      warnings: result.warnings + value.warningCount,
    }),
    { errors: 0, warnings: 0 },
  );
  core.setOutput('issues', summary.errors + summary.warnings || 0);
};
