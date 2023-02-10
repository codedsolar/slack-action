import * as github from '@actions/github';

const originalContext = github.context;
const originalEnv = process.env;

beforeEach(() => {
  process.env = { ...originalEnv };
});

afterEach(() => {
  const contexts = ['actor', 'eventName', 'job', 'runId', 'serverUrl', 'sha'];
  contexts.forEach((context) => {
    github.context[context] = originalContext[context];
  });
  process.env = originalEnv;
});
