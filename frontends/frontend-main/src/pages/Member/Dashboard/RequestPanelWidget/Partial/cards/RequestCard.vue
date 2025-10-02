<template>
  <component 
    :is="cardComponent" 
    :filing="filing"
    @click="$emit('click', filing)"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import OvertimeRequestCard from './OvertimeRequestCard.vue';
import OfficialBusinessRequestCard from './OfficialBusinessRequestCard.vue';
import CertificateOfAttendanceRequestCard from './CertificateOfAttendanceRequestCard.vue';
import ScheduleAdjustmentRequestCard from './ScheduleAdjustmentRequestCard.vue';
import LeaveRequestCard from './LeaveRequestCard.vue';
import type { Filing } from '../../types/filing.types';

const props = defineProps<{
  filing: Filing;
}>();

defineEmits<{
  click: [filing: Filing];
}>();

const cardComponents: Record<string, typeof OvertimeRequestCard> = {
  OVERTIME: OvertimeRequestCard,
  OFFICIAL_BUSINESS_FORM: OfficialBusinessRequestCard,
  CERTIFICATE_OF_ATTENDANCE: CertificateOfAttendanceRequestCard,
  SCHEDULE_ADJUSTMENT: ScheduleAdjustmentRequestCard,
  LEAVE: LeaveRequestCard,
};

const cardComponent = computed(() => {
  const filingType = props.filing?.filingType?.key;
  return filingType && cardComponents[filingType] ? cardComponents[filingType] : 'div';
});
</script>