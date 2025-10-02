<template>
  <GlobalWidgetCard>
    <!-- Title -->
    <template #title>Payroll Summary</template>

    <!-- Content -->
    <template #content>
      <!-- Bar Chart -->
      <div class="chart-container">
        <div v-if="loading" class="chart-skeleton">
          <q-skeleton type="rect" height="250px" />
        </div>
        <ApexChart
          v-else-if="payrollData.monthlyData && payrollData.monthlyData.length > 0 && chartReady"
          :key="`chart-${payrollData.lastUpdated?.getTime() || 0}`"
          type="bar"
          height="250"
          :options="chartOptions"
          :series="chartSeries"
        />
        <div v-else-if="!chartReady" class="q-pa-lg text-center">
          <q-spinner-dots size="2em" color="primary" />
          <div class="text-body-medium q-mt-sm">Loading chart...</div>
        </div>
        <div v-else class="q-pa-lg text-center text-grey-6">
          <q-icon name="bar_chart" size="48px" class="q-mb-md" />
          <div class="text-body-medium">No payroll data available</div>
        </div>
      </div>

      <!-- Summary Cards -->
      <div class="row items-center justify-between nowrap">
        <div class="row">
          <div class="summary-card row items-center q-mr-md">
            <div class="icon-container">
              <q-icon name="business_center" size="24Fpx" color="primary" />
            </div>
            <div class="column items-start justify-center">
              <div class="text-title-medium text-dark row items-center">
                <span v-if="loading">Loading...</span>
                <span v-else>{{ formatCurrency(payrollData.currentYearTotal || 0) }}</span>
                <span v-if="!loading && (payrollData.percentageChange || 0) !== 0"
                      class="pls-percent text-label-medium q-ml-sm"
                      :class="payrollData.isPositive ? 'text-positive' : 'text-negative'">
                  {{ payrollData.isPositive ? '+' : '' }}{{ (payrollData.percentageChange || 0).toFixed(2) }}%
                </span>
              </div>
              <span class="text-body-medium text-grey">This Year</span>
            </div>
          </div>
          <div class="summary-card row items-center">
            <div class="icon-container" :style="{ backgroundColor: '#E8E3F9' }">
              <q-icon name="business_center" size="24px" color="secondary" />
            </div>
            <div class="column items-start justify-center">
              <div class="text-title-medium text-dark row items-center">
                <span v-if="loading">Loading...</span>
                <span v-else>{{ formatCurrency(payrollData.previousYearTotal || 0) }}</span>
              </div>
              <span class="text-body-medium text-grey">Last Year</span>
            </div>
          </div>
        </div>

        <!-- Refresh and View Details Buttons -->
        <div class="row q-gutter-sm">
          <GButton
            variant="text"
            icon="refresh"
            color="secondary"
            @click="refreshData"
            :loading="loading"
            round
            dense
            class
          >
            <q-tooltip>Refresh Data</q-tooltip>
          </GButton>
          <GButton
            label="View Details"
            color="secondary"
            @click="viewDetails"
          />
        </div>
      </div>
    </template>
  </GlobalWidgetCard>
</template>

<script lang="ts">
import { ref, onMounted, computed, watch, nextTick } from 'vue';
import { Notify } from 'quasar';
import GlobalWidgetCard from 'src/components/shared/global/GlobalWidgetCard.vue';
import GButton from 'src/components/shared/buttons/GButton.vue';
import { DashboardPayrollService, type PayrollSummaryData } from 'src/services/dashboard-payroll.service';

export default {
  name: 'ManpowerPayrollSummary',
  components: {
    GlobalWidgetCard,
    GButton,
  },
  setup() {
    // Reactive data
    const loading = ref(true);
    const chartReady = ref(false);
    const payrollData = ref<PayrollSummaryData>({
      monthlyData: [
        { month: 'Jan', amount: 0, startDate: new Date(), cutoffCount: 0 },
        { month: 'Feb', amount: 0, startDate: new Date(), cutoffCount: 0 },
        { month: 'Mar', amount: 0, startDate: new Date(), cutoffCount: 0 },
        { month: 'Apr', amount: 0, startDate: new Date(), cutoffCount: 0 },
        { month: 'May', amount: 0, startDate: new Date(), cutoffCount: 0 },
        { month: 'Jun', amount: 0, startDate: new Date(), cutoffCount: 0 },
        { month: 'Jul', amount: 0, startDate: new Date(), cutoffCount: 0 },
        { month: 'Aug', amount: 0, startDate: new Date(), cutoffCount: 0 },
        { month: 'Sep', amount: 0, startDate: new Date(), cutoffCount: 0 },
        { month: 'Oct', amount: 0, startDate: new Date(), cutoffCount: 0 },
        { month: 'Nov', amount: 0, startDate: new Date(), cutoffCount: 0 },
        { month: 'Dec', amount: 0, startDate: new Date(), cutoffCount: 0 },
      ],
      currentYearTotal: 0,
      previousYearTotal: 0,
      percentageChange: 0,
      isPositive: false,
      lastUpdated: new Date(),
    });

    // Generate alternating colors for bars
    const barColors = computed(() =>
      payrollData.value.monthlyData?.map((_, index) => (index % 2 === 0 ? '#2F40C4' : '#615FF6')) || []
    );

    // Chart configuration
    const chartOptions = computed(() => {
      if (!payrollData.value.monthlyData || payrollData.value.monthlyData.length === 0) {
        return {};
      }

      return {
        chart: {
          type: 'bar',
          toolbar: {
            show: false,
          },
          fontFamily: 'inherit',
        },
        dataLabels: {
          enabled: false,
        },
        xaxis: {
          categories: payrollData.value.monthlyData.map((item) => item.month || ''),
          axisBorder: {
            show: false,
          },
          axisTicks: {
            show: false,
          },
          labels: {
            style: {
              colors: '#666',
              fontSize: '12px',
            },
          },
        },
        yaxis: {
          labels: {
            formatter: function (value: number) {
              if (!value || isNaN(value)) return '0';
              if (value >= 1000000) {
                return (value / 1000000).toFixed(1) + 'M';
              } else if (value >= 1000) {
                return (value / 1000).toFixed(0) + 'K';
              }
              return value.toString();
            },
            style: {
              colors: '#666',
              fontSize: '12px',
            },
          },
          max: Math.max(...payrollData.value.monthlyData.map(item => item.amount || 0)) * 1.1 || 100000,
        },
        grid: {
          borderColor: '#f0f0f0',
          strokeDashArray: 0,
          xaxis: {
            lines: {
              show: false,
            },
          },
          yaxis: {
            lines: {
              show: true,
            },
          },
        },
        colors: barColors.value,
        plotOptions: {
          bar: {
            borderRadius: 4,
            columnWidth: '60%',
            distributed: true,
            dataLabels: {
              position: 'top',
            },
          },
        },
        legend: {
          show: false,
        },
        tooltip: {
          y: {
            formatter: function (value: number) {
              if (!value || isNaN(value)) return '₱ 0.00';
              return (
                '₱ ' +
                value.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })
              );
            },
          },
          theme: 'light',
        },
      };
    });

    const chartSeries = computed(() => {
      if (!payrollData.value.monthlyData || payrollData.value.monthlyData.length === 0) {
        return [{
          name: 'Payroll',
          data: [],
        }];
      }

      return [{
        name: 'Payroll',
        data: payrollData.value.monthlyData.map((item) => item.amount || 0),
      }];
    });

    const viewDetails = () => {
      // In a real app, this would navigate to a detailed payroll page
    };

    const loadPayrollData = async () => {
      try {
        loading.value = true;
        const data = await DashboardPayrollService.getPayrollSummary();
        payrollData.value = data;

        // Wait for next tick to ensure DOM is updated
        await nextTick();
      } catch (error) {
        console.error('[PayrollSummary] Failed to load payroll data:', error);
        Notify.create({
          type: 'negative',
          message: 'Failed to load payroll data',
          position: 'top',
        });
      } finally {
        loading.value = false;
      }
    };

    const refreshData = async () => {
      DashboardPayrollService.clearCache();
      await loadPayrollData();

      Notify.create({
        type: 'positive',
        message: 'Payroll data refreshed',
        position: 'top',
      });
    };

    const formatCurrency = (amount: number): string => {
      return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        minimumFractionDigits: 2,
      }).format(amount);
    };

    // Debug watcher
    watch(payrollData, () => {
    }, { deep: true });

    // Load data on mount
    onMounted(async () => {

      // Clear cache to get fresh data
      DashboardPayrollService.clearCache();

      // Wait a short delay to ensure ApexCharts is fully loaded
      setTimeout(() => {
        chartReady.value = true;
      }, 100);

      await loadPayrollData();
    });

    return {
      chartOptions,
      chartSeries,
      viewDetails,
      loading,
      chartReady,
      payrollData,
      refreshData,
      formatCurrency,
    };
  },
};
</script>

<style scoped lang="scss">

.summary-card {
  gap: 12px;
  padding: 16px 0;

  .icon-container {
    background-color: #e0ecf8;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50px;
    padding: 6px 20px;
    height: 40px;
  }

  .pls-percent {
    background-color: #63d7e62e;
    padding: 2px 5px;
    border-radius: 50px;
  }
}

:deep(.apexcharts-canvas) {
  svg {
    overflow: visible;
  }
}

:deep(.apexcharts-bar-series) {
  .apexcharts-bar-area {
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover {
      filter: brightness(1.1);
    }
  }
}

.text-positive {
  color: #21ba45;
}

.text-negative {
  color: #c10015;
}

.chart-skeleton {
  width: 100%;
  border-radius: 8px;
  overflow: hidden;
}

.pls-percent {
  background-color: #63d7e62e;
  padding: 2px 8px;
  border-radius: 50px;
  font-size: 12px;
}
</style>
