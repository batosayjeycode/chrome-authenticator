<template>
  <div class="account-card" :class="{ 'card--expiring': isExpiring, 'card--critical': isCritical }">
    <!-- Card Header: Issuer + Ring -->
    <div class="card-header">
      <div class="issuer-info">
        <div class="issuer-avatar" :style="{ background: avatarColor }">{{ initial }}</div>
        <span class="issuer-name">{{ account.issuer || account.label || 'Unknown' }}</span>
      </div>
      <ProgressRing
        :remaining="totp.remainingSeconds"
        :total="account.period || 30"
        :size="36"
      />
    </div>

    <!-- TOTP Code Row -->
    <div class="code-row" @click="copyCode" :title="'Click to copy code'">
      <span class="totp-code" :class="codeClass">{{ formattedCode }}</span>
      <button class="btn-copy" :class="{ copied: codeCopied }" @click.stop="copyCode">
        <svg v-if="!codeCopied" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
        <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
      </button>
    </div>

    <!-- Account Label -->
    <p class="account-label">{{ account.label }}</p>

    <!-- Progress Bar -->
    <div class="progress-bar-track">
      <div class="progress-bar-fill" :class="codeClass" :style="{ width: progressWidth }"></div>
    </div>

    <!-- VPN Row -->
    <div v-if="account.vpnPassword" class="vpn-row">
      <div class="vpn-info">
        <span class="vpn-tag">VPN</span>
        <span class="vpn-pass">{{ showVpn ? account.vpnPassword : '•'.repeat(Math.min(account.vpnPassword.length, 10)) }}</span>
        <button class="btn-eye" @click="showVpn = !showVpn" :title="showVpn ? 'Hide' : 'Show'">
          <svg v-if="!showVpn" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>
          </svg>
          <svg v-else width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"></path>
            <line x1="1" y1="1" x2="23" y2="23"></line>
          </svg>
        </button>
      </div>
      <div class="vpn-actions">
        <button class="btn-vpn" :class="{ copied: vpnCopied }" @click="copyVpnPassword">
          <svg v-if="!vpnCopied" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
          <svg v-else width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
          {{ vpnCopied ? 'Copied!' : 'Copy VPN' }}
        </button>
        <button class="btn-combined" :class="{ copied: combinedCopied }" @click="copyCombined">
          <svg v-if="!combinedCopied" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
          <svg v-else width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
          {{ combinedCopied ? 'Copied!' : 'Copy Combined' }}
        </button>
      </div>
    </div>

    <!-- Edit Mode Actions -->
    <div v-if="editMode" class="edit-actions">
      <button class="btn-edit" @click="$emit('edit', account)">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
        </svg>
        Edit
      </button>
      <button class="btn-delete" @click="$emit('delete', account.id)">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path>
          <path d="M10 11v6"></path><path d="M14 11v6"></path>
        </svg>
        Delete
      </button>
    </div>
  </div>
</template>

<script>
import { ref, computed, inject } from 'vue';
import ProgressRing from './ProgressRing.vue';
import { copyToClipboard } from '../../lib/utils.js';

const AVATAR_COLORS = [
  '#1f6feb','#388bfd','#1a7f37','#2ea043',
  '#9e6a03','#d29922','#8250df','#bf3989',
];

function colorFromString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export default {
  name: 'AccountCard',
  components: { ProgressRing },
  props: {
    account: { type: Object, required: true },
    totp: { type: Object, default: () => ({ code: '------', remainingSeconds: 30, progress: 100 }) },
    editMode: { type: Boolean, default: false },
  },
  emits: ['edit', 'delete'],
  setup(props) {
    const toast = inject('toast');
    const showVpn = ref(false);
    const codeCopied = ref(false);
    const vpnCopied = ref(false);
    const combinedCopied = ref(false);

    const initial = computed(() => {
      const name = props.account.issuer || props.account.label || '?';
      return name.charAt(0).toUpperCase();
    });

    const avatarColor = computed(() => colorFromString(props.account.issuer || props.account.id));

    const formattedCode = computed(() => {
      const code = props.totp?.code || '------';
      const mid = Math.floor(code.length / 2);
      return code.slice(0, mid) + ' ' + code.slice(mid);
    });

    const isExpiring = computed(() => props.totp?.remainingSeconds <= 10 && props.totp?.remainingSeconds > 5);
    const isCritical = computed(() => props.totp?.remainingSeconds <= 5);

    const codeClass = computed(() => {
      if (isCritical.value) return 'code--critical';
      if (isExpiring.value) return 'code--expiring';
      return 'code--normal';
    });

    const progressWidth = computed(() => `${props.totp?.progress ?? 100}%`);

    async function copyCode() {
      if (codeCopied.value) return;
      const ok = await copyToClipboard(props.totp?.code || '');
      if (ok) {
        codeCopied.value = true;
        toast?.value?.show('Code copied!', 'success');
        setTimeout(() => { codeCopied.value = false; }, 2000);
      }
    }

    async function copyVpnPassword() {
      if (vpnCopied.value) return;
      const ok = await copyToClipboard(props.account.vpnPassword || '');
      if (ok) {
        vpnCopied.value = true;
        toast?.value?.show('VPN password copied!', 'success');
        setTimeout(() => { vpnCopied.value = false; }, 2000);
      }
    }

    async function copyCombined() {
      if (combinedCopied.value) return;
      const combined = (props.account.vpnPassword || '') + (props.totp?.code || '');
      const ok = await copyToClipboard(combined);
      if (ok) {
        combinedCopied.value = true;
        toast?.value?.show('Combined password copied!', 'success');
        setTimeout(() => { combinedCopied.value = false; }, 2000);
      }
    }

    return {
      showVpn, codeCopied, vpnCopied, combinedCopied,
      initial, avatarColor, formattedCode,
      isExpiring, isCritical, codeClass, progressWidth,
      copyCode, copyVpnPassword, copyCombined,
    };
  },
};
</script>

<style lang="scss" scoped>
.account-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 14px 14px 10px;
  margin-bottom: 10px;
  cursor: default;
  transition: all 0.2s ease;

  &:hover {
    background: var(--bg-card-hover);
    border-color: rgba(88, 166, 255, 0.3);
    transform: translateY(-1px);
    box-shadow: 0 4px 16px rgba(0,0,0,0.3);
  }
  &.card--expiring { border-color: rgba(210, 153, 34, 0.25); }
  &.card--critical { border-color: rgba(248, 81, 73, 0.3); }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.issuer-info {
  display: flex;
  align-items: center;
  gap: 8px;
  overflow: hidden;
}

.issuer-avatar {
  width: 22px; height: 22px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  color: white;
  flex-shrink: 0;
}

.issuer-name {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.code-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2px;
  cursor: pointer;
  border-radius: 8px;
  padding: 2px 0;
  transition: background 0.15s;
  &:hover .btn-copy { opacity: 1; }
}

.totp-code {
  font-family: 'JetBrains Mono', monospace;
  font-size: 28px;
  font-weight: 700;
  letter-spacing: 3px;
  transition: color 0.5s ease;
  &.code--normal { color: var(--accent); }
  &.code--expiring { color: #d29922; }
  &.code--critical { color: #f85149; }
}

.btn-copy {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px; height: 28px;
  border-radius: 6px;
  border: none;
  background: var(--bg-hover);
  color: var(--text-muted);
  cursor: pointer;
  opacity: 0.5;
  transition: all 0.15s;
  &:hover, &.copied { opacity: 1; background: rgba(88,166,255,0.15); color: var(--accent); }
  &.copied { color: #3fb950; background: rgba(63,185,80,0.1); }
}

.account-label {
  font-size: 11px;
  color: var(--text-muted);
  margin: 0 0 8px;
}

.progress-bar-track {
  height: 3px;
  background: rgba(255,255,255,0.07);
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 10px;
}

.progress-bar-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 1s linear, background-color 0.5s ease;
  &.code--normal { background: var(--accent); }
  &.code--expiring { background: #d29922; }
  &.code--critical { background: #f85149; }
}

.vpn-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  padding: 8px 0 0;
  border-top: 1px solid var(--border);
  gap: 6px;
}

.vpn-info {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  flex: 1;
}

.vpn-tag {
  font-size: 10px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 4px;
  background: rgba(88,166,255,0.12);
  color: var(--accent);
  flex-shrink: 0;
}

.vpn-pass {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.btn-eye {
  background: none; border: none;
  color: var(--text-muted);
  cursor: pointer; padding: 2px;
  display: flex; align-items: center;
  flex-shrink: 0;
  &:hover { color: var(--text-secondary); }
}

.vpn-actions {
  display: flex;
  gap: 5px;
  flex-shrink: 0;
}

.btn-vpn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px;
  border-radius: 7px;
  border: 1px solid var(--border);
  background: var(--bg-hover);
  color: var(--text-secondary);
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
  flex-shrink: 0;
  &:hover { border-color: #d29922; color: #d29922; background: rgba(210,153,34,0.08); }
  &.copied { border-color: #3fb950; color: #3fb950; background: rgba(63,185,80,0.08); }
}

.btn-combined {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px;
  border-radius: 7px;
  border: 1px solid var(--border);
  background: var(--bg-hover);
  color: var(--text-secondary);
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
  flex-shrink: 0;
  &:hover { border-color: var(--accent); color: var(--accent); background: rgba(88,166,255,0.08); }
  &.copied { border-color: #3fb950; color: #3fb950; background: rgba(63,185,80,0.08); }
}

.edit-actions {
  display: flex;
  gap: 6px;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid var(--border);
}

.btn-edit, .btn-delete {
  display: flex; align-items: center; gap: 5px;
  padding: 5px 10px; border-radius: 6px;
  font-size: 11px; font-weight: 500;
  cursor: pointer; transition: all 0.15s; border: 1px solid;
}

.btn-edit {
  border-color: var(--border); background: transparent;
  color: var(--text-secondary);
  &:hover { border-color: var(--accent); color: var(--accent); }
}

.btn-delete {
  border-color: rgba(248,81,73,0.3); background: transparent;
  color: #f85149;
  &:hover { background: rgba(248,81,73,0.1); border-color: #f85149; }
}
</style>
