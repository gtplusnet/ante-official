<template>
  <div class="request-item" :class="statusClass" @click="$emit('click')">
    <div class="row items-center">
      <q-icon name="event_busy" :style="{ color: '#00897B', fontSize: '20px' }" />
      <div class="text-title-small q-ml-sm">{{ leaveType }}</div>
    </div>
    <div class="row items-center justify-between">
      <div>
        <span class="text-body-small q-mr-sm">Type: <span class="text-bold">{{ filing.leaveData?.leaveType }}</span></span>
        <span class="text-body-small">Duration: <span class="text-bold">{{ formatDateRange() }}</span></span>
      </div>
      <div class="text-grey-7 text-label-small" v-if="filing.status?.key !== 'REJECTED'">{{ filing.timeAgo }}</div>
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

const leaveType = computed(() => {
  // Future implementation will read from leaveData
  return 'Leave Request';
});

const formatDateRange = () => {
  const timeIn = props.filing.timeIn as any;
  const timeOut = props.filing.timeOut as any;
  
  if (!timeIn) return '';
  
  // Handle both string and DateFormat types
  const startDateStr = typeof timeIn === 'string' ? timeIn : timeIn.raw || timeIn.dateTime;
  const endDateStr = timeOut ? (typeof timeOut === 'string' ? timeOut : timeOut.raw || timeOut.dateTime) : null;
  
  const startDate = new Date(startDateStr);
  const endDate = endDateStr ? new Date(endDateStr) : null;
  
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const startMonth = months[startDate.getUTCMonth()];
  const startDay = startDate.getUTCDate();
  const startYear = startDate.getUTCFullYear();
  
  if (!endDate || startDate.toDateString() === endDate.toDateString()) {
    // Single day or same day
    return `${startMonth} ${startDay}, ${startYear}`;
  }
  
  const endDay = endDate.getUTCDate();
  const endMonth = months[endDate.getUTCMonth()];
  const endYear = endDate.getUTCFullYear();
  
  // Check if same month and year
  if (startMonth === endMonth && startYear === endYear) {
    return `${startMonth} ${startDay} - ${endDay}, ${startYear}`;
  }
  
  // Different months or years
  if (startYear === endYear) {
    return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${startYear}`;
  }
  
  return `${startMonth} ${startDay}, ${startYear} - ${endMonth} ${endDay}, ${endYear}`;
};
</script>

<style scoped src="../../RequestPanelWidget.scss"></style>
