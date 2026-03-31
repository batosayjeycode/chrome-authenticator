<template>
  <Transition name="toast-slide">
    <div v-if="visible" class="toast" :class="`toast--${type}`">
      <span class="toast-icon">
        <svg v-if="type === 'success'" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
        <svg v-else-if="type === 'error'" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
      </span>
      <span class="toast-msg">{{ message }}</span>
    </div>
  </Transition>
</template>

<script>
import { ref } from 'vue';

export default {
  name: 'Toast',
  setup() {
    const visible = ref(false);
    const message = ref('');
    const type = ref('success');
    let timer = null;

    function show(msg, toastType = 'success', duration = 2000) {
      if (timer) clearTimeout(timer);
      message.value = msg;
      type.value = toastType;
      visible.value = true;
      timer = setTimeout(() => { visible.value = false; }, duration);
    }

    return { visible, message, type, show };
  },
};
</script>

<style lang="scss" scoped>
.toast {
  position: fixed;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 500;
  z-index: 9999;
  pointer-events: none;
  white-space: nowrap;
  box-shadow: 0 4px 20px rgba(0,0,0,0.4);

  &--success {
    background: #1a3a1a;
    color: #3fb950;
    border: 1px solid rgba(63, 185, 80, 0.3);
  }
  &--error {
    background: #2d1b1b;
    color: #f85149;
    border: 1px solid rgba(248, 81, 73, 0.3);
  }
  &--info {
    background: #1a2a3a;
    color: #58a6ff;
    border: 1px solid rgba(88, 166, 255, 0.3);
  }
}

.toast-icon { display: flex; align-items: center; }

.toast-slide-enter-active,
.toast-slide-leave-active {
  transition: all 0.25s ease;
}
.toast-slide-enter-from,
.toast-slide-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(10px);
}
</style>
