<template>
  <div class="app">
    <!-- Header -->
    <header class="app-header">
      <div class="header-left">
        <button v-if="currentView !== 'list'" class="btn-back" @click="goBack" title="Back">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
        <span class="app-logo" v-if="currentView === 'list'">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#58a6ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
        </span>
        <span class="app-title">{{ headerTitle }}</span>
      </div>
      <div class="header-right" v-if="currentView === 'list'">
        <button class="btn-icon" :class="{ active: editMode }" @click="editMode = !editMode" title="Edit accounts">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
          </svg>
        </button>
      </div>
    </header>

    <!-- Views -->
    <main class="app-main">
      <AccountList
        v-if="currentView === 'list'"
        :edit-mode="editMode"
        @add="navigate('add')"
        @scan="navigate('scan')"
        @edit-account="startEdit"
      />
      <AddAccount
        v-else-if="currentView === 'add' || currentView === 'edit'"
        :account="editingAccount"
        @saved="onAccountSaved"
        @cancel="goBack"
        @scan="navigate('scan')"
      />
      <QrScanner
        v-else-if="currentView === 'scan'"
        @scanned="onQrScanned"
        @cancel="goBack"
      />
    </main>

    <!-- Toast -->
    <Toast ref="toast" />
  </div>
</template>

<script>
import { ref, computed, provide } from 'vue';
import AccountList from './components/AccountList.vue';
import AddAccount from './components/AddAccount.vue';
import QrScanner from './components/QrScanner.vue';
import Toast from './components/Toast.vue';

export default {
  name: 'App',
  components: { AccountList, AddAccount, QrScanner, Toast },
  setup() {
    const currentView = ref('list');
    const editMode = ref(false);
    const editingAccount = ref(null);
    const toast = ref(null);
    const pendingQrData = ref(null);

    provide('toast', toast);
    provide('pendingQrData', pendingQrData);

    const headerTitle = computed(() => {
      const titles = {
        list: 'Authenticator',
        add: 'Add Account',
        edit: 'Edit Account',
        scan: 'Scan QR Code',
      };
      return titles[currentView.value] || 'Authenticator';
    });

    function navigate(view) {
      currentView.value = view;
    }

    function goBack() {
      editingAccount.value = null;
      currentView.value = 'list';
    }

    function startEdit(account) {
      editingAccount.value = account;
      currentView.value = 'edit';
    }

    function onAccountSaved() {
      goBack();
      toast.value?.show('Account saved!', 'success');
    }

    function onQrScanned(data) {
      pendingQrData.value = data;
      currentView.value = 'add';
    }

    return {
      currentView, editMode, editingAccount, headerTitle, toast,
      navigate, goBack, startEdit, onAccountSaved, onQrScanned,
    };
  },
};
</script>

<style lang="scss">
.app {
  width: 380px;
  min-height: 200px;
  max-height: 600px;
  display: flex;
  flex-direction: column;
  background: var(--bg-primary);
  overflow: hidden;
}

.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.app-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  letter-spacing: -0.2px;
}

.header-right {
  display: flex;
  gap: 6px;
}

.btn-back,
.btn-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.15s ease;
  &:hover {
    background: var(--bg-hover);
    color: var(--text-primary);
  }
  &.active {
    background: rgba(88, 166, 255, 0.15);
    color: var(--accent);
  }
}

.app-main {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }
}
</style>
