<template>
  <div class="add-account">
    <form @submit.prevent="handleSave">
      <!-- Issuer -->
      <div class="field">
        <label class="label">Issuer / Company Name</label>
        <input v-model="form.issuer" type="text" class="input" placeholder="e.g. YourCompany" maxlength="64" />
      </div>

      <!-- Account / Label -->
      <div class="field">
        <label class="label">Account Name / Email</label>
        <input v-model="form.label" type="text" class="input" placeholder="e.g. andy.juliadi@company.com" maxlength="128" />
      </div>

      <!-- Secret Key -->
      <div class="field">
        <label class="label">Secret Key <span class="required">*</span></label>
        <div class="input-with-btn">
          <input
            v-model="form.secret"
            :type="showSecret ? 'text' : 'password'"
            class="input"
            :class="{ 'input--error': secretError }"
            placeholder="Base32 secret key"
            autocomplete="off"
            @input="secretError = ''"
          />
          <button type="button" class="btn-toggle" @click="showSecret = !showSecret">
            <svg v-if="!showSecret" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>
            </svg>
            <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"></path>
              <line x1="1" y1="1" x2="23" y2="23"></line>
            </svg>
          </button>
        </div>
        <p v-if="secretError" class="field-error">{{ secretError }}</p>
      </div>

      <!-- Advanced (collapsible) -->
      <div class="section-toggle" @click="showAdvanced = !showAdvanced">
        <span>Advanced Settings</span>
        <svg :style="{ transform: showAdvanced ? 'rotate(180deg)' : '' }" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="transition:transform 0.2s"><polyline points="6 9 12 15 18 9"></polyline></svg>
      </div>
      <div v-if="showAdvanced" class="advanced-fields">
        <div class="field-row">
          <div class="field">
            <label class="label">Algorithm</label>
            <select v-model="form.algorithm" class="input select">
              <option>SHA-1</option>
              <option>SHA-256</option>
              <option>SHA-512</option>
            </select>
          </div>
          <div class="field">
            <label class="label">Digits</label>
            <select v-model.number="form.digits" class="input select">
              <option :value="6">6</option>
              <option :value="8">8</option>
            </select>
          </div>
          <div class="field">
            <label class="label">Period</label>
            <select v-model.number="form.period" class="input select">
              <option :value="30">30s</option>
              <option :value="60">60s</option>
            </select>
          </div>
        </div>
      </div>

      <!-- VPN Integration -->
      <div class="section-divider">
        <span>VPN Integration</span>
      </div>
      <div class="field">
        <label class="label">VPN Password <span class="optional">(optional)</span></label>
        <div class="input-with-btn">
          <input
            v-model="form.vpnPassword"
            :type="showVpn ? 'text' : 'password'"
            class="input"
            placeholder="Your VPN password"
            autocomplete="new-password"
          />
          <button type="button" class="btn-toggle" @click="showVpn = !showVpn">
            <svg v-if="!showVpn" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>
            </svg>
            <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"></path>
              <line x1="1" y1="1" x2="23" y2="23"></line>
            </svg>
          </button>
        </div>
        <p class="field-hint">Combined password format: <code>VPNPassword + TOTP</code></p>
      </div>

      <!-- Actions -->
      <div class="form-actions">
        <button type="button" class="btn-cancel" @click="$emit('cancel')">Cancel</button>
        <button type="submit" class="btn-save" :disabled="saving">
          <span v-if="saving" class="btn-spinner"></span>
          {{ saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Account' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script>
import { ref, reactive, onMounted, inject, computed } from 'vue';
import { useAccounts } from '../../store/accounts.js';
import { isValidBase32 } from '../../lib/base32.js';

export default {
  name: 'AddAccount',
  props: {
    account: { type: Object, default: null }, // null = add mode
  },
  emits: ['saved', 'cancel', 'scan'],
  setup(props, { emit }) {
    const { addAccount, editAccount } = useAccounts();
    const pendingQrData = inject('pendingQrData');
    const toast = inject('toast');

    const isEdit = computed(() => !!props.account);
    const showSecret = ref(false);
    const showVpn = ref(false);
    const showAdvanced = ref(false);
    const saving = ref(false);
    const secretError = ref('');

    const form = reactive({
      issuer: '',
      label: '',
      secret: '',
      algorithm: 'SHA-1',
      digits: 6,
      period: 30,
      vpnPassword: '',
    });

    onMounted(() => {
      if (props.account) {
        // Edit mode — pre-fill form
        Object.assign(form, {
          issuer: props.account.issuer || '',
          label: props.account.label || '',
          secret: props.account.secret || '',
          algorithm: props.account.algorithm || 'SHA-1',
          digits: props.account.digits || 6,
          period: props.account.period || 30,
          vpnPassword: props.account.vpnPassword || '',
        });
      }
      // Check for pending QR data from scanner
      if (pendingQrData?.value) {
        const qr = pendingQrData.value;
        form.issuer = qr.issuer || '';
        form.label = qr.label || '';
        form.secret = qr.secret || '';
        form.algorithm = qr.algorithm || 'SHA-1';
        form.digits = qr.digits || 6;
        form.period = qr.period || 30;
        pendingQrData.value = null;
      }
    });

    async function handleSave() {
      // Validate
      if (!form.secret.trim()) {
        secretError.value = 'Secret key is required';
        return;
      }
      if (!isValidBase32(form.secret)) {
        secretError.value = 'Invalid base32 secret key (A-Z, 2-7 only)';
        return;
      }
      if (!form.issuer.trim() && !form.label.trim()) {
        toast?.value?.show('Please enter issuer or account name', 'error');
        return;
      }

      saving.value = true;
      try {
        if (isEdit.value) {
          await editAccount(props.account.id, { ...form });
        } else {
          await addAccount({ ...form });
        }
        emit('saved');
      } catch (e) {
        toast?.value?.show(e.message || 'Failed to save account', 'error');
      } finally {
        saving.value = false;
      }
    }

    return {
      form, isEdit, showSecret, showVpn, showAdvanced,
      saving, secretError, handleSave,
    };
  },
};
</script>

<style lang="scss" scoped>
.add-account {
  padding: 16px;
  overflow-y: auto;
  max-height: 540px;
}

.field {
  margin-bottom: 14px;
}

.label {
  display: block;
  font-size: 11px;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 6px;
}

.required { color: #f85149; }
.optional { color: var(--text-muted); font-weight: 400; text-transform: none; letter-spacing: 0; }

.input {
  width: 100%;
  background: var(--bg-input);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 9px 12px;
  color: var(--text-primary);
  font-size: 13px;
  font-family: inherit;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.15s;
  &:focus { border-color: var(--accent); }
  &::placeholder { color: var(--text-muted); }
  &--error { border-color: #f85149; }
}

.select { cursor: pointer; }

.input-with-btn {
  display: flex; gap: 6px;
  .input { flex: 1; }
}

.btn-toggle {
  display: flex; align-items: center; justify-content: center;
  width: 36px; height: 36px; flex-shrink: 0;
  border: 1px solid var(--border); border-radius: 8px;
  background: var(--bg-input); color: var(--text-muted);
  cursor: pointer; transition: all 0.15s;
  &:hover { color: var(--text-primary); border-color: var(--accent); }
}

.field-error {
  font-size: 11px; color: #f85149; margin: 4px 0 0;
}

.field-hint {
  font-size: 11px; color: var(--text-muted); margin: 4px 0 0;
  code { background: var(--bg-hover); padding: 1px 4px; border-radius: 3px; font-family: 'JetBrains Mono', monospace; }
}

.section-toggle {
  display: flex; align-items: center; justify-content: space-between;
  padding: 8px 0; margin-bottom: 8px;
  font-size: 12px; font-weight: 500; color: var(--text-muted);
  cursor: pointer; border-top: 1px solid var(--border);
  transition: color 0.15s;
  &:hover { color: var(--text-secondary); }
}

.section-divider {
  font-size: 11px; font-weight: 600; color: var(--accent);
  text-transform: uppercase; letter-spacing: 0.5px;
  padding: 8px 0; margin-bottom: 8px;
  border-top: 1px solid var(--border);
}

.field-row {
  display: flex; gap: 8px;
  .field { flex: 1; }
}

.advanced-fields { margin-bottom: 8px; }

.form-actions {
  display: flex; gap: 8px; margin-top: 20px;
  padding-top: 16px; border-top: 1px solid var(--border);
}

.btn-cancel {
  flex: 1; padding: 10px;
  border-radius: 8px; border: 1px solid var(--border);
  background: transparent; color: var(--text-secondary);
  font-size: 13px; font-weight: 500; cursor: pointer;
  transition: all 0.15s;
  &:hover { border-color: var(--text-muted); color: var(--text-primary); }
}

.btn-save {
  flex: 2; padding: 10px;
  border-radius: 8px; border: none;
  background: var(--accent); color: #0d1117;
  font-size: 13px; font-weight: 600; cursor: pointer;
  transition: all 0.15s; display: flex; align-items: center; justify-content: center; gap: 8px;
  &:hover:not(:disabled) { background: #79b8ff; }
  &:disabled { opacity: 0.6; cursor: not-allowed; }
}

.btn-spinner {
  width: 14px; height: 14px;
  border: 2px solid rgba(0,0,0,0.2);
  border-top-color: #0d1117;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>
