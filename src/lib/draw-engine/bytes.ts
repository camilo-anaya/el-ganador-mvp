// Utilidades isomórficas (servidor y navegador).
// Usa WebCrypto nativo cuando esté disponible (HTTPS / localhost / Node.js).
// Incluye fallback puro de SHA-256 y HMAC-SHA-256 para contextos HTTP en red local móvil (ej. Safari en 192.168.x.x).

export class EngineInputError extends Error {
  readonly status = 400;
}

export const utf8 = (text: string) => new TextEncoder().encode(text);

export function toHex(bytes: Uint8Array) {
  let out = "";
  for (const byte of bytes) out += byte.toString(16).padStart(2, "0");
  return out;
}

export function fromHex(hex: string, expectedBytes?: number) {
  if (typeof hex !== "string" || !/^(?:[0-9a-f]{2})*$/i.test(hex)) throw new EngineInputError("Valor hexadecimal inválido.");
  const out = new Uint8Array(hex.length / 2);
  for (let index = 0; index < out.length; index += 1) out[index] = parseInt(hex.slice(index * 2, index * 2 + 2), 16);
  if (expectedBytes !== undefined && out.length !== expectedBytes) throw new EngineInputError(`Se esperaban ${expectedBytes} bytes.`);
  return out;
}

export function toBase64(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

export function fromBase64(value: string) {
  if (typeof value !== "string" || !/^[A-Za-z0-9+/]*={0,2}$/.test(value)) throw new EngineInputError("Valor base64 inválido.");
  const binary = atob(value);
  const out = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) out[index] = binary.charCodeAt(index);
  return out;
}

/** Comparación en tiempo constante para cadenas de igual longitud (huellas hex). */
export function constantTimeEqual(a: string, b: string) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  let diff = 0;
  for (let index = 0; index < a.length; index += 1) diff |= a.charCodeAt(index) ^ b.charCodeAt(index);
  return diff === 0;
}

/* =========================================================================
   IMPLEMENTACIÓN PURA DE SHA-256 Y HMAC-SHA-256 (FIPS 180-4)
   Garantiza funcionamiento en Safari/Chrome en IPs locales HTTP (sin Secure Context)
   ========================================================================= */

const K = new Uint32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
]);

function rotr(n: number, x: number) {
  return (x >>> n) | (x << (32 - n));
}

function pureSha256(data: Uint8Array): Uint8Array {
  const len = data.length;
  const bitLen = len * 8;
  const withPadLen = ((len + 8) >> 6) + 1;
  const words = new Uint32Array(withPadLen * 16);

  for (let i = 0; i < len; i += 1) {
    words[i >> 2] |= data[i] << (24 - (i % 4) * 8);
  }
  words[len >> 2] |= 0x80 << (24 - (len % 4) * 8);
  words[words.length - 1] = bitLen & 0xffffffff;
  words[words.length - 2] = Math.floor(bitLen / 0x100000000);

  let h0 = 0x6a09e667, h1 = 0xbb67ae85, h2 = 0x3c6ef372, h3 = 0xa54ff53a;
  let h4 = 0x510e527f, h5 = 0x9b05688c, h6 = 0x1f83d9ab, h7 = 0x5be0cd19;

  const w = new Uint32Array(64);

  for (let i = 0; i < words.length; i += 16) {
    for (let t = 0; t < 16; t += 1) w[t] = words[i + t];
    for (let t = 16; t < 64; t += 1) {
      const s0 = rotr(7, w[t - 15]) ^ rotr(18, w[t - 15]) ^ (w[t - 15] >>> 3);
      const s1 = rotr(17, w[t - 2]) ^ rotr(19, w[t - 2]) ^ (w[t - 2] >>> 10);
      w[t] = (w[t - 16] + s0 + w[t - 7] + s1) | 0;
    }

    let a = h0, b = h1, c = h2, d = h3, e = h4, f = h5, g = h6, h = h7;

    for (let t = 0; t < 64; t += 1) {
      const s1 = rotr(6, e) ^ rotr(11, e) ^ rotr(25, e);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + s1 + ch + K[t] + w[t]) | 0;
      const s0 = rotr(2, a) ^ rotr(13, a) ^ rotr(22, a);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (s0 + maj) | 0;

      h = g; g = f; f = e; e = (d + temp1) | 0;
      d = c; c = b; b = a; a = (temp1 + temp2) | 0;
    }

    h0 = (h0 + a) | 0; h1 = (h1 + b) | 0; h2 = (h2 + c) | 0; h3 = (h3 + d) | 0;
    h4 = (h4 + e) | 0; h5 = (h5 + f) | 0; h6 = (h6 + g) | 0; h7 = (h7 + h) | 0;
  }

  const out = new Uint8Array(32);
  const hashes = [h0, h1, h2, h3, h4, h5, h6, h7];
  for (let i = 0; i < 8; i += 1) {
    out[i * 4] = (hashes[i] >>> 24) & 0xff;
    out[i * 4 + 1] = (hashes[i] >>> 16) & 0xff;
    out[i * 4 + 2] = (hashes[i] >>> 8) & 0xff;
    out[i * 4 + 3] = hashes[i] & 0xff;
  }
  return out;
}

function pureHmacSha256(key: Uint8Array, data: Uint8Array): Uint8Array {
  let k = key;
  if (k.length > 64) k = pureSha256(k);
  const kPad = new Uint8Array(64);
  kPad.set(k);

  const oKeyPad = new Uint8Array(64);
  const iKeyPad = new Uint8Array(64);
  for (let i = 0; i < 64; i += 1) {
    oKeyPad[i] = kPad[i] ^ 0x5c;
    iKeyPad[i] = kPad[i] ^ 0x36;
  }

  const innerMsg = new Uint8Array(64 + data.length);
  innerMsg.set(iKeyPad);
  innerMsg.set(data, 64);
  const innerHash = pureSha256(innerMsg);

  const outerMsg = new Uint8Array(64 + 32);
  outerMsg.set(oKeyPad);
  outerMsg.set(innerHash, 64);
  return pureSha256(outerMsg);
}

/* =========================================================================
   FUNCIONES PÚBLICAS CON AUTO-DETECCIÓN DE ENTORNO
   ========================================================================= */

export async function sha256(data: Uint8Array): Promise<Uint8Array> {
  const api = globalThis.crypto?.subtle;
  if (api) {
    try {
      return new Uint8Array(await api.digest("SHA-256", data as BufferSource));
    } catch {
      // Si falla WebCrypto por contexto de seguridad, usar fallback puro
    }
  }
  return pureSha256(data);
}

export async function sha256Hex(data: Uint8Array | string): Promise<string> {
  return toHex(await sha256(typeof data === "string" ? utf8(data) : data));
}

export async function hmacSha256(key: Uint8Array, data: Uint8Array): Promise<Uint8Array> {
  const api = globalThis.crypto?.subtle;
  if (api) {
    try {
      const cryptoKey = await api.importKey("raw", key as BufferSource, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
      return new Uint8Array(await api.sign("HMAC", cryptoKey, data as BufferSource));
    } catch {
      // Fallback puro
    }
  }
  return pureHmacSha256(key, data);
}
