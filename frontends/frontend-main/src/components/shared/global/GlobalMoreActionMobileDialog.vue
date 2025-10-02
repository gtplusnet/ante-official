<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    position="bottom"
    :maximized="false"
    transition-show="slide-up"
    transition-hide="slide-down"
  >
    <q-card class="global-more-action-card" :style="cardStyle">
      <div class="drag-indicator"></div>
      <div v-if="title" class="dialog-header q-px-md q-py-xs">
        <div class="row items-center">
          <q-btn
            v-if="showBackIcon"
            flat
            round
            size="sm"
            icon="arrow_back"
            color="dark"
            @click="handleBackClick"
            class="q-mr-sm"
          />
          <div class="text-title-large text-dark">{{ title }}</div>
        </div>
      </div>
      <q-list :class="{ 'has-scroll': hasScroll }">
        <q-item
          v-for="(action, index) in actions"
          :key="`action-${index}`"
          clickable
          v-ripple
          @click="handleActionClick(action)"
          :disable="action.disabled"
          :class="{ disabled: action.disabled }"
        >
          <q-item-section avatar>
            <q-icon
              :name="action.icon"
              :style="getIconStyle(action)"
              size="24px"
            />
          </q-item-section>
          <q-item-section>
            <span class="text-label-large text-grey" :class="{ 'text-grey-5': action.disabled }">
              {{ action.label }}
            </span>
          </q-item-section>
          <q-item-section v-if="action.badge" side>
            <q-badge
              :color="action.badgeColor || 'red'"
              :label="action.badge"
              rounded
            />
          </q-item-section>
        </q-item>
      </q-list>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue';

export interface ActionItem {
  icon: string;
  label: string;
  color?: string;
  badge?: number | string;
  badgeColor?: string;
  disabled?: boolean;
  onClick: () => void;
}

interface Props {
  modelValue: boolean;
  actions: ActionItem[];
  title?: string;
  maxHeight?: string; // Default: 70vh
  showBackIcon?: boolean; // Show back arrow icon in title
}

const props = withDefaults(defineProps<Props>(), {
  maxHeight: '70vh'
});

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  'back-clicked': [];
}>();

// Calculate dynamic height based on number of items
const calculatedHeight = computed(() => {
  const itemHeight = 56; // Height per item in pixels
  const headerHeight = 20; // Drag indicator + padding
  const titleHeight = props.title ? 48 : 0; // Title height if present
  const listPadding = 16; // Top and bottom padding
  const totalHeight = (props.actions.length * itemHeight) + headerHeight + titleHeight + listPadding;

  return `${totalHeight}px`;
});

// Check if scrolling is needed
const hasScroll = computed(() => {
  const itemHeight = 56;
  const headerHeight = 20;
  const titleHeight = props.title ? 48 : 0;
  const listPadding = 16;
  const totalHeight = (props.actions.length * itemHeight) + headerHeight + titleHeight + listPadding;
  const maxHeightPx = parseFloat(props.maxHeight) * window.innerHeight / 100;

  return totalHeight > maxHeightPx;
});

// Card style with dynamic height
const cardStyle = computed(() => {
  return {
    height: hasScroll.value ? props.maxHeight : 'auto',
    maxHeight: props.maxHeight,
    minHeight: calculatedHeight.value
  };
});

// Handle action click
const handleActionClick = (action: ActionItem) => {
  if (!action.disabled) {
    action.onClick();
    emit('update:modelValue', false);
  }
};

// Handle back button click
const handleBackClick = () => {
  emit('back-clicked');
};

// Get icon style based on action state
const getIconStyle = (action: ActionItem) => {
  let color = '#747786'; // Default color

  if (action.disabled) {
    color = '#9e9e9e'; // Light grey for disabled
  } else if (action.color) {
    // If it's a named Quasar color, use CSS variable
    if (!action.color.startsWith('#')) {
      return { color: `var(--q-${action.color})` };
    }
    // Otherwise use the color directly
    color = action.color;
  }

  return { color };
};
</script>

<style scoped>
.global-more-action-card {
  padding: 0 12px;
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
  border-radius: 24px 24px 0 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: height 0.3s ease;
}

.drag-indicator {
  width: 32px;
  height: 4px;
  background-color: #e0e0e0;
  border-radius: 2px;
  margin: 8px auto;
  flex-shrink: 0;
}

.q-list {
  padding: 0 0 8px 0;
  overflow-y: auto;
  flex: 1;

  &.has-scroll {
    /* Add subtle shadow when scrollable */
    &::before {
      content: '';
      position: sticky;
      top: 0;
      display: block;
      height: 1px;
      background: linear-gradient(to bottom, rgba(0,0,0,0.1), transparent);
      margin-bottom: 4px;
    }
  }

  /* Custom scrollbar */
  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background-color: #d9d9d9;
    border-radius: 2px;
  }
}

.q-item {
  padding: 12px 16px;
  min-height: 56px;
  transition: background-color 0.2s ease;

  &.disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  &:not(.disabled):hover {
    background-color: rgba(0, 0, 0, 0.04);
  }

  &:not(.disabled):active {
    background-color: rgba(0, 0, 0, 0.08);
  }

  .q-item__section--avatar {
    min-width: 40px;
  }
}

/* Animation classes */
:deep(.q-dialog__backdrop) {
  background-color: rgba(0, 0, 0, 0.5);
}
</style>
