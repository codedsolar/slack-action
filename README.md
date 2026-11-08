# slack-action

[![Codecov]](https://codecov.io/gh/codedsolar/slack-action)
[![Qlty]](https://qlty.sh/gh/codedsolar/projects/slack-action)
[![Libraries.io]](https://libraries.io/github/codedsolar/slack-action)

## Overview

- [Usage](#usage)
  - [Step 1/3. Add your app](#step-13-add-your-app)
  - [Step 2/3. Add environment variables](#step-23-add-environment-variables)
  - [Step 3/3. Enjoy](#step-33-enjoy)
- [Customize](#customize)
  - [Inputs](#inputs)
  - [Outputs](#outputs)

This action is designed for [GitHub Actions] to send and update Slack
notifications. Its main purpose is to report the job status:

```yml
- uses: codedsolar/slack-action@v1
  with:
    status: ${{ job.status }}
  env:
    SLACK_CHANNEL: ${{ secrets.SLACK_CHANNEL }}
    SLACK_SIGNING_SECRET: ${{ secrets.SLACK_SIGNING_SECRET }}
    SLACK_TOKEN: ${{ secrets.SLACK_TOKEN }}
```

![Slack (Default)](readme/slack-success.png 'Slack (Default)')

However, it can be customized to match your specific needs:

```yml
- uses: codedsolar/slack-action@v1
  with:
    fields: |
      Status: Building...
      {REF}
      ESLint issues: Checking...
      Prettier issues: Checking...
    status: in-progress
  env:
    SLACK_CHANNEL: ${{ secrets.SLACK_CHANNEL }}
    SLACK_SIGNING_SECRET: ${{ secrets.SLACK_SIGNING_SECRET }}
    SLACK_TOKEN: ${{ secrets.SLACK_TOKEN }}
```

![Slack (Custom)](readme/slack-custom.png 'Slack (Custom)')

## Usage

- [Step 1/3. Add your app](#step-13-add-your-app)
- [Step 2/3. Add environment variables](#step-23-add-environment-variables)
- [Step 3/3. Enjoy](#step-33-enjoy)

### Step 1/3. Add your app

Go to your [Slack API Apps] and create/change your own bot. It's pretty
straightforward and the only thing that you need to know is setting the minimum
required "Bot Token Scopes" in "OAuth & Permissions":

- `channels:history` (required for `fields-mode: merge`)
- `channels:read`
- `chat:write`
- `chat:write.public`
- `groups:history` (required for `fields-mode: merge` on private channels)

![Slack (Bot Token Scopes)](readme/slack-bot-token-scopes.png 'Slack (Bot Token Scopes)')

### Step 2/3. Add environment variables

Add the following environment variables:

- `SLACK_CHANNEL`
- `SLACK_SIGNING_SECRET`
- `SLACK_TOKEN`

For example:

```yml
- uses: codedsolar/slack-action@v1
  env:
    SLACK_CHANNEL: ${{ secrets.SLACK_CHANNEL }} # required
    SLACK_SIGNING_SECRET: ${{ secrets.SLACK_SIGNING_SECRET }} # required
    SLACK_TOKEN: ${{ secrets.SLACK_TOKEN }} # required
```

### Step 3/3. Enjoy

```yml
name: CI

on:
  push:
    branches:
      - develop
      - main

env:
  SLACK_CHANNEL: ${{ secrets.SLACK_CHANNEL }} # required
  SLACK_SIGNING_SECRET: ${{ secrets.SLACK_SIGNING_SECRET }} # required
  SLACK_TOKEN: ${{ secrets.SLACK_TOKEN }} # required

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Check out
        uses: actions/checkout@v7
      # ...
      - name: Post Slack message
        uses: codedsolar/slack-action@v1
        id: post
        with:
          status: in-progress
      # ...
      - name: Update Slack message
        uses: codedsolar/slack-action@v1
        with:
          timestamp: ${{ steps.post.outputs.slack-timestamp }}
```

The "Post Slack message" step:

![Slack (In Progress)](readme/slack-in-progress.png 'Slack (In Progress)')

The "Update Slack message" step will update the previous message:

![Slack (Success)](readme/slack-success.png 'Slack (Success)')

### Across jobs

Expose `slack-timestamp` as a job output, then pass it into later jobs:

```yml
jobs:
  notify:
    runs-on: ubuntu-latest
    outputs:
      slack-timestamp: ${{ steps.slack.outputs.slack-timestamp }}
    steps:
      - id: slack
        uses: codedsolar/slack-action@v1
        with:
          status: in-progress

  build:
    needs: notify
    runs-on: ubuntu-latest
    steps:
      - uses: codedsolar/slack-action@v1
        with:
          fields: |
            {STATUS}
            {REF}
            Build: Done
          status: ${{ job.status }}
          timestamp: ${{ needs.notify.outputs.slack-timestamp }}
```

### Merge fields on update

By default, updates **replace** the full field list. Set `fields-mode: merge` to
keep existing fields and overlay only the ones you pass (matched by field name):

```yml
- uses: codedsolar/slack-action@v1
  with:
    fields: |
      ESLint issues: 0
    fields-mode: merge
    timestamp: ${{ steps.slack.outputs.slack-timestamp }}
```

Merge mode reads the live Slack message (`channels:history`), preserves its
text, and requires `timestamp`. Attachment color follows `status` / `color` by
default. Set `preserve-color: true` to keep the existing attachment color unless
you set `color`. The bot must already be a member of the channel.

## Customize

- [Inputs](#inputs)
- [Outputs](#outputs)

### Inputs

Following inputs can be used as `step.with` keys:

| Name                       | Type   |
| -------------------------- | ------ |
| `color`                    | String |
| `fields`                   | List   |
| `fields-mode`              | String |
| `preserve-color`           | Bool   |
| `ignore-failures`          | Bool   |
| `ignore-message-not-found` | Bool   |
| `port`                     | Number |
| `port-retries`             | Number |
| `status`                   | String |
| `text`                     | String |
| `timestamp`                | String |

```yml
# Attachment color in HEX format.
# By default, it's based on the "status" input:
#
#   - in-progress: #dcad04
#   - success: #24a943
#   - failure: #cc1f2d
#   - cancelled: #1f242b
#   - skipped: #1f242b
#
# Example: '#1f242b'
color: ''

# Fields in the multiline format.
# Each field must match: "<your name>: <your value>".
# Supported keywords:
#
#   - {REF}
#   - {STATUS}
#
# Example: |
#   Status: Linting...
#   {REF}
#   ESLint issues: Checking...
#   Prettier issues: Checking...
fields: |
  {STATUS}
  {REF}

# How to apply fields when updating: replace|merge.
# The "merge" keeps existing fields and overlays by name (requires timestamp).
#
# Example: 'merge'
fields-mode: 'replace'

# When fields-mode is merge, keep the existing attachment color unless color is set.
#
# Example: 'true'
preserve-color: 'false'

# When the action exits it will be with an exit code of 0.
#
# Example: 'true'
ignore-failures: 'false'

# When the previous message to update isn't found, a new one will be posted instead.
#
# Example: 'false'
ignore-message-not-found: 'true'

# Port on which to run the Slack application.
#
# Example: '3001'
port: '3000'

# Port retries number for an automatic bumping of unavailable ports.
#
# Example: '5'
port-retries: '3'

# Status: unknown|in-progress|success|failure|cancelled|skipped.
# Respects:
#
#   - job.status
#   - steps.<step id>.conclusion
#   - steps.<step id>.outcome
#
# See:
#
#   - https://docs.github.com/en/actions/learn-github-actions/contexts#job-context
#   - https://docs.github.com/en/actions/learn-github-actions/contexts#steps-context
#
# Example: 'in-progress'
status: 'unknown'

# Message text.
# Supported keywords:
#
#   - {GITHUB_ACTOR}
#   - {GITHUB_JOB}
#   - {GITHUB_REF}
#
# Example: 'Hello World!'
text: 'GitHub Actions {GITHUB_JOB} job in {GITHUB_REF} by {GITHUB_ACTOR}'

# Timestamp in Slack UNIX format of the previous message to update.
# Use-case: update an already posted message from the previous step based on the "slack-timestamp" output.
#
# Example: ${{ steps.<step id>.outputs.slack-timestamp }}
timestamp: ''
```

### Outputs

Following outputs are available:

| Name              | Type   |
| ----------------- | ------ |
| `slack-timestamp` | String |

```yml
# Previous Slack message timestamp
# Use-case: use to update an already posted message by using this value as the "timestamp" input value.
slack-timestamp: ''
```

## License

Released under the [MIT License](https://opensource.org/licenses/MIT).

[action.yml]: action.yml
[codecov]: https://img.shields.io/codecov/c/github/codedsolar/slack-action?logo=codecov
[github actions]: https://github.com/features/actions
[libraries.io]: https://img.shields.io/librariesio/github/codedsolar/slack-action?logo=librariesdotio
[prettier]: https://prettier.io/
[qlty]: https://qlty.sh/gh/codedsolar/projects/slack-action/maintainability.svg
[slack api apps]: https://api.slack.com/apps/
[slack]: https://slack.com/
