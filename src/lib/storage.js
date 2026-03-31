/**
 * Storage layer — chrome.storage.local wrapper
 * Data disimpan langsung tanpa custom encryption karena:
 * - chrome.storage.local sudah sandboxed per-extension oleh Chrome
 * - Data tidak pernah keluar ke network
 *
 * Account schema:
 * {
 *   id: string,
 *   issuer: string,
 *   label: string,
 *   secret: string,          // TOTP secret key (Base32)
 *   vpnPassword: string,     // VPN password
 *   algorithm: 'SHA-1'|'SHA-256'|'SHA-512',
 *   digits: 6|8,
 *   period: 30|60,
 *   createdAt: number,
 * }
 */
import { generateId } from './utils.js';

const ACCOUNTS_KEY = 'accounts';

/**
 * Load all accounts from storage
 * @returns {Promise<Array>}
 */
export async function getAccounts() {
  try {
    const data = await chrome.storage.local.get(ACCOUNTS_KEY);
    return data[ACCOUNTS_KEY] || [];
  } catch (e) {
    console.error('[Authenticator] getAccounts failed:', e);
    return [];
  }
}

/**
 * Save a new account
 * @param {{ issuer, label, secret, vpnPassword, algorithm, digits, period }} account
 */
export async function saveAccount(account) {
  const data = await chrome.storage.local.get(ACCOUNTS_KEY);
  const list = data[ACCOUNTS_KEY] || [];

  const record = {
    id: generateId(),
    issuer: account.issuer || '',
    label: account.label || '',
    secret: (account.secret || '').toUpperCase().replace(/\s/g, ''),
    vpnPassword: account.vpnPassword || '',
    algorithm: account.algorithm || 'SHA-1',
    digits: account.digits || 6,
    period: account.period || 30,
    createdAt: Date.now(),
  };

  list.push(record);
  await chrome.storage.local.set({ [ACCOUNTS_KEY]: list });
  return record;
}

/**
 * Update an existing account by id
 */
export async function updateAccount(id, updates) {
  const data = await chrome.storage.local.get(ACCOUNTS_KEY);
  const list = data[ACCOUNTS_KEY] || [];
  const idx = list.findIndex((a) => a.id === id);
  if (idx === -1) throw new Error('Account not found');

  const updated = {
    ...list[idx],
    ...updates,
  };

  // Normalize secret key format
  if (updates.secret) {
    updated.secret = updates.secret.toUpperCase().replace(/\s/g, '');
  }

  list[idx] = updated;
  await chrome.storage.local.set({ [ACCOUNTS_KEY]: list });
  return updated;
}

/**
 * Delete an account by id
 */
export async function deleteAccount(id) {
  const data = await chrome.storage.local.get(ACCOUNTS_KEY);
  const list = (data[ACCOUNTS_KEY] || []).filter((a) => a.id !== id);
  await chrome.storage.local.set({ [ACCOUNTS_KEY]: list });
}

/**
 * Clear all stored data
 */
export async function clearAllData() {
  await chrome.storage.local.clear();
}
