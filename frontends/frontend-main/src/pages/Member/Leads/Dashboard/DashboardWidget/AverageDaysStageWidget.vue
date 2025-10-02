<template>
  <GlobalWidgetCard>
    <!-- Title -->
    <template #title>Average of Days in Current Dates Vs. Stages</template>

    <!-- Content -->
    <template #content>
      <!-- Bar Chart -->
      <div class="chart-container">
        <div v-if="loading" class="chart-skeleton">
          <q-skeleton type="rect" height="300px" />
        </div>
        <div v-else-if="averageDaysData.length > 0 && chartReady">
          <ApexChart
            :key="chartKey"
            type="bar"
            height="300"
            width="104%"
            class="chart"
            :options="chartOptions"
            :series="chartSeries"
          />
          <span class="chart-title text-label-medium text-grey-light">STAGE</span>
        </div>
        <div v-else-if="!chartReady" class="q-pa-lg text-center">
          <q-spinner-dots size="2em" color="primary" />
          <div class="text-body-medium q-mt-sm">Loading chart...</div>
        </div>
        <div v-else class="q-pa-lg text-center text-grey-6">
          <q-icon name="bar_chart" size="48px" class="q-mb-md" />
          <div class="text-body-medium">No data available</div>
        </div>
      </div>
    </template>
  </GlobalWidgetCard>
</template>

<script lang="ts">
import { ref, onMounted, computed, nextTick } from "vue";
import { Notify } from "quasar";
import GlobalWidgetCard from "src/components/shared/global/GlobalWidgetCard.vue";
import VueApexCharts from "vue3-apexcharts";

interface AverageDaysData {
  stage: string;
  days: number;
  color: string;
}

export default {
  name: "AverageDaysStageWidget",
  components: {
    GlobalWidgetCard,
    ApexChart: VueApexCharts,
  },
  setup() {
    // Reactive data
    const loading = ref(false);
    const chartReady = ref(false);
    const chartKey = ref(0);

    // Average days data based on the provided screenshot
    const averageDaysData = ref<AverageDaysData[]>([
      { stage: "Negotiations", days: 78, color: "#615FF6" },
      { stage: "Technical Meeting", days: 80, color: "#2f40c4" },
      { stage: "Proposal", days: 85, color: "#615FF6" },
      { stage: "Loss", days: 90, color: "#2f40c4" },
      { stage: "Won", days: 90, color: "#615FF6" },
      { stage: "Initial Meeting", days: 95, color: "#2f40c4" },
      { stage: "Prospect", days: 98, color: "#615FF6" },
    ]);

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
            colors: ["#fff"],
            fontSize: "12px",
            fontFamily: "inherit",
            fontWeight: 400,
          },
          formatter: function (val: number) {
            return val >= 5 ? val.toString() : "";
          },
          offsetY: 0,
        },
        colors: averageDaysData.value.map((d) => d.color),
        xaxis: {
          categories: averageDaysData.value.map((d) => d.stage),
          axisBorder: {
            show: false,
          },
          axisTicks: {
            show: false,
          },
          labels: {
            style: {
              colors: "#747786",
              fontSize: "9.5px",
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
          max: 100,
          min: 0,
          tickAmount: 5,
          title: {
            text: "Average Days in Current",
            rotate: -90,
            offsetX: 0,
            style: {
              color: "#747786",
              fontSize: "12px",
              fontWeight: 400,
            },
          },
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
              return value + " days";
            },
          },
          theme: "light",
        },
      };
    });

    const chartSeries = computed(() => {
      return [
        {
          name: "Average Days",
          data: averageDaysData.value.map((d) => d.days),
        },
      ];
    });

    const loadAverageDaysData = async () => {
      try {
        loading.value = true;

        // Simulate API call - replace with actual service call
        await new Promise((resolve) => setTimeout(resolve, 500));

        // In production, you would fetch data from your API here:
        // const data = await LeadService.getAverageDaysInStage();
        // averageDaysData.value = data;

        // Force chart refresh
        chartKey.value++;

        await nextTick();
      } catch (error) {
        console.error("[AverageDaysStage] Failed to load average days data:", error);
        Notify.create({
          type: "negative",
          message: "Failed to load average days data",
          position: "top",
        });
      } finally {
        loading.value = false;
      }
    };

    const refreshData = async () => {
      await loadAverageDaysData();
      Notify.create({
        type: "positive",
        message: "Average days data refreshed",
        position: "top",
      });
    };

    // Load data on mount
    onMounted(async () => {
      // Wait a short delay to ensure ApexCharts is fully loaded
      setTimeout(() => {
        chartReady.value = true;
      }, 100);

      await loadAverageDaysData();
    });

    return {
      chartOptions,
      chartSeries,
      loading,
      chartReady,
      chartKey,
      averageDaysData,
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
  margin-top: -15px;
  text-transform: uppercase;
}
</style>