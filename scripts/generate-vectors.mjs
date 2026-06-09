// Authoritative Argon2 test-vector generator and cross-impl checker.
//
// For every entry it derives the key with BOTH @noble/hashes and hash-wasm,
// asserts the two agree byte-for-byte, and (for the frozen reference vector)
// asserts the agreed output equals the value the native module must reproduce.
//
//   node scripts/generate-vectors.mjs           # (re)write vectors/vectors.json
//   node scripts/generate-vectors.mjs --check    # verify the committed file; non-zero on drift
//
// The frozen vector and the cross-impl agreement are the contract every native
// platform is held to (see vectors/vectors.json, consumed by the example app
// and the on-device tests).

import { strict as assert } from 'node:assert';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { argon2d, argon2i, argon2id } from '@noble/hashes/argon2.js';
import * as wasm from 'hash-wasm';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT_FILE = resolve(HERE, '../vectors/vectors.json');

// Argon2Type raw values: 0 = Argon2d, 1 = Argon2i, 2 = Argon2id.
const TYPE = { Argon2d: 0, Argon2i: 1, Argon2id: 2 };
const NOBLE = { 0: argon2d, 1: argon2i, 2: argon2id };
const WASM = { 0: wasm.argon2d, 1: wasm.argon2i, 2: wasm.argon2id };
const TYPE_NAME = { 0: 'Argon2d', 1: 'Argon2i', 2: 'Argon2id' };

const VERSION = 0x13;

function toHex(bytes) {
  let s = '';
  for (const b of bytes) s += b.toString(16).padStart(2, '0');
  return s;
}

const enc = new TextEncoder();
const FROZEN_PASSWORD = enc.encode('ABCD2345');
const FROZEN_SALT = new Uint8Array(16).fill(0x07);
const FROZEN_EXPECTED = '7d0e2bc7e36bfc948fe53381065a22857b5a4612ef6770ce16719e8f04f8b53d';

// Arbitrary-but-frozen inputs for the parameter-sweep matrix.
const PW = enc.encode('password');
const SALT = enc.encode('0123456789abcdef'); // 16 bytes

/** @type {Array<{name:string,type:number,password:Uint8Array,salt:Uint8Array,memory:number,iterations:number,parallelism:number,hashLength:number}>} */
const MATRIX = [
  // The single hard requirement: canonical 64 MiB / t=3 / p=1 / 32-byte parameters.
  { name: 'frozen-id', type: TYPE.Argon2id, password: FROZEN_PASSWORD, salt: FROZEN_SALT, memory: 65536, iterations: 3, parallelism: 1, hashLength: 32 },
  // Vary memory.
  { name: 'id-m8', type: TYPE.Argon2id, password: PW, salt: SALT, memory: 8, iterations: 1, parallelism: 1, hashLength: 32 },
  { name: 'id-m4096', type: TYPE.Argon2id, password: PW, salt: SALT, memory: 4096, iterations: 3, parallelism: 1, hashLength: 32 },
  // Vary iterations.
  { name: 'id-t1', type: TYPE.Argon2id, password: PW, salt: SALT, memory: 4096, iterations: 1, parallelism: 1, hashLength: 32 },
  // Vary parallelism.
  { name: 'id-p2', type: TYPE.Argon2id, password: PW, salt: SALT, memory: 4096, iterations: 3, parallelism: 2, hashLength: 32 },
  { name: 'id-p4', type: TYPE.Argon2id, password: PW, salt: SALT, memory: 4096, iterations: 3, parallelism: 4, hashLength: 32 },
  // Vary hash length.
  { name: 'id-len16', type: TYPE.Argon2id, password: PW, salt: SALT, memory: 4096, iterations: 3, parallelism: 1, hashLength: 16 },
  { name: 'id-len64', type: TYPE.Argon2id, password: PW, salt: SALT, memory: 4096, iterations: 3, parallelism: 1, hashLength: 64 },
  // Other variants.
  { name: 'i-m4096', type: TYPE.Argon2i, password: PW, salt: SALT, memory: 4096, iterations: 3, parallelism: 1, hashLength: 32 },
  { name: 'd-m4096', type: TYPE.Argon2d, password: PW, salt: SALT, memory: 4096, iterations: 3, parallelism: 1, hashLength: 32 },
];

function nobleHash(entry) {
  return NOBLE[entry.type](entry.password, entry.salt, {
    t: entry.iterations,
    m: entry.memory,
    p: entry.parallelism,
    dkLen: entry.hashLength,
    version: VERSION,
  });
}

async function wasmHash(entry) {
  const hex = await WASM[entry.type]({
    password: entry.password,
    salt: entry.salt,
    parallelism: entry.parallelism,
    iterations: entry.iterations,
    memorySize: entry.memory,
    hashLength: entry.hashLength,
    outputType: 'hex',
  });
  return hex;
}

async function build() {
  const out = [];
  for (const entry of MATRIX) {
    const nobleHex = toHex(nobleHash(entry));
    const wasmHex = await wasmHash(entry);
    assert.equal(
      nobleHex,
      wasmHex,
      `cross-impl mismatch for "${entry.name}": @noble=${nobleHex} hash-wasm=${wasmHex}`,
    );
    if (entry.name === 'frozen-id') {
      assert.equal(nobleHex, FROZEN_EXPECTED, `frozen vector drift: got ${nobleHex}`);
    }
    out.push({
      name: entry.name,
      type: entry.type,
      typeName: TYPE_NAME[entry.type],
      version: VERSION,
      password: toHex(entry.password),
      salt: toHex(entry.salt),
      memory: entry.memory,
      iterations: entry.iterations,
      parallelism: entry.parallelism,
      hashLength: entry.hashLength,
      expected: nobleHex,
    });
  }
  return out;
}

async function main() {
  const check = process.argv.includes('--check');
  const vectors = await build();
  const serialized = JSON.stringify({ note: 'Generated by scripts/generate-vectors.mjs. Do not edit by hand.', version: VERSION, vectors }, null, 2) + '\n';

  if (check) {
    let existing;
    try {
      existing = readFileSync(OUT_FILE, 'utf8');
    } catch {
      console.error(`vectors file missing at ${OUT_FILE}; run "npm run vectors:generate"`);
      process.exit(1);
    }
    if (existing !== serialized) {
      console.error('vectors/vectors.json is out of date or drifted. Run "npm run vectors:generate".');
      process.exit(1);
    }
    console.log(`OK: ${vectors.length} vectors verified (cross-impl + frozen).`);
    return;
  }

  mkdirSync(dirname(OUT_FILE), { recursive: true });
  writeFileSync(OUT_FILE, serialized);
  console.log(`Wrote ${vectors.length} vectors to ${OUT_FILE} (cross-impl + frozen verified).`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
