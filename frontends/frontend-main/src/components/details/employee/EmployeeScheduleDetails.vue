<template>
  <div class="employee-schedule-details">
    <table class="details-table">
      <thead class="text-title-small">
        <tr>
          <th colspan="2" class="text-center">Schedule Details</th>
        </tr>
      </thead>
      <tbody class="text-body-small">
        <tr>
          <td>Schedule Code</td>
          <td>{{ schedule.scheduleCode }}</td>
        </tr>
        <tr>
          <td>Total Working Hours</td>
          <td>{{ schedule.totalWorkingHours.formatted }}</td>
        </tr>
      </tbody>
    </table>

    <table class="details-table">
      <thead class="text-label-medium">
        <tr>
          <th class="text-center">Shift Details</th>
          <th v-for="(shift, day) in schedule.dayScheduleDetails" :key="day">
            {{
              day.charAt(0).toUpperCase() + day.slice(1).replace('Shift', '')
            }}
          </th>
        </tr>
      </thead>
      <tbody class="text-body-small">
        <tr>
          <td><strong>Shift Code</strong></td>
          <td v-for="(shift, day) in schedule.dayScheduleDetails" :key="day">
            {{ shift.shiftCode }}
          </td>
        </tr>
        <tr>
          <td><strong>Shift Type</strong></td>
          <td v-for="(shift, day) in schedule.dayScheduleDetails" :key="day">
            {{ shift.shiftType.label }}
          </td>
        </tr>
        <tr>
          <td><strong>Break Hours</strong></td>
          <td v-for="(shift, day) in schedule.dayScheduleDetails" :key="day">
            {{ shift.breakHours.formatted }}
          </td>
        </tr>
        <tr>
          <td><strong>Target Hours</strong></td>
          <td v-for="(shift, day) in schedule.dayScheduleDetails" :key="day">
            {{ shift.targetHours.formatted }}
          </td>
        </tr>
        <tr>
          <td><strong>Total Work Hours</strong></td>
          <td v-for="(shift, day) in schedule.dayScheduleDetails" :key="day">
            {{ shift.totalWorkHours.formatted }}
          </td>
        </tr>
      </tbody>
    </table>

    <div
      v-for="(shift, day) in schedule.dayScheduleDetails"
      :key="day"
      class="day-schedule"
    >
      <table class="details-table">
        <thead class="text-title-small">
          <tr>
            <th colspan="3" class="text-center">
              {{
                day.charAt(0).toUpperCase() + day.slice(1).replace('Shift', '')
              }}
              Shift Time
            </th>
          </tr>
          <tr class="text-label-medium">
            <th class="text-center">Start Time</th>
            <th class="text-center">End Time</th>
            <th class="text-center">Work Hours</th>
          </tr>
        </thead>
        <tbody class="text-body-small">
          <tr v-for="(time, index) in shift.shiftTime" :key="index">
            <td class="text-center">{{ time.startTime.time }}</td>
            <td class="text-center">{{ time.endTime.time }}</td>
            <td class="text-center">{{ time.workHours.formatted }}</td>
          </tr>
          <tr v-if="!shift.shiftTime.length">
            <td colspan="3" class="text-center">
              <em>No shift time available</em>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped lang="scss" src="./EmployeeDetail.scss"></style>

<script>
export default {
  name: 'EmployeeScheduleDetails',
  props: {
    schedule: {
      type: Object,
      required: true,
    },
  },
};
</script>
