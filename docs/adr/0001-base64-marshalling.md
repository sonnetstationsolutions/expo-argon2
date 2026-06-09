# ADR-0001: Marshal bytes across the bridge as base64

**Date:** 2026-06-08
**Status:** Accepted

## Context

The public API is byte-oriented: `Uint8Array` password and salt in, `Uint8Array` key out. Those bytes have to cross the JS↔native boundary on the Expo Modules API. The Expo Modules API can pass `Uint8Array`/`TypedArray` directly on the New Architecture, but support and edge cases vary across SDK versions, and a silent truncation or copy bug at this layer would corrupt a derived key without any visible error.

## Decision

The native boundary accepts and returns **standard base64 strings**. The TypeScript wrapper converts `Uint8Array → base64` on the way in and `base64 → Uint8Array` on the way out. The **public API stays `Uint8Array`** — base64 is an internal detail.

The codec is a dependency-free implementation in `src/base64.ts`, unit-tested for parity with Node's `Buffer` and for round-trip stability. Native sides use platform base64: `android.util.Base64` (`NO_WRAP`) and Swift `Data(base64Encoded:)` / `base64EncodedString()`.

## Rationale

Base64 is the conservative, robust choice. The payloads are tiny (a short password, a 16-byte salt, a 32-byte key), so the encoding overhead is irrelevant, and base64 behaves identically across every SDK version. A dependency-free codec keeps the package's runtime dependencies at zero and avoids relying on Hermes-version-specific `atob`/`btoa`.

**Alternatives considered:**
- **Pass `Uint8Array` directly (Path A).** Cleaner in principle, but it puts correctness at the mercy of typed-array bridge behavior we cannot pin across SDK versions, and a regression there is invisible. Revisit if a future SDK guarantees it and we can assert byte fidelity in CI.
- **Pull in a base64 npm package.** Unnecessary runtime dependency for ~40 lines of well-tested code.

## Consequences

- Zero runtime dependencies; robust across SDK versions.
- One extra encode/decode per call (negligible for these payload sizes).
- The codec is correctness-critical, so it has its own unit tests and must keep `Buffer` parity.

## Evolution Triggers

- A future Expo SDK guarantees clean `Uint8Array` marshalling and we can assert byte fidelity on-device in CI → consider Path A.
