<template>
  <table class="details-table">
    <thead class="text-title-small">
      <tr>
        <th colspan="4">{{ label }}</th>
      </tr>
    </thead>
    <thead class="text-title-small">
      <tr>
        <th>Time In</th>
        <th>Time Out</th>
        <th>Hours Spent</th>
        <th v-if="isProcessed">Type</th>
      </tr>
    </thead>
    <tbody class="text-body-medium">
      <template v-if="timeBreakdown.length > 0">
        <tr v-for="time in timeBreakdown" :key="time.timeIn.raw">
          <td>{{ time.timeIn.time }}</td>
          <td>{{ time.timeOut.time }}</td>
          <td>{{ time.hours.formatted }}</td>
          <td v-if="isProcessed">{{ time.breakdownTypeDetails?.label || '-' }}</td>
        </tr>
      </template>
      <template v-else>
        <tr>
          <td :colspan="isProcessed ? 4 : 3" class="text-center text-grey-6">No Time Breakdown</td>
        </tr>
      </template>
    </tbody>
  </table>
</template>

<style
  scoped
  lang="scss"
  src="../TimeKeepingSimulationOutputDialog.scss"
></style>

<script lang="ts">
import { TimeBreakdownResponse } from '@shared/response/timekeeping.response';

export default {
  name: 'SimulationOutputTimeBreakdown',
  props: {
    label: {
      type: String,
      required: true,
    },
    isProcessed: {
      type: Boolean,
    },
    timeBreakdown: {
      type: Array as () => TimeBreakdownResponse[],
      required: true,
    },
  },
  data: () => ({
    isExtraDay: false,
    isRestDay: false,
    isRestDayApproved: false,
    specialHolidayCount: 0,
    regularHolidayCount: 0,
  }),
  watch: {},
  methods: {},
};
</script>
