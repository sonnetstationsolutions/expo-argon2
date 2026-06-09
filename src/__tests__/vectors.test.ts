import { base64ToBytes, bytesToBase64 } from '../base64';

const fixture = require('../../vectors/vectors.json') as {
  version: number;
  vectors: {
    name: string;
    type: number;
    typeName: string;
    version: number;
    password: string;
    salt: string;
    memory: number;
    iterations: number;
    parallelism: number;
    hashLength: number;
    expected: string;
  }[];
};

const FROZEN_EXPECTED = '7d0e2bc7e36bfc948fe53381065a22857b5a4612ef6770ce16719e8f04f8b53d';

function hexToBytes(hex: string): Uint8Array {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return out;
}

describe('frozen Argon2 vectors', () => {
  it('pins the canonical reference vector', () => {
    const frozen = fixture.vectors.find((v) => v.name === 'frozen-id');
    expect(frozen).toBeDefined();
    expect(frozen!.expected).toBe(FROZEN_EXPECTED);
    expect(frozen!.type).toBe(2);
    expect(frozen!.version).toBe(0x13);
    expect(frozen!.memory).toBe(65536);
    expect(frozen!.iterations).toBe(3);
    expect(frozen!.parallelism).toBe(1);
    expect(frozen!.hashLength).toBe(32);
    expect(frozen!.salt).toBe('07070707070707070707070707070707');
    expect(frozen!.password).toBe('4142434432333435'); // "ABCD2345"
  });

  it('has internally consistent entries', () => {
    for (const v of fixture.vectors) {
      expect(v.version).toBe(0x13);
      expect(v.salt.length / 2).toBeGreaterThanOrEqual(8);
      expect(v.expected.length).toBe(v.hashLength * 2);
      // The native module returns base64; confirm the expected key survives the
      // exact marshalling round-trip the bridge uses.
      const keyBytes = hexToBytes(v.expected);
      const roundTripped = base64ToBytes(bytesToBase64(keyBytes));
      expect(Array.from(roundTripped)).toEqual(Array.from(keyBytes));
    }
  });
});
