<template>
  <div class="calendar-sidebar">
    <!-- Create Button -->
    <div class="sidebar-create">
      <q-btn
        unelevated
        rounded
        color="primary"
        label="Create"
        icon="add"
        class="create-btn-sidebar full-width"
        @click="$emit('create-event')"
      />
    </div>

    <!-- Mini Calendar -->
    <div class="sidebar-section mini-calendar-section">
      <div class="mini-calendar-wrapper">
        <div class="mini-calendar-header">
          <q-btn
            flat
            round
            dense
            icon="chevron_left"
            size="sm"
            @click="previousMonth"
          />
          <span class="text-subtitle2">{{ currentMonthYear }}</span>
          <q-btn
            flat
            round
            dense
            icon="chevron_right"
            size="sm"
            @click="nextMonth"
          />
        </div>
        <div class="mini-calendar-grid">
          <!-- Day headers -->
          <div class="day-header" v-for="day in dayHeaders" :key="day">
            {{ day }}
          </div>
          <!-- Calendar days -->
          <div
            v-for="day in calendarDays"
            :key="`${day.month}-${day.day}`"
            class="calendar-day"
            :class="{
              'other-month': !day.isCurrentMonth,
              'today': day.isToday,
              'selected': day.isSelected,
              'has-events': day.hasEvents
            }"
            @click="selectDate(day)"
          >
            {{ day.day }}
          </div>
        </div>
      </div>
    </div>

    <!-- My Calendars -->
    <div class="sidebar-section categories-section">
      <div class="section-header">
        <span class="text-subtitle2">My Calendars</span>
        <q-btn
          flat
          round
          dense
          icon="add"
          size="xs"
          @click="openAddCategoryDialog"
        >
          <q-tooltip>Add category</q-tooltip>
        </q-btn>
      </div>

      <div class="categories-list">
        <!-- Select All -->
        <div class="category-item">
          <q-checkbox
            :model-value="allCategoriesSelected"
            @update:model-value="toggleAllCategories"
            dense
            size="sm"
            class="category-checkbox"
          >
            <template v-slot:default>
              <span class="category-label">All</span>
            </template>
          </q-checkbox>
        </div>

        <!-- Category List -->
        <div
          v-for="category in categories"
          :key="category.id"
          class="category-item"
        >
          <q-checkbox
            :model-value="selectedCategories.includes(category.id)"
            @update:model-value="toggleCategory(category.id)"
            dense
            size="sm"
            class="category-checkbox"
          >
            <template v-slot:default>
              <div class="category-content">
                <div
                  class="category-color"
                  :style="{ backgroundColor: category.colorCode }"
                ></div>
                <span class="category-label">{{ category.name }}</span>
              </div>
            </template>
          </q-checkbox>

          <!-- Category actions for non-system categories -->
          <div v-if="!category.isSystem" class="category-actions">
            <q-btn
              flat
              round
              dense
              icon="more_vert"
              size="xs"
            >
              <q-menu auto-close>
                <q-list dense>
                  <q-item clickable @click="editCategory(category)">
                    <q-item-section avatar>
                      <q-icon name="edit" size="xs" />
                    </q-item-section>
                    <q-item-section>Edit</q-item-section>
                  </q-item>
                  <q-item clickable @click="deleteCategory(category.id)">
                    <q-item-section avatar>
                      <q-icon name="delete" size="xs" />
                    </q-item-section>
                    <q-item-section>Delete</q-item-section>
                  </q-item>
                </q-list>
              </q-menu>
            </q-btn>
          </div>
        </div>
      </div>
    </div>

    <!-- Other Calendars (Optional) -->
    <div class="sidebar-section other-calendars-section" v-if="showOtherCalendars">
      <div class="section-header">
        <span class="text-subtitle2">Other Calendars</span>
      </div>
      <div class="other-calendars-list">
        <!-- Placeholder for team calendars, shared calendars, etc. -->
        <div class="text-caption text-grey q-pa-sm">
          No other calendars
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { date } from 'quasar';
import { useCalendarCategories, type CalendarCategory } from 'src/composables/calendar/useCalendarCategories';

// Props
interface Props {
  selectedDate?: Date;
  events?: any[];
  showOtherCalendars?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  selectedDate: () => new Date(),
  events: () => [],
  showOtherCalendars: false
});

// Emits
const emit = defineEmits<{
  'date-select': [date: Date];
  'create-event': [];
  'category-toggle': [categoryId: number];
  'edit-category': [category: CalendarCategory];
  'delete-category': [categoryId: number];
  'add-category': [];
}>();

// Composables
const {
  categories,
  selectedCategories,
  fetchCategories,
  toggleCategory: toggleCategoryComposable,
  selectAllCategories,
  deselectAllCategories
} = useCalendarCategories();

// Local state
const miniCalendarDate = ref(new Date());
const dayHeaders = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

// Current month and year display
const currentMonthYear = computed(() => {
  return date.formatDate(miniCalendarDate.value, 'MMMM YYYY');
});

// All categories selected
const allCategoriesSelected = computed(() => {
  return categories.value.length > 0 &&
         selectedCategories.value.length === categories.value.length;
});

// Generate calendar days for mini calendar
const calendarDays = computed(() => {
  const year = miniCalendarDate.value.getFullYear();
  const month = miniCalendarDate.value.getMonth();

  // First day of the month
  const firstDay = new Date(year, month, 1);
  const firstDayOfWeek = firstDay.getDay();

  // Last day of the month
  const lastDay = new Date(year, month + 1, 0);
  const lastDayOfMonth = lastDay.getDate();

  // Days from previous month
  const prevMonthDays = firstDayOfWeek;
  const prevMonth = month === 0 ? 11 : month - 1;
  const prevMonthYear = month === 0 ? year - 1 : year;
  const prevMonthLastDay = new Date(prevMonthYear, prevMonth + 1, 0).getDate();

  // Days from next month
  const totalCells = 42; // 6 rows
  const nextMonthDays = totalCells - (prevMonthDays + lastDayOfMonth);

  const days = [];

  // Previous month days
  for (let i = prevMonthDays - 1; i >= 0; i--) {
    const day = prevMonthLastDay - i;
    days.push({
      day,
      month: prevMonth,
      year: prevMonthYear,
      isCurrentMonth: false,
      isToday: isToday(new Date(prevMonthYear, prevMonth, day)),
      isSelected: isSelected(new Date(prevMonthYear, prevMonth, day)),
      hasEvents: hasEventsOnDate(new Date(prevMonthYear, prevMonth, day))
    });
  }

  // Current month days
  for (let day = 1; day <= lastDayOfMonth; day++) {
    days.push({
      day,
      month,
      year,
      isCurrentMonth: true,
      isToday: isToday(new Date(year, month, day)),
      isSelected: isSelected(new Date(year, month, day)),
      hasEvents: hasEventsOnDate(new Date(year, month, day))
    });
  }

  // Next month days
  const nextMonth = month === 11 ? 0 : month + 1;
  const nextMonthYear = month === 11 ? year + 1 : year;
  for (let day = 1; day <= nextMonthDays; day++) {
    days.push({
      day,
      month: nextMonth,
      year: nextMonthYear,
      isCurrentMonth: false,
      isToday: isToday(new Date(nextMonthYear, nextMonth, day)),
      isSelected: isSelected(new Date(nextMonthYear, nextMonth, day)),
      hasEvents: hasEventsOnDate(new Date(nextMonthYear, nextMonth, day))
    });
  }

  return days;
});

// Helper functions
const isToday = (checkDate: Date) => {
  const today = new Date();
  return date.isSameDate(checkDate, today, 'day');
};

const isSelected = (checkDate: Date) => {
  if (!props.selectedDate) return false;
  return date.isSameDate(checkDate, props.selectedDate, 'day');
};

const hasEventsOnDate = (checkDate: Date) => {
  if (!props.events || props.events.length === 0) return false;

  return props.events.some(event => {
    const eventStart = new Date(event.startDateTime || event.start);
    return date.isSameDate(eventStart, checkDate, 'day');
  });
};

// Methods
const previousMonth = () => {
  miniCalendarDate.value = date.subtractFromDate(miniCalendarDate.value, { months: 1 });
};

const nextMonth = () => {
  miniCalendarDate.value = date.addToDate(miniCalendarDate.value, { months: 1 });
};

const selectDate = (day: any) => {
  const selectedDate = new Date(day.year, day.month, day.day);
  emit('date-select', selectedDate);
};

const toggleCategory = (categoryId: number) => {
  toggleCategoryComposable(categoryId);
  emit('category-toggle', categoryId);
};

const toggleAllCategories = (value: boolean) => {
  if (value) {
    selectAllCategories();
  } else {
    deselectAllCategories();
  }
};

const editCategory = (category: CalendarCategory) => {
  emit('edit-category', category);
};

const deleteCategory = (categoryId: number) => {
  emit('delete-category', categoryId);
};

const openAddCategoryDialog = () => {
  emit('add-category');
};

// Lifecycle
onMounted(async () => {
  await fetchCategories();
});

// Watchers
watch(() => props.selectedDate, (newDate) => {
  if (newDate) {
    miniCalendarDate.value = new Date(newDate);
  }
});
</script>

<style lang="scss" scoped>
.calendar-sidebar {
  width: 256px;
  background: #ffffff;
  border-right: 1px solid rgba(0, 0, 0, 0.08);
  padding: 16px;
  height: calc(100vh - 64px);
  overflow-y: auto;

  .sidebar-create {
    margin-bottom: 24px;

    .create-btn-sidebar {
      height: 48px;
      font-weight: 500;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);

      &:hover {
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.16);
      }
    }
  }

  .sidebar-section {
    margin-bottom: 24px;

    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
      padding: 0 4px;

      .text-subtitle2 {
        font-weight: 500;
        color: rgba(0, 0, 0, 0.87);
      }
    }
  }

  // Mini Calendar Styles
  .mini-calendar-wrapper {
    .mini-calendar-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8px;
      padding: 4px 0;

      .text-subtitle2 {
        font-weight: 500;
        font-size: 0.875rem;
      }
    }

    .mini-calendar-grid {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 2px;
      text-align: center;

      .day-header {
        font-size: 0.75rem;
        font-weight: 500;
        color: rgba(0, 0, 0, 0.54);
        padding: 4px 0;
      }

      .calendar-day {
        aspect-ratio: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.75rem;
        border-radius: 50%;
        cursor: pointer;
        transition: all 0.2s;

        &:hover {
          background: rgba(0, 0, 0, 0.04);
        }

        &.other-month {
          color: rgba(0, 0, 0, 0.38);
        }

        &.today {
          background: rgba(33, 150, 243, 0.12);
          font-weight: 600;
        }

        &.selected {
          background: #2196F3;
          color: white;
          font-weight: 600;

          &:hover {
            background: #1976D2;
          }
        }

        &.has-events {
          position: relative;

          &::after {
            content: '';
            position: absolute;
            bottom: 2px;
            left: 50%;
            transform: translateX(-50%);
            width: 4px;
            height: 4px;
            border-radius: 50%;
            background: #2196F3;
          }

          &.selected::after {
            background: white;
          }
        }
      }
    }
  }

  // Categories Styles
  .categories-section {
    .categories-list {
      .category-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 4px 0;
        transition: background 0.2s;
        border-radius: 4px;

        &:hover {
          background: rgba(0, 0, 0, 0.02);
        }

        .category-checkbox {
          flex: 1;

          :deep(.q-checkbox__label) {
            flex: 1;
          }
        }

        .category-content {
          display: flex;
          align-items: center;
          gap: 8px;

          .category-color {
            width: 12px;
            height: 12px;
            border-radius: 2px;
          }

          .category-label {
            font-size: 0.875rem;
            color: rgba(0, 0, 0, 0.87);
          }
        }

        .category-actions {
          opacity: 0;
          transition: opacity 0.2s;
        }

        &:hover .category-actions {
          opacity: 1;
        }
      }
    }
  }

  // Other Calendars
  .other-calendars-section {
    .other-calendars-list {
      padding: 8px 0;
    }
  }
}

// Mobile responsiveness
@media (max-width: 768px) {
  .calendar-sidebar {
    width: 100%;
    height: auto;
    border-right: none;
    border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  }
}
</style>