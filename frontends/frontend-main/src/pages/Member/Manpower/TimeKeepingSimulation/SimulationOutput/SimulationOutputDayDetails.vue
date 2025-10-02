<template>
  <div>
    <table class="details-table">
        <thead class="text-title-small">
          <tr>
            <th colspan="5">Day Details</th>
          </tr>
          <tr>
            <th rowspan="2">Extra Day</th>
            <th colspan="2">Rest Day</th>
            <th rowspan="2">Special Holiday</th>
            <th rowspan="2">Regular Holiday</th>
          </tr>
          <tr>
            <th colspan="1">For Approval</th>
            <th colspan="1">Approved</th>
          </tr>
        </thead>
        <tbody class="text-body-medium">
          <tr>
            <td :class="dayDetails.isExtraDay ? 'text-black' : 'text-grey'">{{ dayDetails.isExtraDay ? 'Yes' : 'No' }} </td>
            <td :class="dayDetails.isRestDay ? 'text-black' : 'text-grey'">{{ dayDetails.isRestDay ? 'Yes' : 'No' }}</td>
            <td :class="dayDetails.isDayApproved ? 'text-black' : 'text-grey'">{{ dayDetails.isDayApproved ? 'Yes' : 'No' }}</td>
            <td :class="dayDetails.specialHolidayCount ? 'text-black' : 'text-grey'">{{ dayDetails.specialHolidayCount }}</td>
            <td :class="dayDetails.regularHolidayCount ? 'text-black' : 'text-grey'">{{ dayDetails.regularHolidayCount }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="q-mt-md">
      <table class="details-table">
        <thead class="text-title-small">
          <tr>
            <th colspan="3">Holiday List</th>
          </tr>
          <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Source</th>
          </tr>
        </thead>
        <tbody class="text-body-medium">
          <tr v-for="holiday in holidayList" :key="holiday.name">
            <td>{{ holiday.name }}</td>
            <td>{{ holiday.holidayType.label }}</td>
            <td>{{ holiday.source }}</td>
          </tr>
        </tbody>

        <tbody v-if="holidayList.length === 0">
          <tr>
            <td colspan="3" class="text-center text-grey">No holidays found</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="q-mt-md" v-if="gracePeriods">
      <table class="details-table">
        <thead class="text-title-small">
          <tr>
            <th colspan="3">Grace Period Details</th>
          </tr>
          <tr>
            <th>Type</th>
            <th>Grace Threshold</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody class="text-body-medium">
          <tr>
            <td>Late</td>
            <td>{{ gracePeriods.lateGraceTimeMinutes }} minutes</td>
            <td>
              <span :class="gracePeriods.lateGraceApplied ? 'text-positive' : 'text-grey'">
                <template v-if="gracePeriods.lateGraceApplied">
                  Grace Applied
                  <span class="text-label-medium">
                    ({{ gracePeriods.lateMinutesForgiven }} min late - within threshold)
                  </span>
                </template>
                <template v-else>
                  {{ (gracePeriods.lateMinutesForgiven || 0) > 0 ? 'Not Applied - Exceeded Threshold' : 'Not Applicable' }}
                </template>
              </span>
            </td>
          </tr>
          <tr>
            <td>Undertime</td>
            <td>{{ gracePeriods.undertimeGraceTimeMinutes }} minutes</td>
            <td>
              <span :class="gracePeriods.undertimeGraceApplied ? 'text-positive' : 'text-grey'">
                <template v-if="gracePeriods.undertimeGraceApplied">
                  Grace Applied
                  <span class="text-label-medium">
                    ({{ gracePeriods.undertimeMinutesForgiven }} min early - within threshold)
                  </span>
                </template>
                <template v-else>
                  {{ (gracePeriods.undertimeMinutesForgiven || 0) > 0 ? 'Not Applied - Exceeded Threshold' : 'Not Applicable' }}
                </template>
              </span>
            </td>
          </tr>
          <tr>
            <td>Overtime</td>
            <td>{{ gracePeriods.overtimeGraceTimeMinutes }} minutes</td>
            <td>
              <span :class="gracePeriods.overtimeGraceApplied ? 'text-positive' : 'text-grey'">
                <template v-if="gracePeriods.overtimeGraceApplied">
                  Grace Applied
                  <span class="text-label-medium">
                    ({{ gracePeriods.overtimeMinutesAdjusted }} min OT - within threshold)
                  </span>
                </template>
                <template v-else>
                  {{ (gracePeriods.overtimeMinutesAdjusted || 0) > 0 ? 'Not Applied - Exceeded Threshold' : 'Not Applicable' }}
                </template>
              </span>
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
import { DayDetails, TimekeepingHoliday, GracePeriodInfo } from '@shared/response/timekeeping.response';

export default {
  name: 'SimulationOutputTimeBreakdown',
  props: {
    dayDetails: {
      type: Object as () => DayDetails,
      required: true,
    },
    holidayList: {
      type: Array as () => Array<TimekeepingHoliday>,
      required: true,
    },
    gracePeriods: {
      type: Object as () => GracePeriodInfo | null,
      default: null,
    }
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
