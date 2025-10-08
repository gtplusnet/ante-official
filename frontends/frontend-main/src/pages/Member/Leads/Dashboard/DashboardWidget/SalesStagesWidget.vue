<template>
  <GlobalWidgetCard>
    <!-- Title -->
    <template #title>Sales Stages</template>

    <!-- Content -->
    <template #content>
      <!-- Bar Chart -->
      <div class="chart-container">
        <div v-if="loading" class="chart-skeleton">
          <q-skeleton type="rect" height="300px" />
        </div>
        <div v-else-if="salesStages.length > 0 && chartReady">
          <ApexChart
            :key="chartKey"
            type="bar"
            height="300"
            width="104%"
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
          <div class="text-body-medium">No sales data available</div>
        </div>
      </div>
    </template>
  </GlobalWidgetCard>
</template>

<script lang="ts">
import { ref, onMounted, computed, nextTick } from "vue";
import { Notify, useQuasar } from "quasar";
import GlobalWidgetCard from "src/components/shared/global/GlobalWidgetCard.vue";
import { APIRequests } from "src/utility/api.handler";

interface SalesStage {
  stage: string;
  count: number;
  color: string;
}

interface BoardColumn {
  boardKey: string;
  boardName: string;
  boardType: string;
  boardOrder: number;
  boardProjects?: any[];
}

export default {
  name: "SalesStagesWidget",
  components: {
    GlobalWidgetCard,
  },
  setup() {
    const $q = useQuasar();

    // Reactive data
    const loading = ref(false);
    const chartReady = ref(false);
    const chartKey = ref(0);

    // Sales stages data - will be populated from board data
    const salesStages = ref<SalesStage[]>([]);

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
            borderRadius: 8,
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
            colors: ["#fff", "#fff", "#fff", "#fff", "#110848"],
            fontSize: "12px",
            fontFamily: "inherit",
            fontWeight: 400,
          },
          formatter: function (val: number) {
            return val > 0 ? val.toString() : "";
          },
          offsetY: 0,
        },
        colors: salesStages.value.map((s) => s.color),
        xaxis: {
          categories: salesStages.value.map((s) => s.stage),
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
          max: 25,
          tickAmount: 5,
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
          name: "Leads",
          data: salesStages.value.map((s) => s.count),
        },
      ];
    });

    const loadSalesData = async () => {
      try {
        loading.value = true;

        // Fetch board data using the same endpoint as LeadsBoardView
        const response = await APIRequests.getLeadBoard($q);

        if (Array.isArray(response)) {
          // Define stage mapping with colors
          const stageMap: Record<string, { name: string; color: string }> = {
            prospect: { name: "Prospect", color: "#2f40c4" },
            initial_meeting: { name: "Internal Meeting", color: "#615FF6" },
            technical_meeting: { name: "Technical Meeting", color: "#014781" },
            proposal: { name: "Proposal", color: "#63D7E6" },
            in_negotiation: { name: "Negotiations", color: "#E3F2FD" },
          };

          // Map board data to sales stages (exclude won/loss stages)
          salesStages.value = Object.keys(stageMap)
            .map((key) => {
              const column = (response as BoardColumn[]).find(
                (col) => col.boardKey === key
              );
              return {
                stage: stageMap[key].name,
                count: column?.boardProjects?.length || 0,
                color: stageMap[key].color,
              };
            });
        }

        // Force chart refresh
        chartKey.value++;

        await nextTick();
      } catch (error) {
        console.error("[SalesStages] Failed to load sales data:", error);
        Notify.create({
          type: "negative",
          message: "Failed to load sales stages data",
          position: "top",
        });
      } finally {
        loading.value = false;
      }
    };

    const refreshData = async () => {
      await loadSalesData();
      Notify.create({
        type: "positive",
        message: "Sales data refreshed",
        position: "top",
      });
    };

    // Load data on mount
    onMounted(async () => {
      // Wait a short delay to ensure ApexCharts is fully loaded
      setTimeout(() => {
        chartReady.value = true;
      }, 100);

      await loadSalesData();
    });

    return {
      chartOptions,
      chartSeries,
      loading,
      chartReady,
      chartKey,
      salesStages,
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
