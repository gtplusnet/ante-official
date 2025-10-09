<template>
  <div>
    <GlobalWidgetCard>
      <!-- Title -->
      <template #title>{{
        activeView === 'list' ? 'Attendance Warnings' : 'My Attendance'
      }}</template>

      <!-- More Actions -->
      <template #more-actions>
        <div class="tabs row items-center">
          <div
            class="tab cursor-pointer row items-center no-wrap"
            :class="{ 'tab-active': activeView === tab.key }"
            v-for="tab in viewTabs"
            :key="tab.key"
            @click="switchView(tab.key)"
          >
            <q-icon
              :name="tab.icon"
              size="20px"
              :class="activeView === tab.key ? 'text-dark' : 'text-grey'"
            />
          </div>
        </div>
      </template>

      <!-- Actions -->
      <template #actions>
        <div class="tabs-wrapper">
          <div class="tabs row items-center">
            <div
              class="tab cursor-pointer row items-center no-wrap"
              :class="{ 'tab-active': activeView === tab.key }"
              v-for="tab in viewTabs"
              :key="tab.key"
              @click="switchView(tab.key)"
            >
              <q-icon
                :name="tab.icon"
                size="20px"
                :class="activeView === tab.key ? 'text-dark' : 'text-grey'"
              />
            </div>
          </div>
        </div>
      </template>

      <!-- Content -->
      <template #content>
        <div class="attendance-content">
          <!-- Date Range Selector -->
          <div class="date-section row items-center justify-between q-mb-md">
            <div class="col-6">
              <q-select
                class="date-picker"
                v-model="cutOffPeriod"
                :options="cutOffPeriodOptions"
                option-label="label"
                option-value="value"
                emit-value
                map-options
                outlined
                dense
                rounded
                :loading="loadingCutoffs"
                @update:model-value="onCutoffPeriodChange"
              />
            </div>
            <div class="col row items-center justify-end" v-if="activeView === 'list'">
              <q-select
                v-model="filter"
                class="col-11 date-picker"
                :options="filterOptions"
                option-label="label"
                option-value="value"
                emit-value
                map-options
                outlined
                dense
                rounded
              />
            </div>
            <div class="col row items-center justify-end" v-if="activeView === 'calendar'">
              <GButton :label="timesheetButtonLabel" variant="outline" icon="table_view" class="view-timesheet-btn" iconSize="md" color="primary" unelevated />
            </div>
          </div>

          <!-- Loading State -->
          <template
            v-if="
              (activeView === 'calendar' && loadingCalendar) ||
              (activeView === 'list' && loadingConflicts)
            "
          >
            <div class="q-pa-xl text-center">
              <q-spinner-oval color="primary" size="3em" />
              <div class="text-body2 text-grey q-mt-md">Loading attendance data...</div>
            </div>
          </template>

          <!-- Content Views -->
          <template v-else>
            <div v-if="activeView === 'calendar'">
              <div class="col row items-center justify-start">
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

              <!-- Calendar View -->
              <AttendanceCalendarView
                :attendance-data="calendarData"
                :current-month="currentCalendarMonth"
                :current-year="currentCalendarYear"
                :cutoff-start="dateFrom"
                :cutoff-end="dateTo"
              />
            </div>

            <!-- List View -->
            <AttendanceListView
              v-if="activeView === 'list'"
              :attendance-data="paginatedConflictsData"
              :pagination="conflictsPagination"
              @update:page="updatePage"
              @refresh="loadConflictsData"
            />
          </template>
        </div>
      </template>

      <!-- Footer -->
      <template #footer v-if="activeView === 'list' && !loadingConflicts && !error">
        <global-widget-pagination :pagination="pagination" @update:page="updatePage" />
      </template>
    </GlobalWidgetCard>
  </div>
</template>

<style scoped src="./MyAttendanceWidget.scss"></style>

<script>
import GButton from 'src/components/shared/buttons/GButton.vue';
import {
  defineComponent,
  ref,
  computed,
  onMounted,
  getCurrentInstance,
  watch,
  nextTick,
} from 'vue';
import GlobalWidgetCard from '../../../../components/shared/global/GlobalWidgetCard.vue';
import GlobalWidgetPagination from '../../../../components/shared/global/GlobalWidgetPagination.vue';
import AttendanceCalendarView from './components/AttendanceCalendarView.vue';
import AttendanceListView from './components/AttendanceListView.vue';
import { useQuasar } from 'quasar';

export default defineComponent({
  name: 'MyAttendanceWidget',
  components: {
    GlobalWidgetCard,
    GlobalWidgetPagination,
    AttendanceCalendarView,
    AttendanceListView,
    GButton,
  },
  setup() {
    const $q = useQuasar();
    const instance = getCurrentInstance();
    const $api = instance?.proxy?.$api;

    // Reactive state
    const activeView = ref('calendar');
    const loading = ref(false);
    const loadingCalendar = ref(false);
    const loadingConflicts = ref(false);
    const error = ref(false);
    const dateFrom = ref('');
    const dateTo = ref('');
    const currentPage = ref(1);
    const itemsPerPage = ref(6);
    const cutOffPeriod = ref('');
    const cutOffPeriodOptions = ref([]);
    const loadingCutoffs = ref(false);

    const filter = ref('all');
    const filterOptions = ref([
      {
        label: 'Show',
        value: 'SHOW',
      },
      {
        label: 'All',
        value: 'ALL',
      },
      {
        label: 'Present',
        value: 'PRESENT',
      },
      {
        label: 'No Time Recorded',
        value: 'NO_TIME_RECORDED',
      },
      {
        label: 'Time In',
        value: 'TIME_IN',
      },
      {
        label: 'Time Out',
        value: 'TIME_OUT',
      },
      {
        label: 'Custom',
        value: 'CUSTOM',
      },
    ]);

    // Initialize date range based on selected cutoff
    const initializeDateRange = () => {
      const selectedCutoff = cutOffPeriodOptions.value.find(
        (option) => option.value === cutOffPeriod.value
      );

      if (selectedCutoff) {
        dateFrom.value = selectedCutoff.startDate;
        dateTo.value = selectedCutoff.endDate;
      } else {
        // Fallback to current month if no cutoff selected
        const today = new Date();
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

        dateFrom.value = firstDay.toISOString().split('T')[0];
        dateTo.value = lastDay.toISOString().split('T')[0];
      }
    };

    // Load employee cutoff date ranges
    const loadCutoffDateRanges = async () => {
      try {
        loadingCutoffs.value = true;
        const response = await $api.get('/dashboard/employee-cutoff-ranges');

        if (
          response.data &&
          response.data.cutoffDateRanges &&
          response.data.cutoffDateRanges.length > 0
        ) {
          // Map the response to options format
          cutOffPeriodOptions.value = response.data.cutoffDateRanges.map((cutoff) => ({
            label: cutoff.label,
            value: cutoff.id,
            startDate: new Date(cutoff.startDate).toISOString().split('T')[0],
            endDate: new Date(cutoff.endDate).toISOString().split('T')[0],
            isCurrent: cutoff.isCurrent,
          }));

          // Find and set the current cutoff
          const currentCutoff = cutOffPeriodOptions.value.find((option) => option.isCurrent);
          if (currentCutoff) {
            cutOffPeriod.value = currentCutoff.value;
          } else if (cutOffPeriodOptions.value.length > 0) {
            // If no current cutoff, select the first one
            cutOffPeriod.value = cutOffPeriodOptions.value[0].value;
          }

          // Wait for next tick to ensure model is updated
          await nextTick();

          // Initialize date range based on selected cutoff
          initializeDateRange();

          // Load data for the selected cutoff based on current view
          if (activeView.value === 'list') {
            await loadConflictsData();
          } else {
            await loadCalendarData();
          }
        } else {
          // Fallback to default date range
          initializeDateRange();
        }
      } catch (error) {
        console.error('Failed to load cutoff date ranges:', error);
        // $q.notify({
        //   type: 'negative',
        //   message: 'Failed to load cutoff periods',
        //   position: 'top-right',
        // });
        // Fallback to default date range
        initializeDateRange();
      } finally {
        loadingCutoffs.value = false;
      }
    };

    const attendanceData = ref([]);
    const conflictsData = ref([]);
    const calendarData = ref([]);

    // View tabs configuration
    const viewTabs = ref([
      {
        key: 'calendar',
        title: 'Calendar',
        icon: 'calendar_view_month',
      },
      {
        key: 'list',
        title: 'List',
        icon: 'format_list_bulleted',
      },
    ]);

    // Computed properties
    const pagination = computed(() => ({
      currentPage: currentPage.value,
      totalItems: attendanceData.value.length,
      itemsPerPage: itemsPerPage.value,
    }));

    const conflictsPagination = computed(() => ({
      currentPage: currentPage.value,
      totalItems: conflictsData.value.length,
      itemsPerPage: itemsPerPage.value,
    }));

    const paginatedAttendanceData = computed(() => {
      const start = (currentPage.value - 1) * itemsPerPage.value;
      const end = start + itemsPerPage.value;
      const result = attendanceData.value.slice(start, end);
      return result;
    });

    const paginatedConflictsData = computed(() => {
      const start = (currentPage.value - 1) * itemsPerPage.value;
      const end = start + itemsPerPage.value;
      return conflictsData.value.slice(start, end);
    });

    const currentMonthYear = computed(() => {
      const date = new Date(currentCalendarYear.value, currentCalendarMonth.value);
      return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    });

    // Responsive button label
    const timesheetButtonLabel = computed(() => {
      return $q.screen.xs || $q.screen.sm ? 'Timesheet' : 'View Timesheet';
    });

    // Methods
    const switchView = async (view) => {
      // Prevent switching if already loading
      if (loadingCalendar.value || loadingConflicts.value) {
        return;
      }

      activeView.value = view;
      // Reset to first page when switching views
      if (view === 'list') {
        currentPage.value = 1;
        await loadConflictsData();
      } else if (view === 'calendar') {
        await loadCalendarData();
      }
    };

    const loadAttendanceData = async () => {
      try {
        loading.value = true;
        error.value = false;

        if (!dateFrom.value || !dateTo.value) {
          return;
        }

        const response = await $api.get('/dashboard/employee-attendance', {
          params: {
            startDate: dateFrom.value,
            endDate: dateTo.value,
          },
        });

        if (response.data && response.data.attendanceRecords) {
          attendanceData.value = response.data.attendanceRecords;
        } else {
          attendanceData.value = [];
        }
      } catch (err) {
        console.error('Failed to load attendance data:', err);
        error.value = true;
        $q.notify({
          type: 'negative',
          message: 'Failed to load attendance data',
          position: 'top-right',
        });
        attendanceData.value = [];
      } finally {
        loading.value = false;
      }
    };

    // Track the current calendar view month/year separately
    const currentCalendarMonth = ref(new Date().getMonth());
    const currentCalendarYear = ref(new Date().getFullYear());

    const loadCalendarData = async () => {
      try {
        loadingCalendar.value = true;
        error.value = false;

        // Always load the full month being viewed
        const firstDay = new Date(currentCalendarYear.value, currentCalendarMonth.value, 1);
        const lastDay = new Date(currentCalendarYear.value, currentCalendarMonth.value + 1, 0);

        // Format dates to YYYY-MM-DD in local timezone
        const monthStart = `${firstDay.getFullYear()}-${String(firstDay.getMonth() + 1).padStart(
          2,
          '0'
        )}-${String(firstDay.getDate()).padStart(2, '0')}`;
        const monthEnd = `${lastDay.getFullYear()}-${String(lastDay.getMonth() + 1).padStart(
          2,
          '0'
        )}-${String(lastDay.getDate()).padStart(2, '0')}`;

        const response = await $api.get('/dashboard/employee-attendance-calendar', {
          params: {
            startDate: monthStart,
            endDate: monthEnd,
            cutoffStartDate: dateFrom.value, // Pass cutoff dates for highlighting
            cutoffEndDate: dateTo.value,
          },
        });

        if (response.data && response.data.calendarDays) {
          calendarData.value = response.data.calendarDays;
        } else {
          calendarData.value = [];
        }
      } catch (err) {
        console.error('Failed to load calendar data:', err);
        error.value = true;
        $q.notify({
          type: 'negative',
          message: 'Failed to load calendar data',
          position: 'top-right',
        });
        calendarData.value = [];
      } finally {
        loadingCalendar.value = false;
      }
    };

    const loadConflictsData = async () => {
      try {
        loadingConflicts.value = true;
        error.value = false;

        if (!dateFrom.value || !dateTo.value) {
          loadingConflicts.value = false;
          return;
        }

        const response = await $api.get('/dashboard/employee-attendance-conflicts', {
          params: {
            startDate: dateFrom.value,
            endDate: dateTo.value,
            page: currentPage.value,
            limit: itemsPerPage.value,
          },
        });

        if (response.data && response.data.conflicts) {
          // Transform conflicts data to match AttendanceListView format
          conflictsData.value = response.data.conflicts.map((conflict) => ({
            id: conflict.id,
            date: conflict.conflictDate || conflict.dateString,
            description: conflict.description,
            hasConflict: true,
            conflictType: conflict.conflictType,
            employeeTimekeepingId: conflict.employeeTimekeepingId,
          }));
        } else {
          conflictsData.value = [];
        }
      } catch (err) {
        console.error('Failed to load conflicts data:', err);
        error.value = true;
        $q.notify({
          type: 'negative',
          message: 'Failed to load conflicts data',
          position: 'top-right',
        });
        conflictsData.value = [];
      } finally {
        loadingConflicts.value = false;
      }
    };

    const updatePage = (page) => {
      currentPage.value = page;
      if (activeView.value === 'list') {
        loadConflictsData();
      }
    };

    const previousMonth = () => {
      if (currentCalendarMonth.value === 0) {
        currentCalendarMonth.value = 11;
        currentCalendarYear.value--;
      } else {
        currentCalendarMonth.value--;
      }

      loadCalendarData();
    };

    const nextMonth = () => {
      if (currentCalendarMonth.value === 11) {
        currentCalendarMonth.value = 0;
        currentCalendarYear.value++;
      } else {
        currentCalendarMonth.value++;
      }

      loadCalendarData();
    };

    // Watch for cutoff period changes
    const onCutoffPeriodChange = () => {
      initializeDateRange();
      if (activeView.value === 'list') {
        loadConflictsData();
      } else {
        loadCalendarData();
      }
    };

    // Watch cutOffPeriod to ensure it's properly set
    watch(cutOffPeriod, (newValue) => {
      if (newValue) {
        const selectedOption = cutOffPeriodOptions.value.find((opt) => opt.value === newValue);
        if (selectedOption) {
        }
      }
    });

    // Lifecycle hooks
    onMounted(async () => {
      // Initialize calendar to current date
      const today = new Date();
      currentCalendarMonth.value = today.getMonth();
      currentCalendarYear.value = today.getFullYear();

      await loadCutoffDateRanges();
      // loadAttendanceData or loadConflictsData is called inside loadCutoffDateRanges after setting the cutoff
    });

    return {
      // Reactive state
      activeView,
      loading,
      loadingCalendar,
      loadingConflicts,
      error,
      dateFrom,
      dateTo,
      attendanceData,
      viewTabs,
      pagination,
      filter,
      filterOptions,
      cutOffPeriod,
      cutOffPeriodOptions,
      loadingCutoffs,
      paginatedAttendanceData,
      paginatedConflictsData,
      conflictsPagination,
      currentMonthYear,
      calendarData,
      currentCalendarMonth,
      currentCalendarYear,
      timesheetButtonLabel,

      // Methods
      switchView,
      loadAttendanceData,
      loadConflictsData,
      loadCalendarData,
      updatePage,
      previousMonth,
      nextMonth,
      onCutoffPeriodChange,
    };
  },
});
</script>
