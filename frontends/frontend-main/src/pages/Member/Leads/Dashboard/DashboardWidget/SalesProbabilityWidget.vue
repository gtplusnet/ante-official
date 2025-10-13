<template>
  <GlobalWidgetCard>
    <!-- Title -->
    <template #title>Sales Probability</template>

    <!-- Content -->
    <template #content>
      <!-- Bar Chart -->
      <div class="chart-container">
        <div v-if="loading" class="chart-skeleton">
          <q-skeleton type="rect" height="300px" />
        </div>
        <div v-else-if="hasData && chartReady">
          <ApexChart
            :key="chartKey"
            type="bar"
            height="300"
            width="102%"
            :options="chartOptions"
            :series="chartSeries"
          />
          <span class="chart-title text-label-medium text-grey-light">By Probability</span>
        </div>
        <div v-else-if="!chartReady" class="q-pa-lg text-center">
          <q-spinner-dots size="2em" color="primary" />
          <div class="text-body-medium q-mt-sm">Loading chart...</div>
        </div>
        <div v-else class="q-pa-lg text-center text-grey-6">
          <q-icon name="bar_chart" size="48px" class="q-mb-md" />
          <div class="text-body-medium">No sales probability data available</div>
        </div>
      </div>
    </template>
  </GlobalWidgetCard>
</template>

<script lang="ts">
import { ref, onMounted, computed, nextTick } from "vue";
import { Notify, useQuasar } from "quasar";
import GlobalWidgetCard from "src/components/shared/global/GlobalWidgetCard.vue";
import VueApexCharts from "vue3-apexcharts";
import { APIRequests } from "src/utility/api.handler";

interface ProbabilityData {
  category: string;
  count: number;
  color: string;
}

export default {
  name: "SalesProbabilityWidget",
  components: {
    GlobalWidgetCard,
    ApexChart: VueApexCharts,
  },
  setup() {
    const $q = useQuasar();

    // Reactive data
    const loading = ref(false);
    const chartReady = ref(false);
    const chartKey = ref(0);

    // Probability data - will be populated from API
    const probabilityData = ref<ProbabilityData[]>([]);

    // Check if there's any meaningful data (count > 0)
    const hasData = computed(() => {
      return probabilityData.value.some(d => d.count > 0);
    });

    // Chart configuration
    const chartOptions = computed(() => {
      return {
        chart: {
          type: "bar",
          toolbar: {
            show: false,
          },
          fontFamily: "inherit",
          sparkline: {
            enabled: false,
          },
        },
        plotOptions: {
          bar: {
            borderRadius: 6,
            borderRadiusApplication: "end",
            columnWidth: "60%",
            distributed: true,
            dataLabels: {
              position: "center",
            },
            horizontal: false,
          },
        },
        dataLabels: {
          enabled: true,
          style: {
            colors: ["#fff", "#fff", "#fff", "#fff", "#fff", "#fff", "#fff"],
            fontSize: "12px",
            fontFamily: "inherit",
            fontWeight: 400,
          },
          formatter: function (val: number) {
            return val >= 5 ? val.toString() : "";
          },
          offsetY: 0,
        },
        colors: probabilityData.value.map((d) => d.color),
        xaxis: {
          categories: probabilityData.value.map((d) => d.category),
          axisBorder: {
            show: false,
          },
          axisTicks: {
            show: false,
          },
          labels: {
            style: {
              colors: "#747786",
              fontSize: "12px",
            },
          },
        },
        yaxis: {
          show: true,
          labels: {
            style: {
              colors: "#747786",
              fontSize: "12px",
            },
          },
          max: 35,
          tickAmount: 7,
        },
        grid: {
          show: true,
          borderColor: "#f0f0f0",
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
          padding: {
            left: 10,
            right: 10,
          },
        },
        legend: {
          show: false,
        },
        tooltip: {
          enabled: true,
          y: {
            formatter: function (value: number) {
              return value + " leads";
            },
          },
          theme: "light",
        },
      };
    });

    const chartSeries = computed(() => {
      return [
        {
          name: "Probability",
          data: probabilityData.value.map((d) => d.count),
        },
      ];
    });

    const loadProbabilityData = async () => {
      try {
        loading.value = true;

        // Fetch probability data from API
        const response = await APIRequests.getSalesProbabilitySummary($q);

        if (Array.isArray(response)) {
          probabilityData.value = response as ProbabilityData[];
        }

        // Force chart refresh
        chartKey.value++;

        await nextTick();
      } catch (error) {
        console.error("[SalesProbability] Failed to load probability data:", error);
        Notify.create({
          type: "negative",
          message: "Failed to load sales probability data",
          position: "top",
        });
      } finally {
        loading.value = false;
      }
    };

    const refreshData = async () => {
      await loadProbabilityData();
      Notify.create({
        type: "positive",
        message: "Probability data refreshed",
        position: "top",
      });
    };

    // Load data on mount
    onMounted(async () => {
      // Wait a short delay to ensure ApexCharts is fully loaded
      setTimeout(() => {
        chartReady.value = true;
      }, 100);

      await loadProbabilityData();
    });

    return {
      chartOptions,
      chartSeries,
      loading,
      chartReady,
      chartKey,
      probabilityData,
      hasData,
      refreshData,
    };
  },
};
</script>

<style scoped lang="scss">
.chart-container {
  margin-bottom: 15px;
}

.chart-title {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: -20px;
  text-transform: uppercase;
}
</style>