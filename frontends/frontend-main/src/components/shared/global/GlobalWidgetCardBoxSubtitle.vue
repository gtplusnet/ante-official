<template>
  <div class="global-widget-card-box-subtitle">
    <span v-if="label" class="text-body-small text-grey">{{ label }}:</span>
    <span class="text-body-small text-grey" :title="showTooltip ? value : undefined">{{ formattedValue }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  label?: string
  value?: string
  maxLength?: number
}

const props = withDefaults(defineProps<Props>(), {
  maxLength: 100
})

const formattedValue = computed(() => {
  if (!props.value) return ''
  if (props.value.length <= props.maxLength) return props.value
  return props.value.substring(0, props.maxLength) + '...'
})

const showTooltip = computed(() => {
  return props.value && props.value.length > props.maxLength
})
</script>

<style scoped>
.global-widget-card-box-subtitle {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 4px;
}

.global-widget-card-box-subtitle span[title] {
  cursor: help;
}
</style>
