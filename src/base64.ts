// Dependency-free standard base64 (RFC 4648, with padding). Used to marshal
// raw bytes across the native bridge so the package adds no runtime deps and
// does not rely on Hermes-version-specific `atob`/`btoa`. Pairs with native
// `android.util.Base64` (NO_WRAP) and Swift `Data(base64Encoded:)`.

const B64_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

const B64_LOOKUP = (() => {
  const table = new Int16Array(256).fill(-1);
  for (let i = 0; i < B64_ALPHABET.length; i++) {
    table[B64_ALPHABET.charCodeAt(i)] = i;
  }
  return table;
})();

export function bytesToBase64(bytes: Uint8Array): string {
  let out = '';
  const len = bytes.length;
  for (let i = 0; i < len; i += 3) {
    const b0 = bytes[i];
    const b1 = i + 1 < len ? bytes[i + 1] : 0;
    const b2 = i + 2 < len ? bytes[i + 2] : 0;
    out += B64_ALPHABET[b0 >> 2];
    out += B64_ALPHABET[((b0 & 0x03) << 4) | (b1 >> 4)];
    out += i + 1 < len ? B64_ALPHABET[((b1 & 0x0f) << 2) | (b2 >> 6)] : '=';
    out += i + 2 < len ? B64_ALPHABET[b2 & 0x3f] : '=';
  }
  return out;
}

export function base64ToBytes(b64: string): Uint8Array {
  let clean = '';
  for (let i = 0; i < b64.length; i++) {
    const c = b64.charCodeAt(i);
    if (c === 0x3d /* '=' */) break;
    if (B64_LOOKUP[c] !== -1) clean += b64[i];
  }
  const outLen = (clean.length * 3) >> 2;
  const out = new Uint8Array(outLen);
  let o = 0;
  for (let i = 0; i < clean.length; i += 4) {
    const c0 = B64_LOOKUP[clean.charCodeAt(i)];
    const c1 = B64_LOOKUP[clean.charCodeAt(i + 1)];
    const c2 = i + 2 < clean.length ? B64_LOOKUP[clean.charCodeAt(i + 2)] : -1;
    const c3 = i + 3 < clean.length ? B64_LOOKUP[clean.charCodeAt(i + 3)] : -1;
    if (o < outLen) out[o++] = (c0 << 2) | (c1 >> 4);
    if (c2 !== -1 && o < outLen) out[o++] = ((c1 & 0x0f) << 4) | (c2 >> 2);
    if (c3 !== -1 && o < outLen) out[o++] = ((c2 & 0x03) << 6) | c3;
  }
  return out;
}
