<template>
  <div>
    <table class="details-table">
      <thead class="text-title-small">
        <tr>
          <th colspan="4">Time Keeping Summary</th>
        </tr>
      </thead>
      <tbody class="text-body-medium">
        <tr>
          <td width="25%" class="text-left">Work Time</td>
          <td width="25%" class="text-center" :class="timekeepingSummary.worktime.raw > 0 ? 'text-black' : 'text-grey'">{{ timekeepingSummary.worktime.formatted }}</td>
          <td width="25%" class="text-left">Overtime</td>
          <td width="25%" class="text-center" :class="timekeepingSummary.overtime.raw > 0 ? 'text-black' : 'text-grey'">{{ timekeepingSummary.overtime.formatted }}</td>
        </tr>
        <tr>
          <td width="25%" class="text-left">Late</td>
          <td width="25%" class="text-center" :class="timekeepingSummary.late.raw > 0 ? 'text-black' : 'text-grey'">
            {{ timekeepingSummary.late.formatted }}
          </td>
          <td width="25%" class="text-left">Under Time</td>
          <td width="25%" class="text-center" :class="timekeepingSummary.undertime.raw > 0 ? 'text-black' : 'text-grey'">
            {{ timekeepingSummary.undertime.formatted }}
          </td>
        </tr>
        <tr>
          <td width="25%" class="text-left">Night Differential</td>
          <td width="25%" class="text-center" :class="timekeepingSummary.nightDifferential.raw > 0 ? 'text-black' : 'text-grey'">
            {{ timekeepingSummary.nightDifferential.formatted }}
          </td>
          <td width="25%" class="text-left">Night Differential Overtime</td>
          <td width="25%" class="text-center" :class="timekeepingSummary.nightDifferentialOvertime.raw > 0 ? 'text-black' : 'text-grey'">
            {{ timekeepingSummary.nightDifferentialOvertime.formatted }}
          </td>
        </tr>
        <tr>
          <td width="25%" class="text-left">Break Time</td>
          <td width="25%" class="text-center" :class="timekeepingSummary.breaktime.raw > 0 ? 'text-black' : 'text-grey'">
            {{ timekeepingSummary.breaktime.formatted }}
          </td>
          <td width="25%" class="text-left">Credited Time</td>
          <td width="25%" class="text-center" :class="timekeepingSummary.totalCreditedHours.raw > 0 ? 'text-black' : 'text-grey'">
            {{ timekeepingSummary.totalCreditedHours.formatted }}
          </td>
        </tr>
        <tr v-if="timekeepingSummary.approvedLeaveCount > 0">
          <td width="25%" class="text-left">Approved Leave Days</td>
          <td width="25%" class="text-center text-info">{{ timekeepingSummary.approvedLeaveCount }}</td>
          <td width="25%" class="text-left">Leave Hours</td>
          <td width="25%" class="text-center text-info">{{ timekeepingSummary.approvedLeaveHours?.formatted || '0:00' }}</td>
        </tr>
        <tr v-if="timekeepingSummary.leaveWithPayCount > 0 || timekeepingSummary.leaveWithoutPayCount > 0">
          <td width="25%" class="text-left">Leave With Pay</td>
          <td width="25%" class="text-center" :class="timekeepingSummary.leaveWithPayCount > 0 ? 'text-positive' : 'text-grey'">
            {{ timekeepingSummary.leaveWithPayCount || 0 }}
          </td>
          <td width="25%" class="text-left">Leave Without Pay</td>
          <td width="25%" class="text-center" :class="timekeepingSummary.leaveWithoutPayCount > 0 ? 'text-warning' : 'text-grey'">
            {{ timekeepingSummary.leaveWithoutPayCount || 0 }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style
  scoped
  lang="scss"
  src="../TimeKeepingSimulationOutputDialog.scss"
></style>

<script lang="ts">
import { TimekeepingSummaryResponse } from '@shared/response/timekeeping.response';

export default {
  name: 'SimulationOutputSummary',
  props: {
    timekeepingSummary: {
      type: Object as () => TimekeepingSummaryResponse,
      required: true,
    },
  },
  data: () => ({}),
  watch: {},
  methods: {},
};
</script>
