import { base64ToBytes, bytesToBase64 } from '../base64';

function randomBytes(len: number): Uint8Array {
  const a = new Uint8Array(len);
  for (let i = 0; i < len; i++) a[i] = Math.floor(Math.random() * 256);
  return a;
}

describe('base64 codec', () => {
  it('matches Node Buffer encoding across lengths', () => {
    for (let len = 0; len <= 70; len++) {
      const bytes = randomBytes(len);
      const expected = Buffer.from(bytes).toString('base64');
      expect(bytesToBase64(bytes)).toBe(expected);
    }
  });

  it('round-trips bytes through encode/decode', () => {
    for (let len = 0; len <= 70; len++) {
      const bytes = randomBytes(len);
      const decoded = base64ToBytes(bytesToBase64(bytes));
      expect(Array.from(decoded)).toEqual(Array.from(bytes));
    }
  });

  it('decodes standard base64 produced by Node Buffer', () => {
    for (let len = 0; len <= 70; len++) {
      const bytes = randomBytes(len);
      const b64 = Buffer.from(bytes).toString('base64');
      const decoded = base64ToBytes(b64);
      expect(Array.from(decoded)).toEqual(Array.from(bytes));
    }
  });

  it('handles the 16-byte 0x07 salt and a 32-byte key', () => {
    const salt = new Uint8Array(16).fill(0x07);
    expect(bytesToBase64(salt)).toBe(Buffer.from(salt).toString('base64'));

    const key = randomBytes(32);
    expect(Array.from(base64ToBytes(bytesToBase64(key)))).toEqual(Array.from(key));
  });
});
