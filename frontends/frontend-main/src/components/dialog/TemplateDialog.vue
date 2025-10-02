<template>
  <q-card
    :style="dialogStyles"
    :class="[
      'dialog-card',
      {
        'full-width': fullWidth,
        'fullscreen-mode': isFullscreenMode
      }
    ]"
    style="display: flex; flex-direction: column;"
  >
    <!-- Header -->
    <div class="header-border q-py-md">
      <q-bar dark>
        <slot name="DialogIcon">
          <q-icon v-if="icon" :name="icon" :style="{ color: iconColor }" />
        </slot>
        <div class="text-title-large">
          <slot name="DialogTitle">Dialog Title</slot>
        </div>
        <q-space />
        <slot name="DialogQuickActions" />
        <slot name="DialogCloseButton">
          <GButton
            tooltip="Close"
            icon="close"
            icon-size="md"
            variant="icon"
            color="gray"
            v-close-popup
          />
        </slot>
      </q-bar>
    </div>

    <!-- Content -->
    <div
      class="dialog-content"
      :class="{ 'q-pr-none': isScrollableComputed, 'q-pa-none': normalizedNoPadding }"
      style="flex: 1 1 auto; min-height: 0; display: flex; flex-direction: column;"
    >
      <div
        ref="scrollableContent"
        :style="scrollableContentStyles"
        :class="[
          'dialog-content-inner',
          { 'no-scrollbar': !isScrollableEnabled }
        ]"
      >
        <slot name="DialogContent">
          <div class="text-body-medium">
            Dialog content goes here...
          </div>
        </slot>
      </div>
    </div>

    <!-- Footer -->
    <q-card-section
      v-if="hasDialogActions"
      class="footer-border q-pa-md w-full"
    >
    <div class="row justify-between">
      <div class="q-gutter-x-sm">
        <slot name="DialogMainActions" />
      </div>
      <q-space />
      <div class="q-gutter-x-sm">
        <slot name="DialogSubmitActions" />
      </div>
    </div>
    </q-card-section>
  </q-card>
</template>

<style scoped>
/* Scrollbar Styling */
.no-scrollbar {
  scrollbar-width: none;  /* Firefox */
  -ms-overflow-style: none;  /* IE and Edge */
  &::-webkit-scrollbar {
    display: none;  /* Chrome, Safari and Opera */
  }
}

/* Layout */
.dialog-card {
  overflow: hidden;
  display: flex;
  flex-direction: column;
  border-radius: 16px;
  min-height: 0;
}

.dialog-content {
  flex: 1 1 auto;
  min-height: 0;
  width: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.dialog-content-inner {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
  width: 100%;
  display: flex;
  flex-direction: column;
}

/* Borders */
.header-border,
.footer-border {
  background-color: transparent;
}

.footer-border {
  border-top: 1px solid rgba(0, 0, 0, 0.1);
}

/* Fullscreen mode styles */
.dialog-card.fullscreen-mode {
  border-radius: 0 !important;
  max-height: 100vh !important;
  max-width: 100vw !important;
}

.fullscreen-mode .header-border {
  border-radius: 0;
}

.fullscreen-mode .dialog-content {
  max-height: calc(100dvh - 120px); /* Account for header and footer */
}

.fullscreen-mode .dialog-content-inner {
  padding: 16px;

  @media (max-width: 768px) {
    padding: 0;
  }
}

@media (max-width: 599px) {
  .fullscreen-mode .dialog-content-inner {
    padding: 0;
  }
}
</style>

<script>
import { useQuasar } from 'quasar';
import GButton from 'src/components/shared/buttons/GButton.vue';

// Constants
const DIALOG_SIZES = {
  xs: { width: '300px', minWidth: '300px', maxWidth: '400px' },
  sm: { width: '500px', minWidth: '400px', maxWidth: '600px' },
  md: { width: '800px', minWidth: '600px', maxWidth: '900px' },
  lg: { width: '1000px', minWidth: '800px', maxWidth: '1200px' },
  xl: { width: '1200px', minWidth: '1000px', maxWidth: '1400px' },
  full: { width: '100%', minWidth: '100%', maxWidth: '100%', height: '100%' },
};

const POSITION_VALUES = {
  x: { left: '0', center: '50%', right: '100%' },
  y: { top: '0', center: '50%', bottom: '100%' },
};

// Validators
const cssUnitValidator = (value) => !value || /^\d+(px|%|vw|vh|rem|em|auto)$/.test(value);
const booleanLikeValidator = (value) =>
  typeof value === 'boolean' || (typeof value === 'string' && (value === 'true' || value === 'false'));

export default {
  name: 'TemplateDialog',
  inheritAttrs: false,

  components: { GButton },

  props: {
    // Size related props
    minWidth: { type: String, default: '600px' },
    maxWidth: { type: String, default: 'auto' },
    width: { type: String, default: '', validator: cssUnitValidator },
    height: { type: String, default: '', validator: cssUnitValidator },
    maxHeight: { type: String, default: 'auto' },
    size: {
      type: String,
      default: '',
      validator: (value) => !value || Object.keys(DIALOG_SIZES).includes(value)
    },

    // Behavior props
    scrollable: {
      type: [Boolean, String],
      default: true,
      validator: booleanLikeValidator
    },
    fullWidth: { type: Boolean, default: true },
    noPadding: {
      type: [Boolean, String],
      default: false,
      validator: booleanLikeValidator
    },
    responsive: { type: Boolean, default: true },
    fullscreenBreakpoint: {
      type: String,
      default: 'md',
      validator: (value) => ['xs', 'sm', 'md', 'lg', 'xl'].includes(value)
    },

    // UI props
    icon: { type: String, default: '' },
    iconColor: { type: String, default: '' },
    positionX: {
      type: String,
      default: 'center',
      validator: (value) => [...Object.keys(POSITION_VALUES.x), '0', '50%', '100%'].includes(value)
    },
    positionY: {
      type: String,
      default: 'center',
      validator: (value) => [...Object.keys(POSITION_VALUES.y), '0', '50%', '100%'].includes(value)
    },
  },

  setup() {
    const q = useQuasar();
    return { q };
  },

  data: () => ({
    isContentScrollable: false,
    resizeObserver: null,
    hasDialogActions: false
  }),

  computed: {
    // Responsive mode detection
    isFullscreenMode() {
      if (!this.responsive || !this.q) return false;
      const breakpoint = this.fullscreenBreakpoint;
      return this.q.screen.lt[breakpoint];
    },

    // Normalized props
    normalizedNoPadding() {
      return typeof this.noPadding === 'string'
        ? this.noPadding === 'true'
        : this.noPadding;
    },

    isScrollableEnabled() {
      return typeof this.scrollable === 'string'
        ? this.scrollable === 'true'
        : this.scrollable;
    },

    // Computed styles
    dialogStyles() {
      // Fullscreen mode styles
      if (this.isFullscreenMode) {
        return {
          width: '100vw',
          height: '100vh',
          maxWidth: '100vw',
          maxHeight: '100vh',
          minWidth: '100vw',
          borderRadius: 0,
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          transform: 'none',
          margin: 0,
          display: 'flex',
          flexDirection: 'column'
        };
      }

      // Standard dialog styles
      return {
        ...this.sizeStyles,
        position: 'absolute',
        left: this.positionX === 'right' ? 'auto' : this.positionXValue,
        top: this.positionY === 'bottom' ? 'auto' : this.positionYValue,
        right: this.positionX === 'right' ? '0' : 'auto',
        bottom: this.positionY === 'bottom' ? '0' : 'auto',
        transform: `
          ${this.positionX === 'center' ? 'translateX(-50%)' : ''}
          ${this.positionY === 'center' ? 'translateY(-50%)' : ''}
        `.trim(),
        display: 'flex',
        flexDirection: 'column',
        maxHeight: '100vh'
      };
    },

    scrollableContentStyles() {
      const maxHeightValue = this.isFullscreenMode
        ? 'calc(100vh - 150px)' // Account for header and footer in fullscreen
        : (this.maxHeight || '70vh');

      return {
        flex: '1 1 auto',
        overflowY: this.isScrollableEnabled ? 'auto' : 'hidden',
        maxHeight: this.isScrollableEnabled ? maxHeightValue : 'none',
        width: '100%',
        overflowX: 'hidden',
        scrollbarWidth: this.isScrollableEnabled ? 'auto' : 'none',
        msOverflowStyle: this.isScrollableEnabled ? 'auto' : 'none'
      };
    },

    // Position helpers
    positionXValue() {
      return POSITION_VALUES.x[this.positionX] || this.positionX;
    },

    positionYValue() {
      return POSITION_VALUES.y[this.positionY] || this.positionY;
    },

    // Size helpers
    sizeStyles() {
      const baseStyles = {
        minWidth: this.minWidth,
        maxWidth: this.maxWidth,
        width: this.width || 'auto',
        height: this.height || 'auto',
      };

      return this.size ? { ...baseStyles, ...DIALOG_SIZES[this.size] } : baseStyles;
    },

    // For backward compatibility
    isScrollableComputed() {
      return this.isScrollableEnabled && this.isContentScrollable;
    },
  },

  methods: {
    checkScrollable() {
      if (!this.$refs.scrollableContent) {
        this.isContentScrollable = false;
        return;
      }
      const { scrollHeight, clientHeight } = this.$refs.scrollableContent;
      this.isContentScrollable = scrollHeight > clientHeight;
    },

    setupResizeObserver() {
      this.cleanupResizeObserver();

      if (this.$refs.scrollableContent) {
        this.resizeObserver = new ResizeObserver(() => this.checkScrollable());
        this.resizeObserver.observe(this.$refs.scrollableContent);
        window.addEventListener('resize', this.checkScrollable);
      }
    },

    cleanupResizeObserver() {
      if (this.resizeObserver) {
        this.resizeObserver.disconnect();
        this.resizeObserver = null;
      }
    },

    checkDialogActions() {
      this.hasDialogActions = !!(
        this.$slots.DialogSubmitActions ||
        this.$slots.DialogMainActions
      );
    },
  },

  mounted() {
    this.$nextTick(() => {
      this.setupResizeObserver();
      this.checkScrollable();
      this.checkDialogActions();
    });
  },

  updated() {
    this.checkDialogActions();
  },

  beforeUnmount() {
    this.cleanupResizeObserver();
    window.removeEventListener('resize', this.checkScrollable);
  },

  watch: {
    scrollable: {
      immediate: true,
      handler: 'checkScrollable'
    }
  },
};
</script>
