# Contributing to expo-argon2

Thanks for your interest. This is a small, focused library: a correct, off-thread Argon2 for Expo. Contributions that keep it small and correct are very welcome.

## The one hard rule

**Argon2 output must stay byte-for-byte identical for fixed inputs.** A change that alters the derived key for existing parameters is a breaking change to every downstream consumer and will silently corrupt their encrypted data. If you have a reason to change derived output, say so explicitly in the PR and regenerate the vectors (below).

## Setup

```sh
git clone https://github.com/sonnetstationsolutions/expo-argon2.git
cd expo-argon2
npm install
```

## Develop and verify

```sh
npm run lint          # eslint
npx tsc --noEmit      # typecheck the library
npm test              # pure-logic unit tests (base64, vectors)
npm run vectors:check # cross-check the frozen vectors against @noble + hash-wasm
npm run build         # compile to build/
```

All of the above run in CI on every pull request and must pass.

### Test vectors

`vectors/vectors.json` is generated, not hand-edited. `scripts/generate-vectors.mjs` derives every entry with both `@noble/hashes` and `hash-wasm`, asserts they agree, and pins the frozen reference vector. If you intentionally change the matrix:

```sh
npm run vectors:generate
```

and commit the updated `vectors/vectors.json` with an explanation.

### Native changes

If you touch `android/` or `ios/`, build the example app on the affected platform and confirm the example's frozen-vector check still shows green:

```sh
cd example
npx expo run:android   # or: npx expo run:ios  (macOS only)
```

iOS requires a Mac with Xcode. Android requires the Android SDK and a JDK.

## Pull requests

- One concern per PR. Keep diffs focused.
- Match the existing code style (Prettier + the repo ESLint config).
- Update the README and `CHANGELOG.md` when behavior or the public API changes.
- Fill out the PR checklist.

## Releasing

Maintainers: the versioning policy (driven by the byte-compatibility rule above) and the step-by-step release process live in [RELEASING.md](RELEASING.md).

## Reporting bugs and security issues

Functional bugs go in [GitHub issues](https://github.com/sonnetstationsolutions/expo-argon2/issues). **Security vulnerabilities must not** be filed as public issues — see [SECURITY.md](SECURITY.md).

By contributing, you agree your contributions are licensed under the project's [MIT License](LICENSE).
