<template>
  <svg class="progress-ring" :width="size" :height="size" :viewBox="`0 0 ${size} ${size}`">
    <!-- Background track -->
    <circle
      class="ring-bg"
      :cx="center" :cy="center" :r="radius"
      fill="none"
      :stroke="trackColor"
      :stroke-width="strokeWidth"
    />
    <!-- Progress arc -->
    <circle
      class="ring-fill"
      :cx="center" :cy="center" :r="radius"
      fill="none"
      :stroke="ringColor"
      :stroke-width="strokeWidth"
      :stroke-dasharray="`${circumference} ${circumference}`"
      :stroke-dashoffset="dashOffset"
      stroke-linecap="round"
      transform="rotate(-90)"
      :style="{ transformOrigin: `${center}px ${center}px` }"
    />
    <!-- Center text -->
    <text
      :x="center" :y="center + 4"
      text-anchor="middle"
      class="ring-text"
      :fill="ringColor"
    >{{ remaining }}</text>
  </svg>
</template>

<script>
import { computed } from 'vue';

export default {
  name: 'ProgressRing',
  props: {
    remaining: { type: Number, default: 30 },
    total: { type: Number, default: 30 },
    size: { type: Number, default: 36 },
    strokeWidth: { type: Number, default: 3 },
  },
  setup(props) {
    const center = computed(() => props.size / 2);
    const radius = computed(() => (props.size - props.strokeWidth * 2) / 2);
    const circumference = computed(() => 2 * Math.PI * radius.value);
    const progress = computed(() => props.remaining / props.total);
    const dashOffset = computed(() => circumference.value * (1 - progress.value));

    const ringColor = computed(() => {
      if (props.remaining > 10) return '#58a6ff';
      if (props.remaining > 5) return '#d29922';
      return '#f85149';
    });

    const trackColor = computed(() => 'rgba(255,255,255,0.08)');

    return { center, radius, circumference, dashOffset, ringColor, trackColor };
  },
};
</script>

<style lang="scss" scoped>
.progress-ring {
  flex-shrink: 0;
  transition: all 0.3s ease;
}
.ring-text {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  font-weight: 700;
}
</style>
