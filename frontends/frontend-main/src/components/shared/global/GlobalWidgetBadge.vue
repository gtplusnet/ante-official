<!--
  GlobalWidgetBadge Component

  A versatile badge component for displaying status, labels, or counts
  with customizable colors, sizes, and text truncation.

  Usage:
  <GlobalWidgetBadge variant="success" label="Active" />
  <GlobalWidgetBadge background-color="#FF5733" label="Custom" :max-chars="10" />
-->
<template>
  <div
    :class="badgeClasses"
    :style="{ backgroundColor: computedBackgroundColor, color: computedTextColor }"
  >
    <div class="badge-content">
      <q-icon
        v-if="icon"
        :name="icon"
        :size="iconSize"
        class="badge-icon"
      />
      <span v-if="!showTooltip || !isTruncated">{{ displayLabel }}</span>
      <span v-else>
        {{ displayLabel }}
        <q-tooltip>{{ label }}</q-tooltip>
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'custom';
  label?: string;
  backgroundColor?: string;
  textColor?: string;
  size?: 'sm' | 'md' | 'lg';
  icon?: string;
  maxChars?: number;
  showTooltip?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  label: '',
  backgroundColor: '',
  textColor: '',
  size: 'md',
  icon: '',
  maxChars: 20,
  showTooltip: true,
});

// Color variants mapping
const variantColors = {
  primary: { background: 'primary', text: 'white' },
  secondary: { background: 'grey-6', text: 'white' },
  success: { background: 'teal', text: 'white' },
  warning: { background: 'orange', text: 'black' },
  error: { background: 'red', text: 'white' },
  info: { background: 'light-blue', text: 'white' },
  custom: { background: '', text: '' },
};

// Computed background color
const computedBackgroundColor = computed(() => {
  if (props.backgroundColor) {
    return props.backgroundColor;
  }
  return variantColors[props.variant].background;
});

// Computed text color
const computedTextColor = computed(() => {
  if (props.textColor) {
    return props.textColor;
  }
  return variantColors[props.variant].text;
});

// Truncated label
const displayLabel = computed(() => {
  if (!props.label) return '';

  if (props.label.length > 5) {
    return props.label.substring(0, 6) + '';
  }
  return props.label;
});

// Check if label is truncated
const isTruncated = computed(() => {
  return props.label.length > 5;
});

// Size classes
const badgeClasses = computed(() => {
  const classes = ['global-widget-badge'];

  switch (props.size) {
    case 'sm':
      classes.push('g-badge text-body-small-f-[10px]');
      break;
    case 'lg':
      classes.push('text-label-large');
      break;
    default:
      classes.push('text-label-medium');
  }

  return classes.join(' ');
});

// Icon size based on badge size
const iconSize = computed(() => {
  switch (props.size) {
    case 'sm':
      return '14px';
    case 'lg':
      return '20px';
    default:
      return '16px';
  }
});
</script>

<style scoped lang="scss">
.global-widget-badge {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50px;
  padding: 0;

  .badge-content {
    display: flex;
    align-items: center;
    gap: 4px;

    .badge-icon {
      display: flex;
      align-items: center;
    }
  }

  // Additional padding adjustments for different sizes
  &.text-body-small {
    padding: 0;
  }

  &.text-label-medium {
    padding: 4px;
  }

  &.text-label-large {
    padding: 6px 16px;
  }
}

// Override Quasar's default badge styles if needed
:deep(.q-badge) {
  font-weight: 500;
  letter-spacing: 0.02em;
}
</style>
