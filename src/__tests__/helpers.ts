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
  mockContext({
    ref: 'refs/heads/develop',
    sha: '0bf2c9eb66d0a76fcd90b93e66074876ebc4405a',
    serverUrl,
  });

  beforeEach(() => {
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
