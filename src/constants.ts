export default {
  ERROR: {
    ALREADY_RUNNING: 'Slack app is already running',
    CHANNEL_NOT_FOUND: 'Slack channel not found',
    INIT_FAILURE: 'Failed to initialize Slack app',
    MERGE_REQUIRES_TIMESTAMP:
      'fields-mode "merge" requires a timestamp of the message to update',
    MESSAGE_NOT_FOUND: 'Slack message not found for the given timestamp',
    MISSING_HISTORY_SCOPE:
      'Slack API missing_scope: fields-mode "merge" requires channels:history (or groups:history for private channels)',
    NOT_IN_CHANNEL:
      'Slack API not_in_channel: invite the bot to the channel before using fields-mode "merge"',
    NOT_RUNNING: 'Slack app is not running',
    PORTS_ARE_ALREADY_IN_USE: 'Ports %d-%d are already in use',
    PORT_IS_ALREADY_IN_USE: 'Port %d is already in use',
    TOKEN_NOT_FOUND:
      'Slack app token or signing secret not found. Did you forget to set SLACK_SIGNING_SECRET and/or SLACK_TOKEN environment variables?',
    UNDEFINED_GITHUB_CONTEXT: 'GitHub %s context is undefined',
    UNDEFINED_MESSAGE_TIMESTAMP: 'Slack message timestamp is undefined',
  },
} as const;
