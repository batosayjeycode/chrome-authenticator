/**
 * TOTP Generator — RFC 6238 implementation using Web Crypto API
 * Supports SHA-1, SHA-256, SHA-512
 */
import { base32Decode } from './base32.js';

const ALGO_MAP = {
  'SHA-1': 'SHA-1',
  'SHA-256': 'SHA-256',
  'SHA-512': 'SHA-512',
};

/**
 * Compute HMAC signature
 */
async function hmac(algorithm, keyBytes, data) {
  const key = await crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'HMAC', hash: ALGO_MAP[algorithm] || 'SHA-1' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, data);
  return new Uint8Array(sig);
}

/**
 * Dynamic truncation per RFC 4226
 */
function truncate(hmacResult) {
  const offset = hmacResult[hmacResult.length - 1] & 0x0f;
  return (
    ((hmacResult[offset] & 0x7f) << 24) |
    ((hmacResult[offset + 1] & 0xff) << 16) |
    ((hmacResult[offset + 2] & 0xff) << 8) |
    (hmacResult[offset + 3] & 0xff)
  );
}

/**
 * Generate TOTP code
 * @param {string} secret - Base32 encoded secret
 * @param {object} options
 * @returns {{ code: string, remainingSeconds: number, progress: number }}
 */
export async function generateTOTP(secret, { digits = 6, period = 30, algorithm = 'SHA-1' } = {}) {
  const keyBytes = base32Decode(secret.replace(/\s/g, '').toUpperCase());
  const epoch = Math.floor(Date.now() / 1000);
  const timeStep = Math.floor(epoch / period);

  // Encode time step as 8-byte big-endian buffer
  const counter = new ArrayBuffer(8);
  const view = new DataView(counter);
  // High 32 bits (always 0 for reasonable timestamps)
  view.setUint32(0, Math.floor(timeStep / 0x100000000), false);
  // Low 32 bits
  view.setUint32(4, timeStep >>> 0, false);

  const hmacResult = await hmac(algorithm, keyBytes, counter);
  const code = truncate(hmacResult) % Math.pow(10, digits);

  const remainingSeconds = period - (epoch % period);
  const progress = (remainingSeconds / period) * 100;

  return {
    code: String(code).padStart(digits, '0'),
    remainingSeconds,
    progress,
  };
}
