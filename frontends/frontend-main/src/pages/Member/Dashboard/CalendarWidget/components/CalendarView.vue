<template>
  <div class="calendar-view">
    <!-- Calendar Grid -->
    <div class="calendar-container">
      <!-- Days of Week Header -->
      <div class="calendar-header">
        <div v-for="day in daysOfWeek" :key="day" class="calendar-header-cell text-dark text-body-small">
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
            'today': date.isToday,
            'selected': isDateSelected(date),
          }"
          @click="selectDate(date)"
        >
          <div class="date-number text-label-medium-f-[10px]">{{ date.day }}</div>
          <div class="badges-container">
            <template v-for="(badge, index) in getBadgesForDate(date.dateString)" :key="`badge-${date.dateString}-${index}`">
              <GlobalWidgetBadge
                v-if="!badge.isEllipsis"
                size="sm"
                :label="badge.label"
                :background-color="badge.backgroundColor"
                :text-color="badge.textColor"
              />
              <div v-else class="ellipsis-badge">
                <GlobalWidgetBadge
                  size="sm"
                  :label="badge.label"
                  :background-color="badge.backgroundColor"
                  :text-color="badge.textColor"
                />
                <q-tooltip>
                  {{ badge.tooltip }}
                </q-tooltip>
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent, computed } from 'vue';
import GlobalWidgetBadge from '../../../../../components/shared/global/GlobalWidgetBadge.vue';

export default defineComponent({
  name: 'CalendarView',
  components: {
    GlobalWidgetBadge,
  },
  props: {
    currentMonth: {
      type: Number,
      required: true,
    },
    currentYear: {
      type: Number,
      required: true,
    },
    selectedDate: {
      type: String,
      required: true,
    },
  },
  emits: ['date-select'],
  setup(props, { emit }) {
    // Days of week
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Get today's date for comparison
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to midnight for proper date comparison

    // Helper function to check if a date is before today
    const isDateBeforeToday = (dateString) => {
      const date = new Date(dateString);
      date.setHours(0, 0, 0, 0);
      return date < today;
    };

    // Static badge data for calendar dates
    const calendarBadges = {
      '2025-07-15': [
        { label: 'Meeting', backgroundColor: '#FF5733', markAsCompleted: isDateBeforeToday('2025-07-15') },
        { label: 'Deadline', backgroundColor: '#3498DB', markAsCompleted: isDateBeforeToday('2025-07-15') },
      ],
      '2025-07-20': [
        { label: 'Sprint', backgroundColor: '#16A085', markAsCompleted: isDateBeforeToday('2025-07-20') },
        { label: 'Demo', backgroundColor: '#D35400', markAsCompleted: isDateBeforeToday('2025-07-20') },
        { label: 'Retro', backgroundColor: '#C0392B', markAsCompleted: isDateBeforeToday('2025-07-20') },
        { label: 'Planning', backgroundColor: '#7F8C8D', markAsCompleted: isDateBeforeToday('2025-07-20') },
      ],
      '2025-07-25': [
        { label: 'Review', backgroundColor: '#9B59B6', markAsCompleted: isDateBeforeToday('2025-07-25') },
        { label: 'Call', backgroundColor: '#1ABC9C', markAsCompleted: isDateBeforeToday('2025-07-25') },
        { label: 'Report', backgroundColor: '#E74C3C', markAsCompleted: isDateBeforeToday('2025-07-25') },
      ],
      '2025-07-28': [
        { label: 'Task', backgroundColor: '#2ECC71', markAsCompleted: isDateBeforeToday('2025-07-28') },
      ],
      '2025-07-30': [
        { label: 'Meeting', backgroundColor: '#FF5733', markAsCompleted: isDateBeforeToday('2025-07-30') },
        { label: 'Deadline', backgroundColor: '#3498DB', markAsCompleted: isDateBeforeToday('2025-07-30') },
        { label: 'Review', backgroundColor: '#9B59B6', markAsCompleted: isDateBeforeToday('2025-07-30') },
        { label: 'Call', backgroundColor: '#1ABC9C', markAsCompleted: isDateBeforeToday('2025-07-30') },
        { label: 'Report', backgroundColor: '#E74C3C', markAsCompleted: isDateBeforeToday('2025-07-30') },
      ],
      '2025-07-31': [
        { label: 'Task', backgroundColor: '#00897B', markAsCompleted: isDateBeforeToday('2025-07-31') },
        { label: 'Event', backgroundColor: '#F39C12', markAsCompleted: isDateBeforeToday('2025-07-31') },
      ],
      '2025-08-01': [
        { label: 'Launch', backgroundColor: '#8E44AD', markAsCompleted: isDateBeforeToday('2025-08-01') },
      ],
      '2025-08-05': [
        { label: 'Release', backgroundColor: '#00897B', markAsCompleted: isDateBeforeToday('2025-08-05') },
        { label: 'QA', backgroundColor: '#1E88E5', markAsCompleted: isDateBeforeToday('2025-08-05') },
        { label: 'Deploy', backgroundColor: '#00897B', markAsCompleted: isDateBeforeToday('2025-08-05') },
      ],
    };

    // Function to get badges for a specific date (max 3, with ellipsis)
    const getBadgesForDate = (dateString) => {
      const badges = calendarBadges[dateString] || [];

      if (badges.length === 0) {
        return [];
      }

      // Map badges to update backgroundColor and textColor if markAsCompleted is true
      const processedBadges = badges.map(badge => ({
        ...badge,
        backgroundColor: badge.markAsCompleted ? 'var(--q-light)' : badge.backgroundColor,
        textColor: badge.markAsCompleted ? '#97999F99' : undefined
      }));

      if (processedBadges.length <= 3) {
        return processedBadges;
      }

      // Return first 2 badges and add ellipsis as the 3rd
      const remainingCount = processedBadges.length - 2;
      const remainingBadges = processedBadges.slice(2).map(b => b.label).join(', ');

      return [
        processedBadges[0],
        processedBadges[1],
        {
          label: '...',
          backgroundColor: 'var(--q-gray-light)',
          tooltip: `${remainingCount} more: ${remainingBadges}`,
          isEllipsis: true
        }
      ];
    };

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
          dateString: `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}-${String(prevDate.getDate()).padStart(2, '0')}`,
          isCurrentMonth: false,
          isToday: false,
        });
      }

      // Add current month's days
      for (let day = 1; day <= lastDay.getDate(); day++) {
        const date = new Date(props.currentYear, props.currentMonth, day);
        const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        const isToday = date.toDateString() === today.toDateString();

        dates.push({
          day,
          dateString,
          isCurrentMonth: true,
          isToday,
        });
      }

      // Add next month's leading days to complete the grid
      const remainingCells = 42 - dates.length; // 6 rows × 7 days = 42 cells
      for (let day = 1; day <= remainingCells; day++) {
        const nextDate = new Date(props.currentYear, props.currentMonth + 1, day);
        dates.push({
          day,
          dateString: `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}-${String(nextDate.getDate()).padStart(2, '0')}`,
          isCurrentMonth: false,
          isToday: false,
        });
      }

      return dates;
    });

    // Methods
    const selectDate = (date) => {
      if (date.isCurrentMonth) {
        emit('date-select', date.dateString);
      }
    };

    const isDateSelected = (date) => {
      return props.selectedDate === date.dateString;
    };

    return {
      daysOfWeek,
      calendarDates,
      selectDate,
      isDateSelected,
      getBadgesForDate,
    };
  },
});
</script>

<style scoped>
.calendar-view {
  min-height: 300px;

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
    grid-template-columns: repeat(7, 1fr);
    margin-bottom: 1rem;

    .calendar-cell {
      position: relative;
      min-height: 70px;
      border-right: 1px solid #DDE1F0;
      border-bottom: 1px solid #DDE1F0;
      padding: 4px;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      transition: background-color 0.2s;

      &:nth-child(7n) {
        border-right: none;
      }

      &:nth-last-child(-n + 7) {
        border-bottom: none;
      }

      &.today {
        background-color: var(--q-light);
      }

      &.other-month {
        cursor: default;

        &:hover {
          background-color: transparent;
        }
      }

      .badges-container {
        display: flex;
        flex-direction: column;
        gap: 2px;
        margin-top: 4px;
        width: 100%;

        .ellipsis-badge {
          position: relative;
          width: 100%;
        }
      }
    }
  }
}
</style>
