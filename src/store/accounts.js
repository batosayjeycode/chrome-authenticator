/**
 * Accounts store — Vue 3 reactive composable
 * Manages accounts state, TOTP generation, and timer
 */
import { ref, reactive } from 'vue';
import { getAccounts, saveAccount, deleteAccount, updateAccount } from '../lib/storage.js';
import { generateTOTP } from '../lib/totp.js';

// Singleton state
const accounts = ref([]);
const totpMap = reactive({}); // id → { code, remainingSeconds, progress }
const loading = ref(true);
const error = ref(null);

let _timer = null;

async function refreshTOTP() {
  for (const acc of accounts.value) {
    try {
      const data = await generateTOTP(acc.secret, {
        digits: acc.digits,
        period: acc.period,
        algorithm: acc.algorithm,
      });
      totpMap[acc.id] = data;
    } catch (e) {
      totpMap[acc.id] = { code: '------', remainingSeconds: 0, progress: 0 };
    }
  }
}

export function useAccounts() {
  async function load() {
    loading.value = true;
    error.value = null;
    try {
      accounts.value = await getAccounts();
      await refreshTOTP();
    } catch (e) {
      error.value = e.message;
    } finally {
      loading.value = false;
    }
  }

  function startTimer() {
    _timer = setInterval(refreshTOTP, 1000);
  }

  function stopTimer() {
    if (_timer) {
      clearInterval(_timer);
      _timer = null;
    }
  }

  async function addAccount(accountData) {
    const saved = await saveAccount(accountData);
    accounts.value.push(saved);
    await refreshTOTP();
    return saved;
  }

  async function editAccount(id, updates) {
    const updated = await updateAccount(id, updates);
    const idx = accounts.value.findIndex((a) => a.id === id);
    if (idx !== -1) accounts.value[idx] = updated;
    await refreshTOTP();
  }

  async function removeAccount(id) {
    await deleteAccount(id);
    accounts.value = accounts.value.filter((a) => a.id !== id);
    delete totpMap[id];
  }

  return {
    accounts,
    totpMap,
    loading,
    error,
    load,
    startTimer,
    stopTimer,
    addAccount,
    editAccount,
    removeAccount,
  };
}
