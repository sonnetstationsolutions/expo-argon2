import {
  ARGON2_VERSION_10,
  ARGON2_VERSION_13,
  Argon2Error,
  Argon2Type,
  type Argon2Params,
} from './ExpoArgon2.types';
import ExpoArgon2Module from './ExpoArgon2Module';
import { base64ToBytes, bytesToBase64 } from './base64';

export { Argon2Type, Argon2Error, ARGON2_VERSION_10, ARGON2_VERSION_13 } from './ExpoArgon2.types';
export type { Argon2Params, Argon2ErrorCode } from './ExpoArgon2.types';

function isPositiveInt(n: number): boolean {
  return Number.isInteger(n) && n > 0;
}

function validate(params: Argon2Params): void {
  if (!(params.password instanceof Uint8Array)) {
    throw new Argon2Error('ERR_ARGON2_INVALID_PARAMS', 'password must be a Uint8Array');
  }
  if (!(params.salt instanceof Uint8Array)) {
    throw new Argon2Error('ERR_ARGON2_INVALID_PARAMS', 'salt must be a Uint8Array');
  }
  if (params.salt.length < 8) {
    throw new Argon2Error('ERR_ARGON2_INVALID_PARAMS', 'salt must be at least 8 bytes');
  }
  if (!Number.isInteger(params.hashLength) || params.hashLength < 4) {
    throw new Argon2Error('ERR_ARGON2_INVALID_PARAMS', 'hashLength must be an integer >= 4');
  }
  if (!isPositiveInt(params.memory)) {
    throw new Argon2Error('ERR_ARGON2_INVALID_PARAMS', 'memory must be a positive integer (KiB)');
  }
  if (!isPositiveInt(params.iterations)) {
    throw new Argon2Error('ERR_ARGON2_INVALID_PARAMS', 'iterations must be a positive integer');
  }
  if (!isPositiveInt(params.parallelism)) {
    throw new Argon2Error('ERR_ARGON2_INVALID_PARAMS', 'parallelism must be a positive integer');
  }

  const type = params.type ?? Argon2Type.Argon2id;
  if (type !== Argon2Type.Argon2d && type !== Argon2Type.Argon2i && type !== Argon2Type.Argon2id) {
    throw new Argon2Error(
      'ERR_ARGON2_UNSUPPORTED_TYPE',
      `unsupported Argon2 type: ${String(type)}`
    );
  }

  const version = params.version ?? ARGON2_VERSION_13;
  if (version !== ARGON2_VERSION_10 && version !== ARGON2_VERSION_13) {
    throw new Argon2Error(
      'ERR_ARGON2_UNSUPPORTED_VERSION',
      `unsupported Argon2 version: ${String(version)} (expected 0x10 or 0x13)`
    );
  }
}

/**
 * Derives a raw key with Argon2. Resolves to exactly `hashLength` bytes.
 * Runs off the JS thread. Inputs are treated as read-only.
 */
export async function hashRaw(params: Argon2Params): Promise<Uint8Array> {
  validate(params);

  let resultBase64: string;
  try {
    resultBase64 = await ExpoArgon2Module.hashRaw({
      passwordBase64: bytesToBase64(params.password),
      saltBase64: bytesToBase64(params.salt),
      memory: params.memory,
      iterations: params.iterations,
      parallelism: params.parallelism,
      hashLength: params.hashLength,
      type: params.type ?? Argon2Type.Argon2id,
      version: params.version ?? ARGON2_VERSION_13,
    });
  } catch (e) {
    if (e instanceof Argon2Error) throw e;
    const code = (e as { code?: string } | null)?.code;
    const message = (e as { message?: string } | null)?.message ?? 'Argon2 hashing failed';
    if (
      code === 'ERR_ARGON2_INVALID_PARAMS' ||
      code === 'ERR_ARGON2_UNSUPPORTED_TYPE' ||
      code === 'ERR_ARGON2_UNSUPPORTED_VERSION' ||
      code === 'ERR_ARGON2_HASH_FAILED'
    ) {
      throw new Argon2Error(code, message);
    }
    throw new Argon2Error('ERR_ARGON2_HASH_FAILED', message);
  }

  return base64ToBytes(resultBase64);
}

/** Convenience wrapper pinned to Argon2id. */
export function argon2id(params: Omit<Argon2Params, 'type'>): Promise<Uint8Array> {
  return hashRaw({ ...params, type: Argon2Type.Argon2id });
}
