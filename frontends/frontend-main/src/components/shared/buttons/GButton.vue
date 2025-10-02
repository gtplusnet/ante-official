<template>
  <q-btn
    v-bind="$attrs"
    :no-caps="noCaps"
    :label="label"
    :color="color || 'primary'"
    :text-color="textColor"
    :icon="icon || undefined"
    :loading="loading"
    :disable="disable"
    :rounded="rounded"
    :round="['icon'].includes(variant)"
    :outline="variant === 'outline'"
    :flat="['text', 'tonal', 'icon'].includes(variant)"
    :unelevated="variant === 'filled'"
    :elevated="variant === 'elevated'"
    :size="size"
    :class="buttonClasses"
    :align="align"
    :dense="['icon'].includes(variant)"
    :style="iconStyles"
    @click="$emit('click', $event)"
  >
    <q-tooltip v-if="tooltip" :delay="300">
      {{ tooltip }}
    </q-tooltip>
    <slot></slot>
    <template v-if="$slots.icon" #default>
      <slot name="icon"></slot>
    </template>
    <template v-slot:loading>
      <q-spinner-dots color="primary"/>
    </template>
  </q-btn>
</template>

<script>
const ICON_SIZES = ['xs', 'sm', 'md', 'lg', 'xl', ''];
const BUTTON_SIZES = ['xs', 'sm', 'md', 'lg', 'xl'];
const VARIANTS = ['filled', 'outline', 'elevated', 'tonal', 'text', 'icon'];
const TEXT_ALIGN_OPTIONS = ['left', 'center', 'right', 'justify'];

export default {
  name: 'GButton',

  props: {
    label: {
      type: String,
      default: ''
    },
    tooltip: {
      type: String,
      default: ''
    },
    color: {
      type: String,
      default: 'primary'
    },
    textColor: {
      type: String,
      default: ''
    },
    icon: {
      type: String,
      default: ''
    },
    iconColor: {
      type: String,
      default: ''
    },
    iconSize: {
      type: String,
      default: '',
      validator: value => ICON_SIZES.includes(value)
    },
    loading: Boolean,
    disable: Boolean,
    rounded: {
      type: Boolean,
      default: true
    },
    block: Boolean,
    align: {
      type: String,
      default: 'center',
      validator: value => TEXT_ALIGN_OPTIONS.includes(value)
    },
    size: {
      type: String,
      default: 'md',
      validator: value => BUTTON_SIZES.includes(value)
    },
    variant: {
      type: String,
      default: 'filled',
      validator: value => VARIANTS.includes(value)
    },
    textAlign: {
      type: String,
      default: 'center',
      validator: value => TEXT_ALIGN_OPTIONS.includes(value)
    },
    customClass: {
      type: String,
      default: ''
    },
    noCaps: {
      type: Boolean,
      default: true
    }
  },

  emits: ['click'],

  computed: {
    buttonClasses() {
      return [
        this.customClass,
        { 'full-width': this.block },
        { 'no-icon-padding': !this.icon && !this.$slots.icon },
        'g-button',
        `g-button--${this.variant}`
      ];
    },
    iconStyles() {
      const styles = {};
      
      // Handle icon color
      if (this.iconColor) {
        styles['--q-btn-icon-color'] = this.iconColor;
      }
      
      // Handle icon size
      if (this.iconSize) {
        const sizeMap = {
          'xs': '12px',
          'sm': '16px',
          'md': '20px',
          'lg': '24px',
          'xl': '28px'
        };
        
        if (sizeMap[this.iconSize]) {
          styles['--q-btn-icon-size'] = sizeMap[this.iconSize];
        }
      }
      
      return Object.keys(styles).length > 0 ? styles : null;
    }
  }
};
</script>

<style scoped>
.g-button {
  transition: all 0.3s ease;
}

.g-button :deep(.q-icon) {
  color: var(--q-btn-icon-color) !important;
  font-size: var(--q-btn-icon-size) !important;
}

.g-button.q-btn--rounded {
  border-radius: 50px;
}

.g-button--outline {
  background: transparent !important;
}

.g-button--tonal {
  opacity: 0.8;
  background: rgba(0, 0, 0, 0.08) !important;
}

.g-button--text {
  background: transparent !important;
  box-shadow: none;
}

.g-button--icon {
  background: transparent !important;
  box-shadow: none;
}

/* Remove padding when no icon is present */
.q-btn.no-icon-padding :deep(.q-btn__content) {
  padding: 0;
}
</style>
