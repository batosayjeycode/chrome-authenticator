/**
 * Base32 decoder — used to decode TOTP secret keys
 * RFC 4648 Base32 alphabet: A-Z and 2-7
 */
const BASE32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function base32Decode(input) {
  // Normalize: uppercase, remove spaces and padding
  const str = input.toUpperCase().replace(/\s/g, '').replace(/=/g, '');

  let bits = 0;
  let value = 0;
  let index = 0;
  const output = new Uint8Array(Math.floor((str.length * 5) / 8));

  for (let i = 0; i < str.length; i++) {
    const charIndex = BASE32_CHARS.indexOf(str[i]);
    if (charIndex === -1) {
      throw new Error(`Invalid base32 character: ${str[i]}`);
    }
    value = (value << 5) | charIndex;
    bits += 5;
    if (bits >= 8) {
      output[index++] = (value >>> (bits - 8)) & 0xff;
      bits -= 8;
    }
  }

  return output;
}

export function isValidBase32(input) {
  const str = input.toUpperCase().replace(/\s/g, '').replace(/=/g, '');
  return /^[A-Z2-7]+$/.test(str) && str.length > 0;
}
