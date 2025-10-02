<template>
  <q-select v-model="filter" :options="filterOptions" dense outlined rounded class="filter-select" />
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  modelValue: string;
  options: string[];
}

const props = defineProps<Props>();
const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

const filter = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
});
const filterOptions = computed(() => props.options);
</script>

<style scoped>
.filter-select {
  width: 120px;
}
</style>
