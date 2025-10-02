<template>
  <div class="queue-status-badge-wrapper">
    <transition name="fade" mode="out-in">
      <q-badge v-if="queueReponse.status === 'COMPLETED'" key="completed" color="primary" text-color="white" label="COMPLETED" class="text-label-medium queue-status-badge"/>
      <q-badge v-else-if="queueReponse.status === 'FAILED'" key="failed" color="red" text-color="white" label="FAILED" class="text-label-medium queue-status-badge"/>
      <q-badge v-else-if="queueReponse.status === 'INCOMPLETE'" key="incomplete" color="orange" text-color="white" label="INCOMPLETE" class="text-label-medium queue-status-badge"/>
      <q-badge v-else-if="queueReponse.status === 'PROCESSING'" key="processing" color="red" text-color="white" class="text-label-medium queue-status-badge processing-badge">
        <q-icon name="cached" size="20px" class="custom-spinner q-mr-sm" />
        <span class="processing-text">Processing</span>
        <transition name="count-update" mode="out-in">
          <span :key="`${queueReponse.currentCount}-${queueReponse.totalCount}`" class="count-text">
            ({{ queueReponse.currentCount }} of {{ queueReponse.totalCount }})
          </span>
        </transition>
        <q-linear-progress 
          v-if="progressPercentage > 0" 
          :value="progressPercentage" 
          color="white" 
          track-color="red-8"
          size="3px"
          class="absolute-bottom"
        />
      </q-badge>
      <q-badge v-else-if="queueReponse.status === 'PENDING'" key="pending" color="yellow" text-color="black" class="text-label-medium queue-status-badge pending-badge">
        <q-icon name="cached" size="20px" class="custom-spinner q-mr-sm" /> 
        <span class="pulse-animation">Initializing</span>
      </q-badge>
    </transition>
  </div>
</template>

<script lang="ts">
import { computed } from 'vue';

export default {
  name: 'QueueStatusBadge',
  props: {
    queueReponse: {
      type: Object,
      required: true,
    },
  },
  setup(props) {
    const progressPercentage = computed(() => {
      if (props.queueReponse.totalCount && props.queueReponse.totalCount > 0) {
        return props.queueReponse.currentCount / props.queueReponse.totalCount;
      }
      return 0;
    });

    return {
      progressPercentage,
    };
  },
};
</script>

<style lang="scss" scoped>
.queue-status-badge-wrapper {
  display: inline-block;
}

.queue-status-badge {
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
}

.processing-badge {
  padding-right: 12px;
  animation: processing-pulse 2s ease-in-out infinite;
}

.pending-badge {
  animation: pending-pulse 1.5s ease-in-out infinite;
}

.processing-text {
  margin-right: 4px;
}

.count-text {
  font-weight: 600;
  transition: all 0.3s ease;
}

// Fade transition for status changes
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

// Count update transition
.count-update-enter-active,
.count-update-leave-active {
  transition: all 0.2s ease;
}

.count-update-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.count-update-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

// Spinning animation for the icon
.custom-spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

// Pulse animation for processing state
@keyframes processing-pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4);
  }
  50% {
    box-shadow: 0 0 0 10px rgba(239, 68, 68, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0);
  }
}

// Pulse animation for pending state
@keyframes pending-pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

.pulse-animation {
  animation: text-pulse 1.5s ease-in-out infinite;
}

@keyframes text-pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}
</style>
