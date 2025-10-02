<template>
  <q-input
    v-model="date"
    type="date"
    :label="label"
    :placeholder="placeholder"
    dense
    outlined
    rounded
    class="date-picker"
  >
    <template v-slot:prepend>
      <q-icon name="event" />
    </template>
  </q-input>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  modelValue: string;
  label?: string;
  placeholder?: string;
}

const props = withDefaults(defineProps<Props>(), {
  label: '',
  placeholder: 'Select date',
});

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

const date = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});
</script>

<style scoped>
.date-picker {
  min-width: 150px;
}

.date-picker :deep(.q-field__control) {
  height: 36px !important;
}

.date-picker :deep(.q-field__marginal) {
  height: 36px !important;
}

.date-picker :deep(.q-field__native),
.date-picker :deep(.q-field__prefix),
.date-picker :deep(.q-field__suffix) {
  padding-top: 14px !important;
  padding-bottom: 2px !important;
  /* padding-top: 14px !important;
  padding-bottom: 10px !important; */
  font-size: 12px;
}

.date-picker :deep(.q-field__label) {
  /* top: 0; */
  /* transform: translateY(0); */
  /* background-color: #fff;
  color: var(--q-dark); */
  /* padding: 2px 8px; */
  font-size: 11px;
}


</style>
