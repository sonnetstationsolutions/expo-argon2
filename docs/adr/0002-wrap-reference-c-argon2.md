# ADR-0002: Wrap the reference C Argon2, do not hand-roll

**Date:** 2026-06-08
**Status:** Accepted

## Context

The module's entire value is byte-for-byte agreement with the reference Argon2 (and therefore with `hash-wasm` and `@noble/hashes`). Argon2 is standardized (RFC 9106) but fiddly; a hand-written implementation is a large, high-risk surface where a subtle bug would silently produce wrong keys.

## Decision

Wrap a vetted, reference-grade Argon2 on each platform rather than implementing the algorithm:

- **Android:** [`argon2kt`](https://github.com/lambdapioneer/argon2kt) (MIT) — a Kotlin wrapper over the reference C with prebuilt native binaries, returning raw bytes.
- **iOS:** [`Argon2Swift`](https://github.com/tmthecoder/Argon2Swift) (MIT) — a Swift wrapper over the same reference C, returning raw bytes.

Both build on the PHC-winning reference C (`phc-winner-argon2`), so cross-platform agreement is expected by construction — but it is still asserted by the frozen vectors, never assumed.

## Rationale

Reusing the reference C on both platforms makes correctness the default and keeps this package small (glue + marshalling + validation). Both wrappers are permissively licensed (MIT) and expose exactly what a KDF needs: configurable cost parameters and raw byte output.

**Alternatives considered:**
- **Vendor `phc-winner-argon2` directly via NDK/CMake (Android) and the podspec (iOS).** More control, more build surface and maintenance. Kept as a fallback if a wrapper goes unmaintained.
- **libsodium `crypto_pwhash` / swift-sodium.** Argon2id only, heavier dependency than needed.
- **Hand-roll in Kotlin/Swift.** Rejected: unjustifiable correctness risk for a standardized algorithm.

## Consequences

- Small, auditable native glue; correctness inherited from the reference C.
- Two external native dependencies to track for updates and license notices (see `THIRD_PARTY_NOTICES.md`).
- The two type enums differ in raw ordering (iOS `Argon2Type` is `i=0, d=1, id=2`; the JS/native bridge uses `d=0, i=1, id=2`), so `type` is mapped explicitly on each platform rather than passed through as a raw int.

## Note on dependency risk vs. vendoring the C directly

The wrappers have low star counts, which raised the question of vendoring `phc-winner-argon2` directly (NDK/CMake + JNI on Android, C-in-podspec on iOS) so the only trusted source is the canonical reference. We evaluated it and chose to stay on the wrappers for now:

- Both wrappers vendor the **same** reference C, so cryptographic/correctness trust is identical either way. The wrappers are build-system glue, not algorithm.
- The glue is the painful, toolchain-version-sensitive part. `argon2kt` in particular handles prebuilt binaries, the ABI matrix, and **16 KB page alignment**, and is by a reputable author (Daniel Hugenroth, Cambridge).
- The main forcing function for owning the Android build — Android 15's 16 KB page-size requirement — is already handled: **`argon2kt` 1.6.0 ships 16 KB-aligned `.so`** (the version we pin). A CI step verifies this so a regression fails the build.
- Supply-chain risk is mitigated more cheaply by pinning exact versions (done) and, if needed, vendoring the wrapper sources (both MIT, tiny) rather than rewriting the build.

If we ever do vendor the C, the cheapest first step is **iOS only** (Swift↔C interop is first-class, no JNI; it also removes the `Argon2Type` enum-ordering mismatch), keeping `argon2kt` on Android where JNI risk is real.

## Evolution Triggers

- A wrapper becomes unmaintained or incompatible with a future RN/New-Arch version → vendor the reference C directly (start with iOS).
- A pinned `argon2kt` version regresses 16 KB alignment, or a new Android page-size/ABI requirement appears that the wrapper does not address → own the Android NDK build.
