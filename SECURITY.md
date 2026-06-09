# Security Policy

## Reporting a vulnerability

Please report security vulnerabilities **privately**, not as a public issue or pull request.

Use GitHub's private vulnerability reporting:
**[Report a vulnerability](https://github.com/SonnetStationSolutions/expo-argon2/security/advisories/new)** (Security tab → Report a vulnerability).

Please include enough detail to reproduce: affected version, platform, parameters, and the observed vs. expected behavior. We will acknowledge the report and work with you on a fix and coordinated disclosure.

## Scope

This module is a key-derivation function. The most security-relevant property is **byte-for-byte correctness** of Argon2 output: an incorrect hash silently breaks any encryption built on it. Reports of output that disagrees with the reference Argon2 / `hash-wasm` / `@noble/hashes` for the same inputs are treated as security issues.

Out of scope:

- **Parameter choices.** The module derives keys but does not pick parameters. Weak parameters (e.g. very low `memory`) are the caller's responsibility.
- **Web.** There is no web implementation; the web entry point throws.

## Supported versions

This project is pre-1.0. Security fixes are released against the latest published version.
