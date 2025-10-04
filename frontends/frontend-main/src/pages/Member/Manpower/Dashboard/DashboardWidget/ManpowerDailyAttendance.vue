<template>
  <div class="daily-attendance">
    <!-- Left side: Donut Chart and Legend -->
    <GlobalWidgetCard>
      <!-- Title -->
      <template #title>
        <div class="row items-center">
          <span>Daily Attendance</span>
          <GButton variant="text" color="primary" size="sm" icon="calendar_today" round dense class="q-ml-xs">
            <q-popup-proxy cover transition-show="scale" transition-hide="scale">
              <q-date
                v-model="selectedDate"
                mask="YYYY-MM-DD"
                @update:model-value="onDateChange"
              >
                <div class="row items-center justify-end">
                  <GButton label="Close" color="primary" variant="text" @click="$emit('close')" />
                </div>
              </q-date>
            </q-popup-proxy>
            <q-tooltip>Select date</q-tooltip>
          </GButton>
        </div>
      </template>

      <!-- Actions -->
      <template #actions>
        <div class="row items-center">
          <div class="text-label-large text-grey">{{ formattedDate || 'Loading...' }}</div>
          <GButton
            variant="text"
            icon="refresh"
            color="primary"
            size="sm"
            class="q-ml-sm"
            @click="refreshData"
            :loading="loading"
            round
            dense
          >
            <q-tooltip>Refresh data</q-tooltip>
          </GButton>
        </div>
      </template>

      <!-- Content -->
      <template #content>
        <div v-if="loading" class="chart-container q-pt-none">
          <div class="full-width full-height flex flex-center">
            <q-spinner-oval color="primary" size="3em" />
          </div>
        </div>

        <div v-else-if="error" class="chart-container q-pt-none">
          <div class="full-width full-height flex flex-center column">
            <q-icon name="error_outline" size="3em" color="negative" class="q-mb-md" />
            <div class="text-body2 text-grey">Failed to load attendance data</div>
            <GButton label="Retry" color="primary" variant="text" @click="fetchAttendanceData" class="q-mt-md" />
          </div>
        </div>

        <div v-else class="chart-container q-pt-none">
          <!-- Show placeholder when all values are zero -->
          <div v-if="!chartSeries.some(v => v > 0)" class="full-width full-height flex flex-center column">
            <q-icon name="insights" size="4em" color="grey-5" class="q-mb-md" />
            <div class="text-h6 text-grey-7">No Attendance Data</div>
            <div class="text-body2 text-grey-6 q-mt-sm text-center">No employees have been tracked for this date</div>
          </div>

          <!-- Show chart when there's data -->
          <template v-else>
            <ApexChart type="donut" height="250" width="100%" :options="chartOptions" :series="chartSeries" />

            <!-- Legend -->
            <div class="legend-container">
              <div v-for="item in legendItems" :key="item.label" class="legend-item row items-center">
                <div class="legend-color q-mr-md" :style="{ backgroundColor: item.color }"></div>
                <div class="row items-center justify-between" style="flex: 1">
                  <span class="text-body2 text-grey">{{ item.label }}</span>
                  <span class="text-body1 text-dark text-weight-medium">{{ item.value }}</span>
                </div>
              </div>
            </div>
          </template>
        </div>
      </template>
    </GlobalWidgetCard>

    <!-- Right side: Info Cards -->
    <!-- <div class="col-auto">
      <div class="info-cards-container column">
        <GlobalWidgetCounter
          icon="groups"
          icon-color="#3b82f6"
          :value="totalActiveEmployees.toString()"
          label="Total Active Employees"
          card-class="total-employees-card"
        />
      </div>
    </div> -->
  </div>
</template>

<script lang="ts">
import { ref, onMounted, computed } from 'vue';
import GlobalWidgetCard from 'src/components/shared/global/GlobalWidgetCard.vue';
// import GlobalWidgetCounter from 'src/components/shared/global/GlobalWidgetCounter.vue';
import GButton from 'src/components/shared/buttons/GButton.vue';
import { DashboardAttendanceService } from 'src/services/dashboard-attendance.service';
import { useQuasar } from 'quasar';

export default {
  name: 'ManpowerDailyAttendance',
  components: {
    GlobalWidgetCard,
    // GlobalWidgetCounter,
    GButton,
  },
  setup() {
    const $q = useQuasar();

    // State
    const loading = ref(true);
    const error = ref(false);
    const selectedDate = ref(new Date().toISOString().split('T')[0]);
    const attendanceData = ref({
      present: 0,
      late: 0,
      undertime: 0,
      absent: 0,
      onLeave: 0,
    });
    const totalActiveEmployees = ref(0);
    const leavesThisMonth = ref(0);
    const formattedDate = ref('');

    // Colors for each category
    const colors = {
      present: '#2F40C4',
      late: '#615FF6',
      undertime: '#014781',
      absent: '#FF6B6B',  // Changed to a red color for better visibility
      onLeave: '#63D7E6',
    };

    // Computed properties
    const legendItems = computed(() => [
      { label: 'Present', value: attendanceData.value.present, color: colors.present },
      { label: 'Late', value: attendanceData.value.late, color: colors.late },
      { label: 'Undertime', value: attendanceData.value.undertime, color: colors.undertime },
      { label: 'Absent', value: attendanceData.value.absent, color: colors.absent },
      { label: 'On-leave', value: attendanceData.value.onLeave, color: colors.onLeave },
    ]);

    const chartSeries = computed(() => [
      attendanceData.value.present,
      attendanceData.value.late,
      attendanceData.value.undertime,
      attendanceData.value.absent,
      attendanceData.value.onLeave
    ]);

    // Chart configuration
    const chartOptions = ref({
      chart: {
        type: 'donut',
        fontFamily: 'inherit',
        background: 'transparent',
      },
      labels: ['Present', 'Late', 'Undertime', 'Absent', 'On-leave'],
      colors: [colors.present, colors.late, colors.undertime, colors.absent, colors.onLeave],
      dataLabels: {
        enabled: false,
      },
      plotOptions: {
        pie: {
          donut: {
            size: '60%',
            labels: {
              show: false,
            },
          },
        },
      },
      legend: {
        show: false,
      },
      stroke: {
        width: 0,
      },
      tooltip: {
        theme: 'dark',
        y: {
          formatter: function (value: number) {
            return value + ' employees';
          },
        },
      },
    });

    // Methods
    const fetchAttendanceData = async () => {
      try {
        loading.value = true;
        error.value = false;

        const data = await DashboardAttendanceService.getDailyAttendance(selectedDate.value);

        attendanceData.value = data.attendance;
        totalActiveEmployees.value = data.totalActiveEmployees;
        leavesThisMonth.value = data.leavesThisMonth;
        formattedDate.value = data.formattedDate;
      } catch (err) {
        console.error('Failed to fetch attendance data:', err);
        error.value = true;
        $q.notify({
          type: 'negative',
          message: 'Failed to load attendance data',
          position: 'top-right',
        });
      } finally {
        loading.value = false;
      }
    };

    const refreshData = () => {
      DashboardAttendanceService.clearCache();
      fetchAttendanceData();
    };

    const onDateChange = (value: string) => {
      selectedDate.value = value;
      fetchAttendanceData();
    };

    // Lifecycle
    onMounted(() => {
      fetchAttendanceData();
    });

    return {
      loading,
      error,
      selectedDate,
      chartOptions,
      chartSeries,
      legendItems,
      totalActiveEmployees,
      leavesThisMonth,
      formattedDate,
      refreshData,
      fetchAttendanceData,
      onDateChange,
    };
  },
};
</script>

<style scoped lang="scss">
.daily-attendance {
  margin-bottom: 12px;
}

.chart-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 12px;
}

.legend-container {
  margin-left: 24px;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.legend-item {
  .legend-color {
    width: 24px;
    height: 10px;
    border-radius: 20px;
  }
}

.info-cards-container {
  height: 100%;
  display: flex;
  gap: 25px;
}

.total-employees-card {
  background-image: url('assets/img/card1.webp');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-color: #e0ecf8;
}

:deep(.apexcharts-canvas) {
  svg {
    overflow: visible;
  }
}

.text-grey {
  color: #666 !important;
}

.text-grey-5 {
  color: #9e9e9e !important;
}
</style>
