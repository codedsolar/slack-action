import * as github from '@actions/github';

const originalContext = github.context;
const originalEnv = process.env;

beforeEach(() => {
  process.env = { ...originalEnv };
});

afterEach(() => {
  const contexts = ['actor', 'job', 'serverUrl', 'sha'];
  contexts.forEach((context) => {
    github.context[context] = originalContext[context];
  });
  process.env = originalEnv;
});
