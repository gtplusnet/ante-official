<template>
  <div class="request-item" :class="statusClass" @click="$emit('click')">
    <div class="row items-center">
      <q-icon name="brightness_6" :style="{ color: '#8E24AA', fontSize: '20px' }" />
      <div class="text-title-small q-ml-sm">Schedule Adjustment</div>
    </div>

    <!-- Main information row -->
    <div class="row items-center justify-between">
      <div>
        <span v-if="filing.date" class="text-body-small"
          >Date: <span class="text-label-medium">{{ formatDate(filing.date) }}</span></span
        >
      </div>
      <div class="text-grey-7 text-label-small" v-if="filing.status?.key !== 'REJECTED'">{{ filing.timeAgo }}</div>
    </div>

    <!-- Shift details -->
    <div v-if="filing.shiftData" class="shift-details">
      <!-- Working hours schedule if Time Bound -->
      <div v-if="filing.shiftData.shiftType === 'TIME_BOUND' && filing.shiftData.workingHours?.length > 0" class="time-schedule q-mt-xs">
        <div class="text-body-small text-grey-7">Schedule:</div>
        <div v-for="(hours, index) in filing.shiftData.workingHours" :key="index" class="text-body-small">
          <span :class="{ 'text-orange-7': hours.isBreakTime }">
            {{ formatTime(hours.startTime) }} - {{ formatTime(hours.endTime) }}
            <span v-if="hours.isBreakTime" class="text-body-small">(Break)</span>
          </span>
        </div>
      </div>
    </div>

    <!-- File attachment indicator -->
    <div v-if="filing.file" class="file-indicator q-mt-xs">
      <q-icon name="attach_file" size="16px" class="q-mr-xs" />
      <span class="text-body-small">File attached</span>
    </div>

    <!-- Rejection reason -->
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

const formatTime = (time: string) => {
  if (!time) return '';
  // Convert 24-hour format to 12-hour format with AM/PM
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour}:${minutes} ${ampm}`;
};
</script>

<style scoped src="../../RequestPanelWidget.scss"></style>
