/**
 * AES-256-GCM encryption/decryption using Web Crypto API
 * Key is auto-generated on first run and stored in chrome.storage.local
 */
import { bufferToBase64, base64ToBuffer } from './utils.js';

const KEY_STORAGE_NAME = '__auth_enc_key__';

let _cachedKey = null;

async function getEncryptionKey() {
  if (_cachedKey) return _cachedKey;

  const stored = await chrome.storage.local.get(KEY_STORAGE_NAME);

  if (stored[KEY_STORAGE_NAME]) {
    const keyData = base64ToBuffer(stored[KEY_STORAGE_NAME]);
    _cachedKey = await crypto.subtle.importKey(
      'raw', keyData, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']
    );
    return _cachedKey;
  }

  // Generate new key
  const key = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']
  );
  const exported = await crypto.subtle.exportKey('raw', key);
  await chrome.storage.local.set({ [KEY_STORAGE_NAME]: bufferToBase64(exported) });
  _cachedKey = key;
  return _cachedKey;
}

/**
 * Encrypt plaintext string
 * @param {string} plaintext
 * @returns {{ iv: string, ciphertext: string }}
 */
export async function encrypt(plaintext) {
  if (!plaintext) return { iv: '', ciphertext: '' };
  const key = await getEncryptionKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);
  return {
    iv: bufferToBase64(iv),
    ciphertext: bufferToBase64(ciphertext),
  };
}

/**
 * Decrypt to plaintext string
 * @param {string} iv - base64
 * @param {string} ciphertext - base64
 * @returns {string}
 */
export async function decrypt(iv, ciphertext) {
  if (!iv || !ciphertext) return '';
  const key = await getEncryptionKey();
  const ivBuf = base64ToBuffer(iv);
  const ctBuf = base64ToBuffer(ciphertext);
  const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: ivBuf }, key, ctBuf);
  return new TextDecoder().decode(decrypted);
}
