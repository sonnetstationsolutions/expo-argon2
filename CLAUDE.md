# expo-argon2

## What This Is

A public, open-source Expo native module exposing Argon2id/Argon2i/Argon2d to React Native, off the JS thread, returning raw `Uint8Array` keys. Its reason to exist is **byte-for-byte agreement** with the reference Argon2 (and `hash-wasm` / `@noble/hashes`). Repo lives under the `SonnetStationSolutions` GitHub org; published to npm as `@sonnetstationsolutions/expo-argon2`.

## Stack

| Layer | Choice | Notes |
|---|---|---|
| Module API | Expo Modules API | New Architecture compatible by construction |
| Language | TypeScript + Kotlin + Swift | |
| Android native | [argon2kt](https://github.com/lambdapioneer/argon2kt) 1.6.0 | wraps reference C |
| iOS native | [Argon2Swift](https://github.com/tmthecoder/Argon2Swift) ~1.0.4 | wraps reference C |
| Marshalling | base64 strings across the bridge | public API stays `Uint8Array` — see ADR-0001 |
| Tests | jest (babel-jest, node env) + Node vector generator | NOT jest-expo for logic — see lesson 0001 |
| Build/publish | expo-module-scripts; npm via tag-triggered CI | |

## Architecture

- **Data flow:** `argon2id`/`hashRaw` (TS) → validate → base64-encode → `ExpoArgon2Module.hashRaw` (native, off-thread) → reference C → base64 → decode to `Uint8Array`.
- **Off-thread:** the Expo `AsyncFunction` dispatches off the JS thread on both platforms; no manual threading.
- **Type mapping:** the JS `Argon2Type` (`d=0,i=1,id=2`) is mapped explicitly per platform (iOS `Argon2Type` raw values differ). Never pass the raw int through. See ADR-0002.
- **No backend, no network, no file I/O, no logging of inputs/outputs.**

## File Structure

```
src/
  index.ts                 # public API: hashRaw, argon2id, validation, error mapping
  base64.ts                # dependency-free standard base64 (correctness-critical)
  ExpoArgon2.types.ts      # Argon2Type, Argon2Params, Argon2Error, NativeArgon2Args
  ExpoArgon2Module.ts      # requireNativeModule accessor
  ExpoArgon2Module.web.ts  # web stub: throws ERR_ARGON2_UNSUPPORTED_PLATFORM
  __tests__/               # base64 + vectors (pure logic; excluded from build)
android/                   # Kotlin Module + argon2kt
ios/                       # Swift Module + Argon2Swift
example/                   # runnable app; on-device frozen-vector check
scripts/generate-vectors.mjs  # authoritative vector generator + cross-impl checker
vectors/vectors.json       # frozen vectors (generated; do not hand-edit)
docs/adr, docs/lessons     # project decisions and learnings
```

## Key Conventions

- **The frozen vector is law.** `argon2id("ABCD2345", 16×0x07, m=65536, t=3, p=1, len=32)` MUST equal `7d0e2bc7e36bfc948fe53381065a22857b5a4612ef6770ce16719e8f04f8b53d`. Any change to derived output for fixed inputs is breaking.
- **Vectors are generated, never hand-typed.** `npm run vectors:generate`; CI runs `npm run vectors:check`.
- **Raw bytes only.** Never accept/return strings on the public API; never UTF-8 round-trip a salt.
- **Errors** are `Argon2Error` with a stable `code` (mirrored as native `CodedException`/`GenericException`).

## What NOT To Do

- Do not hand-roll Argon2; wrap the reference C.
- Do not add a web implementation in v1; the stub throwing is intentional.
- Do not use the `jest-expo` preset for pure-logic tests (lesson 0001).
- Do not commit secrets — public repo. Do not commit `build/`, `node_modules/`, or the example's generated `ios/`/`android/`.

## Workflow

**Verify:** `npm run lint && npx tsc --noEmit && npm test && npm run vectors:check && npm run build`
Native changes → also build the example on the affected platform and confirm the on-device green check.
