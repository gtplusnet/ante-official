<template>
  <div class="request-item" :class="statusClass" @click="$emit('click')">
    <div class="row items-center">
      <q-icon name="alarm_add" :style="{ color: '#FB8C00', fontSize: '20px' }" />
      <div class="text-title-small q-ml-sm">Overtime</div>
    </div>
    <div class="row items-center justify-between">
      <div>
        <span v-if="filing.date" class="text-body-small"
          >Date: <span class="text-label-medium">{{ formatDate(filing.date) }}</span></span
        >
        <span v-if="filing.hours" class="text-body-small q-ml-md"
          >Hours: <span class="text-label-medium">{{ filing.hours }}</span></span
        >
      </div>
      <div class="text-grey-7" v-if="filing.status?.key !== 'REJECTED'">{{ filing.timeAgo }}</div>
    </div>
    <div v-if="filing.status?.key === 'REJECTED' && filing.rejectReason" class="reject-reason row justify-between">
      <div>
        <strong class="text-body-small q-mr-xs">Rejection Reason:</strong>
        <span class="text-label-medium"> {{ truncate(filing.rejectReason, 'REJECTION_REASON') }}</span>
      </div>
      <div class="text-grey-6 text-label-small">{{ filing.timeAgo }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Filing } from '../../types/filing.types';
import { truncate } from 'src/utility/formatter';

const props = defineProps<{
  filing: Filing;
}>();

defineEmits<{
  click: [];
}>();

const statusClass = computed(() => {
  if (props.filing.status?.key === 'APPROVED') return 'approved';
  if (props.filing.status?.key === 'REJECTED') return 'rejected';
  return '';
});

const formatDate = (dateFormat: any) => {
  if (!dateFormat) return '';
  // Handle DateFormat object or plain string
  const dateValue = dateFormat.raw || dateFormat;
  const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
};
</script>

<style scoped src="../../RequestPanelWidget.scss"></style>
