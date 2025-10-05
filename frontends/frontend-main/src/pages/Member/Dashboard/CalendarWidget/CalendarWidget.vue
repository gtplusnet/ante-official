<template>
  <div>
    <GlobalWidgetCard>
      <!-- Title -->
      <template #title>Calendar</template>

      <template #more-actions>
        <q-btn color="primary" size="md" round flat>
          <q-icon name="add" class="text-grey" size="25px" />
          <q-menu auto-close anchor="bottom end" self="top end">
            <q-list>
              <div
                class="q-py-md q-pl-sm q-pr-lg row items-center cursor-pointer"
                clickable
                @click="openDialog('event')"
              >
                <div class="row items-center">
                  <q-icon name="event" :style="{ color: '#00897B', fontSize: '20px' }" />
                  <div class="q-ml-sm text-label-medium">Event</div>
                </div>
              </div>
              <div
                class="q-py-md q-pl-sm q-pr-lg row items-center cursor-pointer"
                clickable
                @click="openDialog('meeting')"
              >
                <div class="row items-center">
                  <q-icon name="card_travel" :style="{ color: '#1E88E5', fontSize: '20px' }" />
                  <div class="q-ml-sm text-label-medium">Meeting</div>
                </div>
              </div>
              <div
                class="q-py-md q-pl-sm q-pr-lg row items-center cursor-pointer"
                clickable
                @click="openDialog('task')"
              >
                <div class="row items-center">
                  <q-icon
                    name="library_add_check"
                    :style="{ color: '#014781', fontSize: '20px' }"
                  />
                  <div class="q-ml-sm text-label-medium">Task</div>
                </div>
              </div>
            </q-list>
          </q-menu>
        </q-btn>
      </template>

      <!-- Actions -->
      <template #actions>
        <div class="more-actions-wrapper">
          <q-btn color="primary" size="md" round flat>
            <q-icon name="add" class="text-grey" size="25px" />
            <q-menu auto-close anchor="bottom end" self="top end">
              <q-list class="calendar-menu">
                <div
                  class="q-py-md q-pl-sm q-pr-lg row items-center cursor-pointer"
                  clickable
                  @click="openDialog('event')"
                >
                  <div class="row items-center">
                    <q-icon name="event" :style="{ color: '#00897B', fontSize: '20px' }" />
                    <div class="q-ml-sm text-label-medium">Event</div>
                  </div>
                </div>
                <div
                  class="q-py-md q-pl-sm q-pr-lg row items-center cursor-pointer"
                  clickable
                  @click="openDialog('meeting')"
                >
                  <div class="row items-center">
                    <q-icon name="card_travel" :style="{ color: '#1E88E5', fontSize: '20px' }" />
                    <div class="q-ml-sm text-label-medium">Meeting</div>
                  </div>
                </div>
                <div
                  class="q-py-md q-pl-sm q-pr-lg row items-center cursor-pointer"
                  clickable
                >
                  <div class="row items-center">
                    <q-icon
                      name="library_add_check"
                      :style="{ color: '#014781', fontSize: '20px' }"
                    />
                    <div class="q-ml-sm text-label-medium">Task</div>
                  </div>
                </div>
              </q-list>
            </q-menu>
          </q-btn>
        </div>
      </template>

      <!-- Content -->
      <template #content>
        <div class="calendar-content">
          <div class="row items-center">
            <div class="text-title-small q-mr-sm">{{ currentMonthYear }}</div>
            <q-btn
              flat
              round
              icon="chevron_left"
              @click="previousMonth"
              dense
              size="sm"
              class="text-grey q-mr-xs"
            />
            <q-btn
              flat
              round
              icon="chevron_right"
              @click="nextMonth"
              dense
              size="sm"
              class="text-grey"
            />
          </div>
          <CalendarView
            :current-month="currentMonth"
            :current-year="currentYear"
            :selected-date="selectedDate"
            @date-select="handleDateSelect"
          />
        </div>
      </template>
    </GlobalWidgetCard>

    <!-- Dialog -->
    <AddEditCalendarDialog v-model="showDialog" :createType="dialogType" />
  </div>
</template>

<style scoped src="./CalendarWidget.scss"></style>

<script lang="ts">
import { ref, computed } from 'vue';
import { defineAsyncComponent } from 'vue';
import GlobalWidgetCard from '../../../../components/shared/global/GlobalWidgetCard.vue';
import CalendarView from './components/CalendarView.vue';

// Lazy-loaded dialogs (ALL dialogs must be lazy loaded - CLAUDE.md)
const AddEditCalendarDialog = defineAsyncComponent(() =>
  import('./dialog/AddEditCalendarDialog.vue')
);

export default {
  name: 'CalendarWidget',
  components: {
    GlobalWidgetCard,
    CalendarView,
    AddEditCalendarDialog,
  },
  setup() {
    // Reactive state
    const currentMonth = ref(new Date().getMonth());
    const currentYear = ref(new Date().getFullYear());
    const selectedDate = ref<string>('');
    const showDialog = ref(false);
    const dialogType = ref('event');

    // Computed properties
    const currentMonthYear = computed(() => {
      const date = new Date(currentYear.value, currentMonth.value);
      return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    });

    // Methods
    const previousMonth = () => {
      if (currentMonth.value === 0) {
        currentMonth.value = 11;
        currentYear.value--;
      } else {
        currentMonth.value--;
      }
    };

    const nextMonth = () => {
      if (currentMonth.value === 11) {
        currentMonth.value = 0;
        currentYear.value++;
      } else {
        currentMonth.value++;
      }
    };

    const handleDateSelect = (date: string) => {
      selectedDate.value = date;
    };

    const openDialog = (type: string) => {
      showDialog.value = true;
      dialogType.value = type;
    };

    return {
      // Reactive state
      currentMonth,
      currentYear,

      selectedDate,
      showDialog,
      dialogType,
      // Computed
      currentMonthYear,
      // Methods
      previousMonth,
      nextMonth,
      handleDateSelect,
      openDialog,
    };
  },
};
</script>
