import * as github from '@actions/github';

export const mockContext = (values: any) => {
  beforeEach(() => {
    const map = new Map<string, string>(values);
    map.forEach((value, key) => {
      github.context[key] = value;
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
