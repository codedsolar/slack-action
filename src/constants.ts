export const constants = {
  ERROR: {
    ALREADY_RUNNING: 'Slack app is already running',
    CHANNEL_NOT_FOUND: 'Slack channel not found',
    INIT_FAILURE: 'Failed to initialize Slack app',
    INPUT_FAILURE: 'Failed to initialize inputs',
    NOT_RUNNING: 'Slack app is not running',
    START_FAILURE: 'Failed to start Slack app',
    TOKEN_NOT_FOUND:
      'Slack app token or signing secret not found. Did you forget to set SLACK_SIGNING_SECRET and/or SLACK_TOKEN environment variables?',
    UNDEFINED_GITHUB_CONTEXT: 'GitHub %s context is undefined',
  },
} as const;

export default constants;
