<template>
  <div class="text-center text-title-medium text-primary title">
    {{ data.dateFormatted.dateFull }} ({{ data.dateFormatted.day }})
  </div>
  <div class="q-mt-sm">
    <q-tabs v-model="tab" dense class="text-grey text-label-large " active-color="primary" indicator-color="primary" align="justify"
      narrow-indicator>
      <q-tab name="time-breakdown" label="Time Breakdown" />
      <q-tab name="day-details" label="Day Details" />
      <q-tab name="computed-summary" label="Computed Summary" />
      <q-tab name="shift-details" label="Shift Details" />
      <q-tab name="filings" label="Filings" v-if="employeeAccountId" />
    </q-tabs>

    <q-tab-panels v-model="tab" animated>
      <!-- Time Breakdown -->
      <q-tab-panel name="time-breakdown">
        <SimulationOutputTimeBreakdown label="Actual Time In and Time Out" :timeBreakdown="data.timeBreakdown"></SimulationOutputTimeBreakdown>
        <SimulationOutputTimeBreakdown label="Processed Time In and Time Out" :isProcessed="true" :timeBreakdown="data.processedTimeBreakdown" :dayDetails="data.dayDetails"></SimulationOutputTimeBreakdown>
        <SimulationOutputTimeBreakdown label="Next Day Processed Time In and Time Out" :isProcessed="true" :timeBreakdown="data.nextDayProcessedTimeBreakdown" :dayDetails="data.dayDetails"></SimulationOutputTimeBreakdown>
      </q-tab-panel>

      <!-- Day Details -->
      <q-tab-panel name="day-details">
        <SimulationOutputDayDetails :dayDetails="data.dayDetails" :holidayList="data.holidayList" :gracePeriods="data.gracePeriods"></SimulationOutputDayDetails>
      </q-tab-panel>

      <!-- Computed Summary -->
      <q-tab-panel name="computed-summary">
        <SimulationOutputSummary :timekeepingSummary="data.timekeepingSummary"></SimulationOutputSummary>
      </q-tab-panel>

      <!-- Shift Details -->
      <q-tab-panel name="shift-details">
        <SimulationOutputShiftDetails :activeShift="data.activeShift" :activeShiftType="data.activeShiftType">
        </SimulationOutputShiftDetails>
      </q-tab-panel>

      <!-- Filings -->
      <q-tab-panel name="filings" v-if="employeeAccountId">
        <SimulationOutputFilings :employeeAccountId="employeeAccountId" :date="data.dateFormatted.raw" />
      </q-tab-panel>

    </q-tab-panels>
  </div>
</template>

<style scoped lang="scss" src="../TimeKeepingSimulationOutputDialog.scss"></style>

<script lang="ts">
import SimulationOutputTimeBreakdown from './SimulationOutputTimeBreakdown.vue';
import SimulationOutputShiftDetails from './SimulationOutputShiftDetails.vue';
import SimulationOutputSummary from './SimulationOutputSummary.vue';
import SimulationOutputDayDetails from './SimulationOutputDayDetails.vue';
import SimulationOutputFilings from './SimulationOutputFilings.vue';
import { defineComponent, ref, Ref } from 'vue';
import { TimekeepingOutputResponse } from '@shared/response/timekeeping.response';

export default defineComponent({
  name: 'TimeKeepingSimulationOutputDialog',
  components: {
    SimulationOutputTimeBreakdown,
    SimulationOutputShiftDetails,
    SimulationOutputSummary,
    SimulationOutputDayDetails,
    SimulationOutputFilings,
  },
  props: {
    data: {
      type: Object as () => TimekeepingOutputResponse,
      required: true,
    },
    employeeAccountId: {
      type: String,
      default: null,
    },
  },
  setup() {
    const tab: Ref<string> = ref('time-breakdown');

    return { tab };
  },
});
</script>
