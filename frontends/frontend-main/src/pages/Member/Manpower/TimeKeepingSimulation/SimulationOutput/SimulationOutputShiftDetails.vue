<template>
  <!-- Shift Details -->
  <table class="details-table">
    <thead class="text-title-small">
      <tr>
        <th colspan="7">Shifting</th>
      </tr>
    </thead>
    <thead class="text-title-small">
      <tr>
        <th class="text-center">Shift Code</th>
        <th class="text-center">Shift Type</th>
        <th class="text-center">Target Hours</th>
        <th class="text-center">Flexible Break Hours</th>
        <th class="text-center">Shift Work Hours</th>
        <th class="text-center">Shift Break Hours</th>
        <th class="text-center">Source</th>
      </tr>
    </thead>
    <tbody class="text-body-medium">
      <tr>
        <td>{{ activeShift.shiftCode }}</td>
        <td>{{ activeShift.shiftType.label }}</td>
        <td>{{ activeShift.targetHours.formatted }}</td>
        <td>{{ activeShift.breakHours.formatted }}</td>
        <td>{{ activeShift.totalWorkHours.formatted }}</td>
        <td>{{ activeShift.shiftBreakHours.formatted }}</td>
        <td>{{ activeShiftType.label }}</td>
      </tr>
    </tbody>
  </table>

  <!-- Shift Breakdown -->
  <table class="details-table">
    <thead class="text-title-small">
      <tr>
        <th class="text-center">Shift Start</th>
        <th class="text-center">Shift End</th>
        <th class="text-center">Hours</th>
        <th class="text-center">Break Time</th>
      </tr>
    </thead>
    <tbody class="text-body-medium">
      <template v-if="activeShift.shiftTime.length > 0">
        <tr v-for="shift in activeShift.shiftTime" :key="shift.startTime.raw">
          <td>{{ shift.startTime.time }}</td>
          <td>{{ shift.endTime.time }}</td>
          <td>{{ shift.workHours.formatted }}</td>
          <td>{{ shift.isBreakTime ? 'Yes' : 'No' }}</td>
        </tr>
      </template>
      <template v-else>
        <tr class="text-center ">
          <td colspan="5" >No Shift</td>
        </tr>
      </template>
    </tbody>
  </table>

  <!-- Shift Breakdown - Next Day -->
  <table class="details-table" v-if="activeShift.nextDayShiftTime && activeShift.nextDayShiftTime.length > 0">
    <thead class="text-title-small">
      <tr>
        <th colspan="5">Next Day Overlap</th>
      </tr>
    </thead>
    <thead class="text-title-small">
      <tr>
        <th class="text-center">Shift Start</th>
        <th class="text-center">Shift End</th>
        <th class="text-center">Hours</th>
        <th class="text-center">Break Time</th>
      </tr>
    </thead>
    <tbody class="text-body-medium">
      <template v-if="activeShift.nextDayShiftTime.length > 0">
        <tr v-for="shift in activeShift.nextDayShiftTime" :key="shift.startTime.raw">
          <td>{{ shift.startTime.time }}</td>
          <td>{{ shift.endTime.time }}</td>
          <td>{{ shift.workHours.formatted }}</td>
          <td>{{ shift.isBreakTime ? 'Yes' : 'No' }}</td>
        </tr>
      </template>
      <template v-else>
        <tr class="text-center text-grey-6">
          <td colspan="5" >No Shift</td>
        </tr>
      </template>
    </tbody>
  </table>
</template>

<style scoped lang="scss" src="../TimeKeepingSimulationOutputDialog.scss"></style>

<script lang="ts">
import { ShiftDataResponse, ActiveShiftTypeResponse } from "@shared/response";

export default {
  name: 'SimulationOutputShiftDetails',
  props: {
    activeShift: {
      type: Object as () => ShiftDataResponse,
      required: true,
    },
    activeShiftType: {
      type: Object as () => ActiveShiftTypeResponse,
      required: true,
    },
  },
  data: () => ({}),
  watch: {},
  methods: {},
};
</script>
