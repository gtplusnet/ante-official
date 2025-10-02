<template>
  <div class="attendance-calendar-view">
    <!-- Calendar Grid -->
    <div class="calendar-container">
      <!-- Days of Week Header -->
      <div class="calendar-header">
        <div
          v-for="day in daysOfWeek"
          :key="day"
          class="calendar-header-cell text-dark text-label-medium"
        >
          {{ day }}
        </div>
      </div>

      <!-- Calendar Days -->
      <div class="calendar-body">
        <div
          v-for="date in calendarDates"
          :key="date.dateString"
          class="calendar-cell column justify-between cursor-pointer"
          :class="{
            'other-month text-grey-light': !date.isCurrentMonth,
            today: date.isToday,
            'has-conflict': date.hasConflict,
            'is-present': date.isPrimaryStatus === 'PRESENT',
            'is-absent': date.isPrimaryStatus === 'ABSENT',
            'is-holiday': date.isPrimaryStatus === 'HOLIDAY',
            'is-leave': date.isPrimaryStatus === 'LEAVE',
            'within-cutoff': date.isWithinCutoff,
          }"
          @click="handleDayClick(date)"
        >
          <div class="date-number text-body-medium">{{ date.day }}</div>
          <div class="attendance-details">
            <!-- Details Text -->
            <div
              v-if="date.details && date.details.length > 0 && date.isCurrentMonth"
              class="details-text"
            >
              <div class="row items-center">
                <!-- Status Icon -->
                <div v-if="date.statusIcon" class="status-icon row items-center q-mr-xs">
                  <q-icon
                    :name="date.statusIcon"
                    :size="date.isCurrentMonth ? '14px' : '14px'"
                    :class="date.iconClass"
                  />
                </div>
                <div
                  v-for="(detail, idx) in date.details.slice(0, 2)"
                  :key="idx"
                  class="text-label-small"
                  :class="getDetailClass(detail)"
                >
                  {{ detail }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Attendance Detail Dialog -->
    <q-dialog v-model="showDetailDialog" persistent>
      <q-card style="min-width: 400px">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">Attendance Details</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section v-if="selectedDay">
          <div class="text-subtitle1 q-mb-md">{{ formatDetailDate(selectedDay.dateString) }}</div>

          <!-- Disclaimer Message -->
          <q-banner class="bg-info text-white q-mb-md" rounded>
            <q-icon name="info" class="q-mr-sm" />
            <div class="text-caption">
              <strong>Note:</strong> All data shown here are computed based on timekeeping logs and
              are subject to change. Overtime calculations are for reference only and require proper
              filing and approval through the system.
            </div>
          </q-banner>

          <div class="row q-mb-md">
            <div class="col-6">
              <div class="text-caption text-grey">Time In</div>
              <div class="text-body2">{{ selectedDay.timeIn || 'No record' }}</div>
            </div>
            <div class="col-6">
              <div class="text-caption text-grey">Time Out</div>
              <div class="text-body2">{{ selectedDay.timeOut || 'No record' }}</div>
            </div>
          </div>

          <div v-if="selectedDay.workHours" class="q-mb-md">
            <div class="text-caption text-grey">Work Hours</div>
            <div class="text-body2">{{ formatWorkHours(selectedDay.workHours) }}</div>
          </div>

          <div v-if="selectedDay.originalDetails && selectedDay.originalDetails.length > 0" class="q-mb-md">
            <div class="text-caption text-grey q-mb-sm">Status Details</div>
            <q-chip
              v-for="(detail, idx) in selectedDay.originalDetails"
              :key="idx"
              :class="getChipClass(detail)"
              size="sm"
            >
              {{ detail }}
            </q-chip>
          </div>

          <div
            v-if="
              selectedDay.lateMinutes || selectedDay.undertimeMinutes || selectedDay.overtimeMinutes
            "
            class="row q-mb-md q-gutter-md"
          >
            <div v-if="selectedDay.lateMinutes" class="col-auto">
              <div class="text-caption text-grey">Late</div>
              <div class="text-body2 text-warning">{{ selectedDay.lateMinutes }} minutes</div>
            </div>
            <div v-if="selectedDay.undertimeMinutes" class="col-auto">
              <div class="text-caption text-grey">Undertime</div>
              <div class="text-body2 text-warning">{{ selectedDay.undertimeMinutes }} minutes</div>
            </div>
            <div v-if="selectedDay.overtimeMinutes" class="col-auto">
              <div class="text-caption text-grey">Overtime</div>
              <div class="text-body2 text-info">{{ selectedDay.overtimeMinutes }} minutes</div>
            </div>
          </div>

          <div v-if="selectedDay.remarks" class="q-mb-md">
            <div class="text-caption text-grey">Remarks</div>
            <div class="text-body2">{{ selectedDay.remarks }}</div>
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Close" color="primary" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script>
import { defineComponent, ref, computed } from 'vue';

export default defineComponent({
  name: 'AttendanceCalendarView',
  props: {
    attendanceData: {
      type: Array,
      default: () => [],
    },
    currentMonth: {
      type: Number,
      default: new Date().getMonth(),
    },
    currentYear: {
      type: Number,
      default: new Date().getFullYear(),
    },
    cutoffStart: {
      type: String,
      default: '',
    },
    cutoffEnd: {
      type: String,
      default: '',
    },
  },
  setup(props) {
    // Reactive state
    const showDetailDialog = ref(false);
    const selectedDay = ref(null);

    // Days of week
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Filter details to only show specific statuses
    const filterDetails = (details) => {
      if (!details || !Array.isArray(details)) return [];

      const allowedStatuses = ['Present', 'Absent', 'Holiday', 'Rest Day'];
      const filtered = details.filter(detail =>
        allowedStatuses.some(status => detail.includes(status))
      );

      // Transform holiday details to just show "Holiday"
      return filtered.map(detail => {
        if (detail.includes('Holiday:')) {
          return 'Holiday';
        }
        return detail;
      });
    };

    // Create attendance lookup map for quick access
    const attendanceMap = computed(() => {
      const map = new Map();
      props.attendanceData.forEach((record) => {
        map.set(record.date, record);
      });
      return map;
    });

    const calendarDates = computed(() => {
      const firstDay = new Date(props.currentYear, props.currentMonth, 1);
      const lastDay = new Date(props.currentYear, props.currentMonth + 1, 0);
      const firstDayOfWeek = firstDay.getDay();
      const today = new Date();
      const dates = [];

      // Add previous month's trailing days
      for (let i = firstDayOfWeek - 1; i >= 0; i--) {
        const prevDate = new Date(firstDay);
        prevDate.setDate(prevDate.getDate() - (i + 1));
        dates.push({
          day: prevDate.getDate(),
          dateString: prevDate.toISOString().split('T')[0],
          isCurrentMonth: false,
          isToday: false,
          attendance: null,
          details: [],
          hasConflict: false,
        });
      }

      // Add current month's days
      for (let day = 1; day <= lastDay.getDate(); day++) {
        const date = new Date(props.currentYear, props.currentMonth, day);
        const dateString = date.toISOString().split('T')[0];
        const isToday = date.toDateString() === today.toDateString();
        const attendance = attendanceMap.value.get(dateString);

        const dateObj = {
          day,
          dateString,
          isCurrentMonth: true,
          isToday,
          attendance,
          details: filterDetails(attendance?.details),
          originalDetails: attendance?.details || [], // Keep original details for dialog
          hasConflict: attendance?.hasConflict || false,
          isWithinCutoff: attendance?.isWithinCutoff || false,
          isPrimaryStatus: attendance?.status,
          statusIcon: getStatusIcon(attendance),
          iconClass: getIconClass(attendance),
          timeIn: attendance?.timeIn,
          timeOut: attendance?.timeOut,
          workHours: attendance?.workHours,
          lateMinutes: attendance?.lateMinutes,
          undertimeMinutes: attendance?.undertimeMinutes,
          overtimeMinutes: attendance?.overtimeMinutes,
          remarks: attendance?.remarks,
          holidayName: attendance?.holidayName,
          leaveType: attendance?.leaveType,
        };

        dates.push(dateObj);
      }

      // Add next month's leading days to complete the grid
      const remainingCells = 42 - dates.length; // 6 rows × 7 days = 42 cells
      for (let day = 1; day <= remainingCells; day++) {
        const nextDate = new Date(props.currentYear, props.currentMonth + 1, day);
        dates.push({
          day,
          dateString: nextDate.toISOString().split('T')[0],
          isCurrentMonth: false,
          isToday: false,
          attendance: null,
          details: [],
          hasConflict: false,
        });
      }

      return dates;
    });

    // No need for watch as we're using props directly

    // Get status icon based on attendance data
    const getStatusIcon = (attendance) => {
      if (!attendance) return null;

      // Check if details contain "No Time Recorded"
      if (attendance.details && attendance.details.some(detail => detail.includes('No Time Recorded'))) {
        return null;
      }

      const status = attendance.status;

      if (status === 'PRESENT' && !attendance.hasConflict) {
        return 'o_check_circle';
      } else if (status === 'ABSENT') {
        return 'o_cancel';
      } else if (status === 'HOLIDAY') {
        return 'o_event';
      } else if (status === 'LEAVE') {
        return 'beach_access';
      } else if (status === 'REST_DAY') {
        return 'o_weekend';
      } else if (attendance.hasConflict) {
        return 'warning';
      }

      return null;
    };

    // Get icon class based on status
    const getIconClass = (attendance) => {
      if (!attendance) return '';

      const status = attendance.status;

      if (status === 'PRESENT' && !attendance.hasConflict) {
        return 'text-positive';
      } else if (status === 'ABSENT') {
        return 'text-negative';
      } else if (status === 'HOLIDAY' || status === 'LEAVE') {
        return 'text-info';
      } else if (status === 'REST_DAY') {
        return 'text-grey';
      } else if (attendance.hasConflict) {
        return 'text-warning';
      }

      return 'text-grey';
    };

    // Get detail text class
    const getDetailClass = (detail) => {
      if (detail.includes('No Time Recorded')) {
        return 'text-grey';
      } else if (detail.includes('Present') || detail.includes('On Time')) {
        return 'text-positive';
      } else if (detail.includes('Absent')) {
        return 'text-negative';
      } else if (
        detail.includes('Late') ||
        detail.includes('Undertime') ||
        detail.includes('No Time')
      ) {
        return 'text-warning';
      } else if (detail.includes('Overtime')) {
        return 'text-info';
      }
      return 'text-grey';
    };

    // Get chip class for dialog
    const getChipClass = (detail) => {
      if (detail.includes('No Time Recorded')) {
        return 'bg-grey-4';
      } else if (detail.includes('Present') || detail.includes('On Time')) {
        return 'bg-positive text-white';
      } else if (detail.includes('Absent')) {
        return 'bg-negative text-white';
      } else if (
        detail.includes('Late') ||
        detail.includes('Undertime') ||
        detail.includes('No Time')
      ) {
        return 'bg-warning text-white';
      } else if (detail.includes('Overtime')) {
        return 'bg-info text-white';
      }
      return 'bg-grey-4';
    };

    // Handle day click
    const handleDayClick = (date) => {
      if (!date.isCurrentMonth || !date.attendance) return;

      selectedDay.value = date;
      showDetailDialog.value = true;
    };

    // Format date for detail dialog
    const formatDetailDate = (dateString) => {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    };

    // Format work hours display
    const formatWorkHours = (hours) => {
      if (!hours) return '0:00';

      const wholeHours = Math.floor(hours);
      const minutes = Math.round((hours - wholeHours) * 60);

      return `${wholeHours}:${minutes.toString().padStart(2, '0')}`;
    };

    return {
      // Reactive state
      daysOfWeek,
      showDetailDialog,
      selectedDay,
      // Computed
      calendarDates,
      // Methods
      getDetailClass,
      getChipClass,
      handleDayClick,
      formatDetailDate,
      formatWorkHours,
    };
  },
});
</script>

<style scoped>
.attendance-calendar-view {
  min-height: 438px;

  .calendar-container {
    border-radius: 8px;
    overflow: hidden;
  }

  .calendar-header {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    border-bottom: 1px solid #e5e5e5;

    .calendar-header-cell {
      padding: 8px;
      text-align: left;
      color: #666;
    }
  }

  .calendar-body {
    display: grid;
    grid-template-columns: repeat(7, minmax(0, 1fr));
    width: 100%;

    .calendar-cell {
      position: relative;
      max-width: 100%;
      min-height: 65px;
      border-right: 1px solid var(--q-light);
      border-bottom: 1px solid var(--q-light);
      padding: 6px;
      display: flex;
      transition: background-color 0.2s;

      &:nth-child(7n) {
        border-right: none;
      }

      &:nth-last-child(-n + 7) {
        border-bottom: none;
      }

      &.today {
        background-color: #def0ff;
      }

      &.within-cutoff {
        background-color: var(--q-extra-lighter);
      }

      &.within-cutoff.today {
        background-color: #def0ff;
      }
    }
  }
}

@media (max-width: 599px) {
  .attendance-calendar-view {
    .calendar-body {
      .calendar-cell {
        min-height: 65px;
        padding: 4px;
      }
    }
  }
}
</style>
