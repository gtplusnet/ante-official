<template>
  <div class="version-display" :class="{ 'version-display--minimal': minimal }">
    <q-chip 
      v-if="!minimal"
      dense 
      square 
      color="grey-3"
      text-color="grey-7"
      :icon="isLoading ? 'sync' : 'info'"
      :class="{ 'rotate': isLoading }"
    >
      <span class="text-caption">
        v{{ versionInfo.version || '0.0.0' }}
        <span v-if="versionInfo.environment">({{ versionInfo.environment }})</span>
      </span>
    </q-chip>
    <span v-else class="text-caption text-grey-6">
      v{{ versionInfo.version || '0.0.0' }}
    </span>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

defineProps({
  minimal: {
    type: Boolean,
    default: false
  }
});

const versionInfo = ref({
  version: '0.0.0',
  environment: 'development'
});
const isLoading = ref(true);

const loadVersionInfo = async () => {
  try {
    // First try to get version from backend health endpoint
    const response = await fetch('/api/health/version');
    if (response.ok) {
      const data = await response.json();
      versionInfo.value = data;
    }
  } catch (error) {
    // Fallback to local version.json
    try {
      const response = await fetch('/version.json');
      if (response.ok) {
        const data = await response.json();
        versionInfo.value = data;
      }
    } catch (err) {
      console.error('Could not load version info:', err);
    }
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  loadVersionInfo();
});
</script>

<style lang="scss" scoped>
.version-display {
  display: inline-flex;
  align-items: center;
  
  &--minimal {
    opacity: 0.8;
    font-size: 0.75rem;
  }
}

.rotate {
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>