<template>
  <div class="account-list">
    <!-- Loading -->
    <div v-if="loading" class="state-loading">
      <div class="spinner"></div>
      <span>Loading accounts...</span>
    </div>

    <!-- Empty State -->
    <div v-else-if="accounts.length === 0" class="state-empty">
      <div class="empty-icon">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
        </svg>
      </div>
      <p class="empty-title">No accounts yet</p>
      <p class="empty-sub">Add your first 2FA account to get started</p>
      <div class="empty-actions">
        <button class="btn-primary" @click="$emit('scan')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect>
            <rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect>
          </svg>
          Scan QR Code
        </button>
        <button class="btn-secondary" @click="$emit('add')">Enter Manually</button>
      </div>
    </div>

    <!-- Account Cards -->
    <div v-else class="cards-container">
      <AccountCard
        v-for="account in accounts"
        :key="account.id"
        :account="account"
        :totp="totpMap[account.id] || defaultTotp"
        :edit-mode="editMode"
        @edit="$emit('edit-account', $event)"
        @delete="handleDelete"
      />
    </div>

    <!-- Add Account FAB -->
    <div v-if="accounts.length > 0" class="add-bar">
      <button class="btn-add" @click="$emit('scan')">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect>
          <rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect>
        </svg>
        Scan QR
      </button>
      <button class="btn-add" @click="$emit('add')">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
        Add Manual
      </button>
    </div>
  </div>
</template>

<script>
import { onMounted, onUnmounted, inject } from 'vue';
import AccountCard from './AccountCard.vue';
import { useAccounts } from '../../store/accounts.js';

export default {
  name: 'AccountList',
  components: { AccountCard },
  props: {
    editMode: { type: Boolean, default: false },
  },
  emits: ['add', 'scan', 'edit-account'],
  setup() {
    const { accounts, totpMap, loading, load, startTimer, stopTimer, removeAccount } = useAccounts();
    const toast = inject('toast');

    const defaultTotp = { code: '------', remainingSeconds: 30, progress: 100 };

    onMounted(async () => {
      await load();
      // Check for pending QR scan from context menu
      const session = await chrome.storage.session.get('pendingQrScan');
      if (session.pendingQrScan) {
        const { timestamp } = session.pendingQrScan;
        if (Date.now() - timestamp < 60000) {
          // Fresh pending scan — handled by App.vue via pendingQrData
        }
      }
      startTimer();
    });

    onUnmounted(() => {
      stopTimer();
    });

    async function handleDelete(id) {
      if (!confirm('Delete this account?')) return;
      await removeAccount(id);
      toast?.value?.show('Account deleted', 'info');
    }

    return { accounts, totpMap, loading, defaultTotp, handleDelete };
  },
};
</script>

<style lang="scss" scoped>
.account-list {
  padding: 12px;
  padding-bottom: 0;
}

.state-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 40px 20px;
  color: var(--text-muted);
  font-size: 13px;
}

.spinner {
  width: 24px; height: 24px;
  border: 2px solid var(--border);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.state-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 40px 16px;
  text-align: center;
}

.empty-icon {
  color: var(--text-muted);
  opacity: 0.4;
  margin-bottom: 4px;
}

.empty-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.empty-sub {
  font-size: 12px;
  color: var(--text-muted);
  margin: 0 0 12px;
}

.empty-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: center;
}

.btn-primary {
  display: flex; align-items: center; gap: 6px;
  padding: 8px 16px; border-radius: 8px;
  border: none; background: var(--accent);
  color: #0d1117; font-size: 13px; font-weight: 600;
  cursor: pointer; transition: all 0.15s;
  &:hover { background: #79b8ff; }
}

.btn-secondary {
  padding: 8px 16px; border-radius: 8px;
  border: 1px solid var(--border); background: transparent;
  color: var(--text-secondary); font-size: 13px; font-weight: 500;
  cursor: pointer; transition: all 0.15s;
  &:hover { border-color: var(--accent); color: var(--accent); }
}

.cards-container {
  padding-bottom: 4px;
}

.add-bar {
  display: flex;
  gap: 8px;
  padding: 10px 0 12px;
  border-top: 1px solid var(--border);
  margin-top: 2px;
}

.btn-add {
  flex: 1;
  display: flex; align-items: center; justify-content: center; gap: 6px;
  padding: 8px; border-radius: 8px;
  border: 1px dashed var(--border); background: transparent;
  color: var(--text-muted); font-size: 12px; font-weight: 500;
  cursor: pointer; transition: all 0.15s;
  &:hover { border-color: var(--accent); color: var(--accent); background: rgba(88,166,255,0.05); }
}
</style>
