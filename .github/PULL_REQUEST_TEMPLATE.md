<!-- Thanks for contributing. Keep PRs focused; one concern per PR. -->

## What and why

<!-- What does this change and why? Link any related issue. -->

## Correctness

<!-- Argon2 output must stay byte-for-byte identical for fixed inputs. -->

- [ ] I did not change any derived output for existing inputs, **or** I updated `vectors/vectors.json` via `npm run vectors:generate` and explained why in this PR.
- [ ] `npm run lint`, `npx tsc --noEmit`, and `npm test` pass locally.
- [ ] If I touched native code, I built the example app on the affected platform(s).

## Notes for reviewers

<!-- Anything non-obvious: marshalling, threading, platform quirks. -->
