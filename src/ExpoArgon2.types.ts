/** Argon2 variant. Raw values match the canonical Argon2 type ordering used by
 *  the reference C implementation and @noble/hashes. */
export enum Argon2Type {
  Argon2d = 0,
  Argon2i = 1,
  Argon2id = 2,
}

export interface Argon2Params {
  /**
   * Secret/password input as raw bytes. The CALLER is responsible for any
   * normalization (e.g. unicode/case folding) and UTF-8 encoding before passing
   * bytes here. May be empty.
   */
  password: Uint8Array;
  /** Salt as raw bytes. Argon2 requires >= 8 bytes. */
  salt: Uint8Array;
  /** Memory cost in KiB (e.g. 65536 for 64 MiB). Must be > 0. */
  memory: number;
  /** Time cost (iterations / passes). Must be > 0. */
  iterations: number;
  /** Degree of parallelism (lanes). Must be > 0. */
  parallelism: number;
  /** Output length in bytes. Must be >= 4 (e.g. 32 for an AES-256 key). */
  hashLength: number;
  /** Argon2 variant. Defaults to Argon2id. */
  type?: Argon2Type;
  /** Argon2 version number. Defaults to 0x13 (19). Only 0x10 and 0x13 are supported. */
  version?: number;
}

export type Argon2ErrorCode =
  | 'ERR_ARGON2_INVALID_PARAMS'
  | 'ERR_ARGON2_UNSUPPORTED_TYPE'
  | 'ERR_ARGON2_UNSUPPORTED_VERSION'
  | 'ERR_ARGON2_UNSUPPORTED_PLATFORM'
  | 'ERR_ARGON2_HASH_FAILED';

/** Error thrown by every code path in this module. `code` is stable and safe to branch on. */
export class Argon2Error extends Error {
  readonly code: Argon2ErrorCode;

  constructor(code: Argon2ErrorCode, message: string) {
    super(message);
    this.name = 'Argon2Error';
    this.code = code;
    // Restore prototype chain when targeting ES5 down-leveling.
    Object.setPrototypeOf(this, Argon2Error.prototype);
  }
}

/** Argon2 version 0x13 (19) — the current standard. */
export const ARGON2_VERSION_13 = 0x13;
/** Argon2 version 0x10 (16) — legacy. */
export const ARGON2_VERSION_10 = 0x10;

/** Shape passed across the bridge. Bytes travel as standard base64 strings
 *  (Path B marshalling) so the public API can stay `Uint8Array` while avoiding
 *  any typed-array bridge edge cases. See README "Marshalling". */
export type NativeArgon2Args = {
  passwordBase64: string;
  saltBase64: string;
  memory: number;
  iterations: number;
  parallelism: number;
  hashLength: number;
  /** Argon2Type raw value: 0 = Argon2d, 1 = Argon2i, 2 = Argon2id. */
  type: number;
  /** Argon2 version: 0x10 or 0x13. */
  version: number;
};
