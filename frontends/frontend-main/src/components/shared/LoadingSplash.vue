<template>
  <teleport to="body">
    <div v-if="visible" class="loading-splash-overlay">
      <q-spinner-orbit size="60px" color="primary" />
      <div class="splash-message">{{ message }}</div>
      <div class="splash-submessage">{{ submessage }}</div>
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { ref } from 'vue';

export interface LoadingSplashProps {
  message?: string;
  submessage?: string;
}

const props = withDefaults(defineProps<LoadingSplashProps>(), {
  message: 'Loading...',
  submessage: 'Please wait...'
});

const visible = ref(true);

// Expose methods for programmatic control
const show = () => {
  visible.value = true;
};

const hide = () => {
  visible.value = false;
};

defineExpose({
  show,
  hide,
  visible
});
</script>

<style scoped>
/* Loading Splash Overlay - Copied from auth-transition-overlay design */
.loading-splash-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(10px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  animation: fadeIn 0.3s ease-in;
}

.splash-message {
  margin-top: 24px;
  font-size: 18px;
  font-weight: 500;
  color: #424242;
  animation: fadeInUp 0.4s ease-out;
}

.splash-submessage {
  margin-top: 8px;
  font-size: 14px;
  color: #757575;
  animation: fadeInUp 0.5s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Responsive adjustments */
@media (max-width: 599px) {
  .splash-message {
    font-size: 16px;
  }

  .splash-submessage {
    font-size: 12px;
  }
}
</style>
