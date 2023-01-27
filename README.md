# slack-action

[![Codecov]](https://codecov.io/gh/codedsolar/slack-action)
[![Code Climate]](https://codeclimate.com/github/codedsolar/slack-action)
[![Libraries.io]](https://libraries.io/github/codedsolar/slack-action)

## Overview

- [Options](#options)
- [Usage](#usage)
  - [1. Add your app](#1-add-your-app)
  - [2. Add environment variables](#2-add-environment-variables)
  - [3. Enjoy](#3-enjoy)

This action for [GitHub Actions][] to send and update Slack notifications. Its
main purpose to report the job status:

```yml
- uses: codedsolar/slack-action@main
  with:
    status: ${{ job.status }}
```

![Slack (Default)](readme/slack-success.png 'Slack (Default)')

However, it can be customized to match your specific needs:

```yml
- uses: codedsolar/slack-action@main
  with:
    fields: |
      Status: Building...
      {REF}
      ESLint issues: Checking...
      Prettier issues: Checking...
    status: in-progress
```

![Slack (Custom)](readme/slack-custom.png 'Slack (Custom)')

## Options

```yml
- uses: codedsolar/slack-action@main
  with:
    # Custom attachment color in HEX format.
    # By default, it's based on the "status" input:
    #
    #   - in-progress: #dcad04
    #   - success: #24a943
    #   - failure: #cc1f2d
    #   - cancelled: #1f242b
    #   - skipped: #1f242b
    #
    # Default: ''
    #
    # Example: '#1f242b'
    color: ''

    # Custom fields in multiline format.
    # Each field must match: "<your name>: <your value>".
    # Supported keywords:
    #
    #   - {REF}
    #   - {STATUS}
    #
    # Default: |
    #   {STATUS}
    #   {REF}
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
    # Default: 'false'
    #
    # Example: 'true'
    ignore-failures: 'false'

    # When the previous message to update is not found, a new one will be posted instead.
    #
    # Default: 'true'
    #
    # Example: 'false'
    ignore-message-not-found: 'true'

    # Status: in-progress|success|failure|cancelled|skipped.
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
    # Default: 'unknown'
    #
    # Example: 'in-progress'
    status: 'unknown'

    # Custom message text.
    # Supported keywords:
    #
    #   - {GITHUB_ACTOR}
    #   - {GITHUB_JOB}
    #   - {GITHUB_REF}
    #
    # Default: 'GitHub Actions {GITHUB_JOB} job in {GITHUB_REF} by {GITHUB_ACTOR}'
    #
    # Example: 'Hello World!'
    text: 'GitHub Actions {GITHUB_JOB} job in {GITHUB_REF} by {GITHUB_ACTOR}'

    # Timestamp in Slack UNIX format of the previous message to update.
    # Use-case: update an already posted message from the previous step based on the "slack-timestamp" output.
    #
    # Default: ''
    #
    # Example: ${{ steps.<step id>.outputs.slack-timestamp }}
    timestamp: ''
  env:
    # Slack channel for sending a notification to
    SLACK_CHANNEL: ${{ secrets.SLACK_CHANNEL }}

    # Slack app signing secret
    SLACK_SIGNING_SECRET: ${{ secrets.SLACK_SIGNING_SECRET }}

    # Slack app token
    SLACK_TOKEN: ${{ secrets.SLACK_TOKEN }}
```

## Usage

- [1. Add your app](#1-add-your-app)
- [2. Add environment variables](#2-add-environment-variables)
- [3. Enjoy](#3-enjoy)

### 1. Add your app

Go to your [Slack API Apps][] and create/change your own bot. It's pretty
straightforward and the only thing that you need to know is setting the minimum
required "Bot Token Scopes" in "OAuth & Permissions":

- `channels:read`
- `chat:write`
- `chat:write.public`

![Slack (Bot Token Scopes)](readme/slack-bot-token-scopes.png 'Slack (Bot Token Scopes)')

### 2. Add environment variables

Add the following environment variables:

- `SLACK_CHANNEL`
- `SLACK_SIGNING_SECRET`
- `SLACK_TOKEN`

For example:

```yml
- uses: codedsolar/slack-action@main
  env:
    SLACK_CHANNEL: ${{ secrets.SLACK_CHANNEL }} # required
    SLACK_SIGNING_SECRET: ${{ secrets.SLACK_SIGNING_SECRET }} # required
    SLACK_TOKEN: ${{ secrets.SLACK_TOKEN }} # required
```

### 3. Enjoy

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
      uses: actions/checkout@v2
    # ...
    - name: Post Slack message
      uses: codedsolar/slack-action@main
      id: post
      with:
        status: in-progress
    # ...
    - name: Update Slack message
      uses: codedsolar/slack-action@main
      with:
        timestamp: ${{ steps.post.outputs.slack-timestamp }}
```

The "Post Slack message" step:

![Slack (In Progress)](readme/slack-in-progress.png 'Slack (In Progress)')

The "Update Slack message" step will update the previous message:

![Slack (Success)](readme/slack-success.png 'Slack (Success)')

## License

Released under the [MIT License](https://opensource.org/licenses/MIT).

[action.yml]: action.yml
[code climate]: https://img.shields.io/codeclimate/maintainability/codedsolar/slack-action
[codecov]: https://img.shields.io/codecov/c/github/codedsolar/slack-action
[github actions]: https://github.com/features/actions
[libraries.io]: https://img.shields.io/librariesio/github/codedsolar/slack-action
[prettier]: https://prettier.io/
[slack api apps]: https://api.slack.com/apps/
[slack]: https://slack.com/
