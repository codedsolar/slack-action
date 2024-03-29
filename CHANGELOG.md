# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.2.0] - 2024-03-11

### Added

- Add support for non-Linux platforms

### Changed

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

[unreleased]: https://github.com/codedsolar/slack-action/compare/v1.2.0...HEAD
[1.2.0]: https://github.com/codedsolar/slack-action/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/codedsolar/slack-action/compare/v1.0.0...v1.1.0
[docker]: https://www.docker.com/
