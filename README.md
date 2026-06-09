# expo-argon2

Native **Argon2id** (and Argon2i / Argon2d) for Expo and React Native.

- Runs **off the JS thread** — the memory-hard hash never blocks the UI.
- **Raw bytes in, raw bytes out** (`Uint8Array`) — built for key derivation, not credential storage.
- **Byte-for-byte identical** to the reference Argon2, and therefore to [`hash-wasm`](https://github.com/Daninet/hash-wasm) and [`@noble/hashes`](https://github.com/paulmillr/noble-hashes), verified against frozen vectors in CI.
- **New Architecture** (Fabric / TurboModules) compatible via the Expo Modules API, autolinked through CNG — no manual native edits, no config plugin.
- iOS and Android. Wraps the reference C Argon2 on both platforms ([argon2kt](https://github.com/lambdapioneer/argon2kt) on Android, [Argon2Swift](https://github.com/tmthecoder/Argon2Swift) on iOS).

> Built because the existing React Native Argon2 packages predate the New Architecture and Expo. If you need Argon2 in a modern Expo app, this is meant to be the boring, correct option.

## Install

```sh
npx expo install @sonnetstationsolutions/expo-argon2
```

This module contains native code, so it does **not** run in Expo Go. Use a [development build](https://docs.expo.dev/develop/development-builds/introduction/) (`npx expo run:ios` / `npx expo run:android`, or an EAS build).

**Supported:** Expo SDK 56 / React Native 0.85 (New Architecture) and newer. iOS 16.4+, Android 7.0+ (API 24+).

## Usage

```ts
import { argon2id } from '@sonnetstationsolutions/expo-argon2';

// You provide raw bytes. Normalize and UTF-8-encode any text yourself first.
const password = new TextEncoder().encode('correct horse battery staple');
const salt = crypto.getRandomValues(new Uint8Array(16));

const key = await argon2id({
  password,        // Uint8Array
  salt,            // Uint8Array, >= 8 bytes
  memory: 65536,   // KiB (64 MiB)
  iterations: 3,
  parallelism: 1,
  hashLength: 32,  // bytes (e.g. an AES-256 key)
});
// key is a 32-byte Uint8Array
```

For Argon2i / Argon2d, use `hashRaw` with an explicit `type`:

```ts
import { hashRaw, Argon2Type } from '@sonnetstationsolutions/expo-argon2';

const key = await hashRaw({
  password,
  salt,
  memory: 65536,
  iterations: 3,
  parallelism: 1,
  hashLength: 32,
  type: Argon2Type.Argon2i,
});
```

## API

```ts
function argon2id(params: Omit<Argon2Params, 'type'>): Promise<Uint8Array>;
function hashRaw(params: Argon2Params): Promise<Uint8Array>;

interface Argon2Params {
  password: Uint8Array;   // caller normalizes + UTF-8 encodes; may be empty
  salt: Uint8Array;       // >= 8 bytes
  memory: number;         // KiB, > 0
  iterations: number;     // > 0
  parallelism: number;    // > 0
  hashLength: number;     // bytes, >= 4
  type?: Argon2Type;      // default Argon2id
  version?: number;       // default 0x13 (19); 0x10 also supported
}

enum Argon2Type { Argon2d = 0, Argon2i = 1, Argon2id = 2 }
```

Both functions run off the JS thread and resolve to exactly `hashLength` bytes. Inputs are treated as read-only.

### Why raw bytes?

The caller owns encoding. A binary salt round-trips exactly (no UTF-8 mangling, no truncation at a NUL byte), so the derived key is byte-identical to what a browser computes with `hash-wasm` for the same inputs. That makes this safe to use as one half of a cross-platform encryption scheme.

## Errors

Rejections are an `Argon2Error` with a stable `code`:

| `code` | When |
|---|---|
| `ERR_ARGON2_INVALID_PARAMS` | `salt < 8` bytes, `hashLength < 4`, or non-positive `memory` / `iterations` / `parallelism`. |
| `ERR_ARGON2_UNSUPPORTED_TYPE` | `type` is not 0, 1, or 2. |
| `ERR_ARGON2_UNSUPPORTED_VERSION` | `version` is not `0x10` or `0x13`. |
| `ERR_ARGON2_HASH_FAILED` | The native Argon2 failed (e.g. out of memory). |
| `ERR_ARGON2_UNSUPPORTED_PLATFORM` | Called on web (see below). |

```ts
import { Argon2Error } from '@sonnetstationsolutions/expo-argon2';

try {
  await argon2id({ /* ... */ });
} catch (e) {
  if (e instanceof Argon2Error && e.code === 'ERR_ARGON2_HASH_FAILED') {
    // handle
  }
}
```

## Correctness

The module is held to a frozen vector. For
`argon2id(password = "ABCD2345", salt = 16 × 0x07, m = 65536, t = 3, p = 1, dkLen = 32, version = 0x13)`
the output is:

```
7d0e2bc7e36bfc948fe53381065a22857b5a4612ef6770ce16719e8f04f8b53d
```

`vectors/vectors.json` holds this plus a parameter-sweep matrix. The values are **generated**, never hand-typed: `scripts/generate-vectors.mjs` derives each with both `@noble/hashes` and `hash-wasm`, asserts the two agree, and pins the frozen vector. CI runs `npm run vectors:check` so any drift fails the build. The example app runs the frozen vector on-device and shows a green check on match.

## Web

Out of scope. The browser already has a good WASM path — use [`hash-wasm`](https://github.com/Daninet/hash-wasm) directly. Importing this package on web resolves to a stub that throws `ERR_ARGON2_UNSUPPORTED_PLATFORM`.

## Marshalling

Bytes cross the native bridge as standard base64 strings (the public API stays `Uint8Array`). This avoids typed-array bridge edge cases across SDK versions; payloads are tiny. See [docs/adr/0001-base64-marshalling.md](docs/adr/0001-base64-marshalling.md).

## Performance

Argon2id at `m = 65536, t = 3, p = 1` targets sub-second on a mid-range 2022+ phone and roughly 250 ms on recent flagships. A single 64 MiB allocation per call is expected and freed promptly. The example app prints elapsed milliseconds so you can profile on real hardware before committing to parameters.

## Security

This is a **key-derivation** function, not credential storage. Constant-time comparison is not this module's concern (it never compares hashes). The security level is entirely **your parameters** — lowering `memory` weakens offline brute-force resistance. The module does no logging, networking, or file I/O. To report a vulnerability, see [SECURITY.md](SECURITY.md).

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). The non-negotiable rule: Argon2 output must stay byte-for-byte identical for fixed inputs.

## License

[MIT](LICENSE) © Sonnet Station Solutions, LLC. Bundled native libraries retain their own permissive licenses — see [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
