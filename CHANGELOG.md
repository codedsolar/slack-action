# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- Migrate from `@vercel/ncc` to `esbuild`
- Migrate from [Yarn] to [pnpm]

## [1.3.0] - 2026-07-08

### Added

- Add more tests

### Changed

- Bump dependencies
- Improve maintainability
- Increase test coverage from `49%` to `67%`
- Migrate `@actions/core` from `1.10.1` to `2.0.3`
- Migrate `@actions/github` from `6.0.0` to `8.0.1`
- Migrate `@slack/bolt` from `3.17.1` to `4.7.3`
- Refactor some existing code

### Fixed

- Fix audit issues

## [1.2.0] - 2024-03-11

### Added

- Add support for non-Linux platforms

### Changed

- Bump `@actions/core` from `1.10.0` to `1.10.1`
- Bump `@actions/github` from `5.1.1` to `6.0.0`
- Bump `@slack/bolt` from `3.12.2` to `3.17.1`
- Bump `sprintf-js` from `1.1.2` to `1.1.3`
- Bump dependencies
- Move away from [Docker] container to using `node20`
- Refactor some existing code

## [1.1.0] - 2023-02-17

### Added

- Add more tests
- Add support for `port` input
- Add support for `port-retries` input
- Add support for an automatic bumping of unavailable ports

### Changed

- Increase test coverage from `13%` to `49%`
- Refactor some existing code

## 1.0.0 - 2023-01-27

First release.

[unreleased]: https://github.com/codedsolar/slack-action/compare/v1.3.0...HEAD
[1.3.0]: https://github.com/codedsolar/slack-action/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/codedsolar/slack-action/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/codedsolar/slack-action/compare/v1.0.0...v1.1.0
[docker]: https://www.docker.com/
[pnpm]: https://pnpm.io/
[yarn]: https://yarnpkg.com/
