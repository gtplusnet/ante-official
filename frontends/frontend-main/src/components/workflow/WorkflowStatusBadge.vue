<template>
  <q-chip
    :style="chipStyle"
    :color="!isHexColor ? chipColor : undefined"
    :text-color="!isHexColor ? textColor : undefined"
    :size="size"
    :square="square"
    class="workflow-status-badge q-px-md q-py-xs"
  >
    <span class="text-weight-medium">{{ displayLabel }}</span>
    <q-tooltip v-if="showTooltip && tooltipText" :delay="300">
      {{ tooltipText }}
    </q-tooltip>
  </q-chip>
</template>

<script>
import { defineComponent, computed } from 'vue';

export default defineComponent({
  name: 'WorkflowStatusBadge',
  props: {
    stage: {
      type: Object,
      default: null
    },
    status: {
      type: String,
      default: null
    },
    size: {
      type: String,
      default: 'md'
    },
    dense: {
      type: Boolean,
      default: false
    },
    square: {
      type: Boolean,
      default: false
    },
    showTooltip: {
      type: Boolean,
      default: true
    },
    customLabel: {
      type: String,
      default: null
    }
  },
  setup(props) {
    // Compute the display label
    const displayLabel = computed(() => {
      if (props.customLabel) return props.customLabel;
      if (props.stage?.name) return props.stage.name;
      if (props.status) return formatStatus(props.status);
      return 'Unknown';
    });

    // Check if the color is a hex color
    const isHexColor = computed(() => {
      return props.stage?.color && props.stage.color.startsWith('#');
    });

    // Compute chip color based on stage or status
    const chipColor = computed(() => {
      // Use stage color if available (already in hex format)
      if (props.stage?.color && !isHexColor.value) {
        return props.stage.color;
      }

      // Otherwise determine color based on status
      const statusLower = (props.status || '').toLowerCase();
      if (statusLower.includes('approved') || statusLower === 'completed') {
        return 'positive';
      } else if (statusLower.includes('rejected') || statusLower === 'cancelled') {
        return 'negative';
      } else if (statusLower.includes('pending') || statusLower === 'active') {
        return 'warning';
      } else if (statusLower === 'draft') {
        return 'grey';
      }
      return 'primary';
    });

    // Compute text color
    const textColor = computed(() => {
      // Use stage text color if available
      if (props.stage?.textColor && !isHexColor.value) {
        return props.stage.textColor;
      }
      // Default to white for better contrast
      return 'white';
    });

    // Compute chip style for hex colors
    const chipStyle = computed(() => {
      if (isHexColor.value && props.stage?.color) {
        // Calculate text color based on background brightness
        const textColor = props.stage.textColor || getContrastTextColor(props.stage.color);
        return {
          backgroundColor: props.stage.color,
          color: textColor,
          borderColor: props.stage.color
        };
      }
      return {};
    });

    // Compute icon based on stage or status
    const icon = computed(() => {
      if (props.stage?.isFinal) {
        return 'check_circle';
      }
      if (props.stage?.isInitial) {
        return 'schedule';
      }

      const statusLower = (props.status || '').toLowerCase();
      if (statusLower.includes('approved') || statusLower === 'completed') {
        return 'check_circle';
      } else if (statusLower.includes('rejected')) {
        return 'cancel';
      } else if (statusLower === 'cancelled') {
        return 'block';
      } else if (statusLower.includes('pending')) {
        return 'hourglass_empty';
      } else if (statusLower === 'active') {
        return 'play_circle';
      }
      return null;
    });

    // Compute tooltip text
    const tooltipText = computed(() => {
      if (props.stage?.description) {
        return props.stage.description;
      }
      if (props.status === 'ACTIVE') {
        return 'Workflow is currently active and in progress';
      }
      if (props.status === 'COMPLETED') {
        return 'Workflow has been completed successfully';
      }
      if (props.status === 'CANCELLED') {
        return 'Workflow has been cancelled';
      }
      return null;
    });

    // Helper function to format status text
    const formatStatus = (status) => {
      if (!status) return 'Unknown';
      // Convert snake_case or UPPER_CASE to Title Case
      return status
        .replace(/_/g, ' ')
        .toLowerCase()
        .replace(/\b\w/g, (char) => char.toUpperCase());
    };

    // Helper function to determine contrast text color
    const getContrastTextColor = (hexColor) => {
      // Remove # if present
      const hex = hexColor.replace('#', '');
      
      // Convert to RGB
      const r = parseInt(hex.substr(0, 2), 16);
      const g = parseInt(hex.substr(2, 2), 16);
      const b = parseInt(hex.substr(4, 2), 16);
      
      // Calculate brightness using YIQ formula
      const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
      
      // Return black for light colors, white for dark colors
      return yiq >= 128 ? '#000000' : '#FFFFFF';
    };

    return {
      displayLabel,
      chipColor,
      chipStyle,
      textColor,
      isHexColor,
      icon,
      tooltipText
    };
  }
});
</script>

<style lang="scss" scoped>
.workflow-status-badge {
  font-size: 0.875rem;
  
  // Custom color handling for hex colors
  &[style*="background"] {
    // Ensure proper text visibility when using custom colors
    .q-chip__content {
      font-weight: 500;
    }
  }
}
</style>