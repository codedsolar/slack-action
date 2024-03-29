# slack-action

[![Codecov]](https://codecov.io/gh/codedsolar/slack-action)
[![Code Climate]](https://codeclimate.com/github/codedsolar/slack-action)
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

- `channels:read`
- `chat:write`
- `chat:write.public`

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

build:
  runs-on: ubuntu-latest
  steps:
    - name: Check out
      uses: actions/checkout@v3
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

## Customize

- [Inputs](#inputs)
- [Outputs](#outputs)

### Inputs

Following inputs can be used as `step.with` keys:

| Name                       | Type   |
| -------------------------- | ------ |
| `color`                    | String |
| `fields`                   | List   |
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
[code climate]: https://img.shields.io/codeclimate/maintainability/codedsolar/slack-action?logo=codeclimate
[codecov]: https://img.shields.io/codecov/c/github/codedsolar/slack-action?logo=codecov
[github actions]: https://github.com/features/actions
[libraries.io]: https://img.shields.io/librariesio/github/codedsolar/slack-action?logo=librariesdotio
[prettier]: https://prettier.io/
[slack api apps]: https://api.slack.com/apps/
[slack]: https://slack.com/
