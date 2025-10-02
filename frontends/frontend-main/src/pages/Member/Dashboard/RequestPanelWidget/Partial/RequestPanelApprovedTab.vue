<template>
  <div>
    <div v-if="isLoading" class="text-center q-pa-md">
      <q-spinner size="40px" color="primary" />
    </div>
    <div v-else-if="filings.length === 0" class="q-pa-xl text-center text-label-medium text-grey">No approved requests</div>
    <div v-else class="item-content">
      <RequestCard v-for="filing in filings" :key="filing.id" :filing="filing" @click="openFilingDialog(filing)" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import RequestCard from './cards/RequestCard.vue';
import { useFilings } from '../composables/useFilings';
import type { Filing } from '../types/filing.types';

const props = defineProps<{
  page: number;
  rowsPerPage: number;
}>();

const emit = defineEmits<{
  'update:total': [total: number];
  'open-dialog': [filing: Filing];
}>();

const { fetchFilings, isLoading } = useFilings();
const filings = ref<Filing[]>([]);

const loadData = async () => {
  const result = await fetchFilings('APPROVED', props.page - 1, props.rowsPerPage);
  filings.value = result.data;
  emit('update:total', result.total);
};

const openFilingDialog = (filing: Filing) => {
  emit('open-dialog', filing);
};

watch(() => props.page, loadData, { immediate: true });
</script>

<style scoped src="../RequestPanelWidget.scss"></style>
