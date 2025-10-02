<template>
  <div class="cache-indicator" v-if="visible">
    <q-icon
      v-if="isRefreshing"
      name="sync"
      :size="size"
      :class="['cache-icon', 'rotating-icon', colorClass]"
    >
      <q-tooltip v-if="showTooltip">
        {{ refreshingTooltip }}
      </q-tooltip>
    </q-icon>

    <q-icon
      v-else-if="isCached"
      name="cached"
      :size="size"
      :class="['cache-icon', colorClass]"
    >
      <q-tooltip v-if="showTooltip">
        <div>
          <div>{{ cachedTooltip }}</div>
          <div v-if="showAge && formattedAge" class="text-caption">
            Updated {{ formattedAge }}
          </div>
        </div>
      </q-tooltip>
    </q-icon>

    <span v-if="showLabel" class="cache-label q-ml-xs text-caption">
      {{ labelText }}
    </span>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed } from 'vue';

export default defineComponent({
  name: 'CacheIndicator',

  props: {
    isCached: {
      type: Boolean,
      default: false
    },
    isRefreshing: {
      type: Boolean,
      default: false
    },
    lastUpdated: {
      type: Date as PropType<Date | null>,
      default: null
    },
    size: {
      type: String,
      default: '16px'
    },
    color: {
      type: String,
      default: 'grey-6'
    },
    showTooltip: {
      type: Boolean,
      default: true
    },
    showLabel: {
      type: Boolean,
      default: false
    },
    showAge: {
      type: Boolean,
      default: true
    },
    refreshingTooltip: {
      type: String,
      default: 'Updating...'
    },
    cachedTooltip: {
      type: String,
      default: 'Cached data shown'
    },
    alwaysVisible: {
      type: Boolean,
      default: false
    }
  },

  setup(props) {
    const visible = computed(() => {
      return props.alwaysVisible || props.isCached || props.isRefreshing;
    });

    const colorClass = computed(() => {
      return `text-${props.color}`;
    });

    const labelText = computed(() => {
      if (props.isRefreshing) return 'Updating...';
      if (props.isCached) return 'Cached';
      return '';
    });

    const formattedAge = computed(() => {
      if (!props.lastUpdated) return null;

      const now = new Date();
      const diff = now.getTime() - props.lastUpdated.getTime();
      const seconds = Math.floor(diff / 1000);

      if (seconds < 60) return 'just now';

      const minutes = Math.floor(seconds / 60);
      if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;

      const hours = Math.floor(minutes / 60);
      if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;

      const days = Math.floor(hours / 24);
      return `${days} day${days === 1 ? '' : 's'} ago`;
    });

    return {
      visible,
      colorClass,
      labelText,
      formattedAge
    };
  }
});
</script>

<style scoped lang="scss">
.cache-indicator {
  display: inline-flex;
  align-items: center;
  line-height: 1;
}

.cache-icon {
  vertical-align: middle;
}

// Rotating animation for sync icon
@keyframes rotate-sync {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.rotating-icon {
  animation: rotate-sync 1s linear infinite;
}

.cache-label {
  opacity: 0.8;
}
</style>