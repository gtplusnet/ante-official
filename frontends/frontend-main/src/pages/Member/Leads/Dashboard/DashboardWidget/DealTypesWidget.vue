<template>
  <GlobalWidgetCard>
    <!-- Title -->
    <template #title>Deal Types</template>

    <!-- Content -->
    <template #content>
      <!-- Bar Chart -->
      <div class="chart-container">
        <div v-if="loading" class="chart-skeleton">
          <q-skeleton type="rect" height="300px" />
        </div>
        <div v-else-if="dealTypes.length > 0 && chartReady">
          <ApexChart
            :key="chartKey"
            type="bar"
            height="300"
            width="102%"
            :options="chartOptions"
            :series="chartSeries"
          />
          <span class="chart-title text-label-medium text-grey-light">DEALS</span>
        </div>
        <div v-else-if="!chartReady" class="q-pa-lg text-center">
          <q-spinner-dots size="2em" color="primary" />
          <div class="text-body-medium q-mt-sm">Loading chart...</div>
        </div>
        <div v-else class="q-pa-lg text-center text-grey-6">
          <q-icon name="bar_chart" size="48px" class="q-mb-md" />
          <div class="text-body-medium">No deal data available</div>
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

interface DealType {
  type: string;
  count: number;
  color: string;
}

export default {
  name: "DealTypesWidget",
  components: {
    GlobalWidgetCard,
    ApexChart: VueApexCharts,
  },
  setup() {
    // Reactive data
    const loading = ref(false);
    const chartReady = ref(false);
    const chartKey = ref(0);

    // Deal types data based on the provided screenshot
    const dealTypes = ref<DealType[]>([
      { type: "BPO", count: 8, color: "#615FF6" },
      { type: "SaaS", count: 28, color: "#014781" },
      { type: "SaaS + BPO", count: 27, color: "#2f40c4" },
      { type: "AUP", count: 2, color: "#E3F2FD" },
      { type: "LOA", count: 3, color: "#E3F2FD" },
      { type: "Audit", count: 2, color: "#E3F2FD" },
      { type: "Strategic", count: 2, color: "#E3F2FD" },
      { type: "Unknown", count: 3, color: "#E3F2FD" },
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
            colors: ["#fff", "#fff", "#fff", "#110848", "#110848", "#110848", "#110848", "#110848"],
            fontSize: "12px",
            fontFamily: "inherit",
            fontWeight: 400,
          },
          formatter: function (val: number) {
            return val >= 5 ? val.toString() : "";
          },
          offsetY: 0,
        },
        colors: dealTypes.value.map((d) => d.color),
        xaxis: {
          categories: dealTypes.value.map((d) => d.type),
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
          max: 30,
          tickAmount: 6,
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
              return value + " deals";
            },
          },
          theme: "light",
        },
      };
    });

    const chartSeries = computed(() => {
      return [
        {
          name: "Deals",
          data: dealTypes.value.map((d) => d.count),
        },
      ];
    });

    const loadDealData = async () => {
      try {
        loading.value = true;

        // Simulate API call - replace with actual service call
        await new Promise((resolve) => setTimeout(resolve, 500));

        // In production, you would fetch data from your API here:
        // const data = await LeadService.getDealTypes();
        // dealTypes.value = data;

        // Force chart refresh
        chartKey.value++;

        await nextTick();
      } catch (error) {
        console.error("[DealTypes] Failed to load deal data:", error);
        Notify.create({
          type: "negative",
          message: "Failed to load deal types data",
          position: "top",
        });
      } finally {
        loading.value = false;
      }
    };

    const refreshData = async () => {
      await loadDealData();
      Notify.create({
        type: "positive",
        message: "Deal data refreshed",
        position: "top",
      });
    };

    // Load data on mount
    onMounted(async () => {
      // Wait a short delay to ensure ApexCharts is fully loaded
      setTimeout(() => {
        chartReady.value = true;
      }, 100);

      await loadDealData();
    });

    return {
      chartOptions,
      chartSeries,
      loading,
      chartReady,
      chartKey,
      dealTypes,
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
}
</style>