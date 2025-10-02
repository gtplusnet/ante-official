<template>
  <table class="details-table">
    <thead class="text-title-small">
      <tr>
        <th colspan="4">{{ title }} ({{ computeData.totalTime.formatted || '-' }})</th>
      </tr>
    </thead>
    <thead class="text-title-small">
      <tr>
        <th class="text-center">{{ label }} Start</th>
        <th class="text-center">{{ label }} End</th>
        <th class="text-center">{{ label }} Span</th>
        <th class="text-center">Type</th>
      </tr>
    </thead>
    <tbody class="text-body-medium">
      <template v-if="computeData && computeData.coverageTime && computeData.coverageTime.length > 0">
        <tr
          v-for="overtime in computeData.coverageTime"
          :key="overtime.timeIn.seconds"
        >
          <td>{{ overtime.timeIn.time }}</td>
          <td>{{ overtime.timeOut.time }}</td>
          <td>{{ overtime.hours.formatted }}</td>
          <td>{{ overtime.breakdownTypeDetails?.label }}</td>
        </tr>
      </template>
      <template v-else>
        <tr>
          <td colspan="4" class="text-center text-grey-6">
            No {{ label }}
          </td>
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
import { TimekeepingComputeOutputResponse } from '@shared/response/timekeeping.response';
export default {
  name: 'SimulationOutputCompute',
  props: {
    title: {
      type: String,
      required: true,
    },
    label: {
      type: String,
      required: true,
    },
    computeData: {
      type: Object as () => TimekeepingComputeOutputResponse,
      required: true,
    },
  },
  data: () => ({}),
  watch: {},
  methods: {},
};
</script>
