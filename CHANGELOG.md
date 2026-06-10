# Changelog

All notable changes to this project are documented here. This project adheres to [Semantic Versioning](https://semver.org/). Any change that could alter Argon2 output bytes for fixed inputs is treated as a breaking change.

## [Unreleased]

## [0.1.0] - 2026-06-08

Initial release.

### Added

- `argon2id(params)` and `hashRaw(params)` returning raw `Uint8Array` keys, computed off the JS thread.
- Argon2id / Argon2i / Argon2d, with caller-controlled `memory`, `iterations`, `parallelism`, `hashLength`, `type`, and `version` (0x10 / 0x13).
- Android implementation via [argon2kt](https://github.com/lambdapioneer/argon2kt); iOS implementation via [Argon2Swift](https://github.com/tmthecoder/Argon2Swift).
- Frozen test vectors (`vectors/vectors.json`) generated and cross-checked against `@noble/hashes` and `hash-wasm`, enforced in CI.
- Typed `Argon2Error` with stable `code`s.
- Example app with an on-device frozen-vector check.

## [0.1.1] - 2026-06-08

- First NPM CI release to validate CI and trusted publishing

[Unreleased]: https://github.com/SonnetStationSolutions/expo-argon2/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/SonnetStationSolutions/expo-argon2/releases/tag/v0.1.0
[0.1.1]: https://github.com/SonnetStationSolutions/expo-argon2/releases/tag/v0.1.1
