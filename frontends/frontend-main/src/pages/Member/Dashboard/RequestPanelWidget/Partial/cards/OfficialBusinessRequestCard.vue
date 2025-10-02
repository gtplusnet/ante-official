<template>
  <div class="request-item" :class="statusClass" @click="$emit('click')">
    <div class="row items-center">
      <q-icon name="work_history" :style="{ color: '#1E88E5', fontSize: '20px' }" />
      <div class="text-title-small q-ml-sm">Official Business</div>
    </div>
    <div class="row items-center justify-between">
      <div>
        <span v-if="filing.timeIn || filing.timeOut">
          Duration: <span class="text-label-medium">{{ formatDateRange(filing.timeIn, filing.timeOut) }}</span>
        </span>
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

const formatDateRange = (startDateFormat: any, endDateFormat: any) => {
  if (!startDateFormat && !endDateFormat) return 'Not specified';

  // Handle DateFormat objects or plain strings
  const startValue = startDateFormat?.raw || startDateFormat;
  const endValue = endDateFormat?.raw || endDateFormat;
  
  const start = startValue ? (typeof startValue === 'string' ? new Date(startValue) : startValue) : null;
  const end = endValue ? (typeof endValue === 'string' ? new Date(endValue) : endValue) : null;

  const formatUTCDate = (date: Date) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getUTCMonth()]} ${date.getUTCDate()}`;
  };

  const formatUTCTime = (date: Date) => {
    const hours = date.getUTCHours();
    const minutes = date.getUTCMinutes();
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  if (start && end) {
    const startStr = formatUTCDate(start);
    const endStr = formatUTCDate(end);

    // If same day, show date and time range
    if (startStr === endStr) {
      return `${startStr}, ${formatUTCTime(start)} - ${formatUTCTime(end)}`;
    }

    return `${startStr} - ${endStr}`;
  }

  return start ? formatUTCDate(start) : end ? formatUTCDate(end) : '';
};
</script>

<style scoped src="../../RequestPanelWidget.scss"></style>
