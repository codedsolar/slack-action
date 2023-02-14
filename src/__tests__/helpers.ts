import * as github from '@actions/github';

export const mockContext = (values: Object) => {
  beforeEach(() => {
    Object.keys(values).forEach((key) => {
      github.context[key] = values[key];
    });
  });
};

export const mockRepoContext = (
  serverUrl: string = 'https://github.com',
  owner: string = 'user',
  repo: string = 'repository',
) => {
  beforeEach(() => {
    github.context.serverUrl = serverUrl;
    jest.spyOn(github.context, 'repo', 'get').mockImplementation(() => {
      return { owner, repo };
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });
};

export const mockEmptyRepoContext = () => mockRepoContext('', '', '');

export const setInput = (value: string, name: string = 'test') => {
  process.env[`INPUT_${name.toUpperCase()}`] = value;
};
