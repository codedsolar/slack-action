export const constants = {
  ERROR: {
    ALREADY_RUNNING: 'Slack app is already running',
    CHANNEL_NOT_FOUND: 'Slack channel not found',
    INIT_FAILURE: 'Failed to initialize Slack app',
    NOT_RUNNING: 'Slack app is not running',
    PORT_IS_ALREADY_IN_USE: 'Port %d is already in use',
    TOKEN_NOT_FOUND:
      'Slack app token or signing secret not found. Did you forget to set SLACK_SIGNING_SECRET and/or SLACK_TOKEN environment variables?',
    UNDEFINED_GITHUB_CONTEXT: 'GitHub %s context is undefined',
    UNDEFINED_MESSAGE_TIMESTAMP: 'Slack message timestamp is undefined',
  },
} as const;

export default constants;
