<template>
  <GlobalWidgetCard>
    <template #title>Closing Dates</template>

    <template #content>
      <div class="chart-container">
        <div v-if="loading" class="chart-skeleton">
          <q-skeleton type="rect" height="300px" />
        </div>
        <div v-else-if="closingDates.length > 0 && chartReady">
          <ApexChart
            :key="chartKey"
            type="bar"
            height="300"
            width="102%"
            :options="chartOptions"
            :series="chartSeries"
          />
        </div>
        <div v-else-if="!chartReady" class="q-pa-lg text-center">
          <q-spinner-dots size="2em" color="primary" />
          <div class="text-body-medium q-mt-sm">Loading chart...</div>
        </div>
        <div v-else class="q-pa-lg text-center text-grey-6">
          <q-icon name="bar_chart" size="48px" class="q-mb-md" />
          <div class="text-body-medium">No closing dates data available</div>
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

interface ClosingDate {
  month: string;
  count: number;
  color: string;
}

interface ClosingDateSummary {
  month: string;
  count: number;
}

export default {
  name: "ClosingDatesWidget",
  components: {
    GlobalWidgetCard,
  },
  setup() {
    const $q = useQuasar();

    const loading = ref(false);
    const chartReady = ref(false);
    const chartKey = ref(0);

    const closingDates = ref<ClosingDate[]>([]);

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
        colors: closingDates.value.map((d) => d.color),
        xaxis: {
          categories: closingDates.value.map((d) => d.month),
          axisBorder: {
            show: true,
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
            formatter: function (val: number) {
              return Math.floor(val).toString();
            },
          },
          min: 0,
          max: Math.max(...closingDates.value.map((d) => d.count), 25),
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
            bottom: 0,
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
          name: "Closing Dates",
          data: closingDates.value.map((d) => d.count),
        },
      ];
    });

    // Generate color based on count (darker for higher counts)
    const generateColor = (count: number, maxCount: number): string => {
      // Define color palette from darkest to lightest
      const colors = [
        "#2f40c4", // Darkest blue (for Unknown or highest)
        "#615FF6", // Dark blue
        "#63D7E6", // Light blue
        "#E3F2FD", // Lightest blue
      ];

      if (maxCount === 0) return colors[colors.length - 1];

      // Unknown gets the darkest color
      if (count === -1) return colors[0];

      // Calculate percentage and map to color index
      const percentage = count / maxCount;
      if (percentage >= 0.6) return colors[1];
      if (percentage >= 0.3) return colors[2];
      return colors[3];
    };

    const loadClosingDatesData = async () => {
      try {
        loading.value = true;

        // Fetch data from API
        const response = await APIRequests.getClosingDatesSummary($q);

        if (Array.isArray(response)) {
          const data = response as ClosingDateSummary[];

          // Find max count for color generation (excluding Unknown)
          const maxCount = Math.max(
            ...data
              .filter((d) => d.month !== "Unknown")
              .map((d) => d.count),
            0
          );

          // Map to ClosingDate format with dynamic colors
          closingDates.value = data.map((item) => ({
            month: item.month,
            count: item.count,
            color:
              item.month === "Unknown"
                ? "#2f40c4" // Dark blue for Unknown
                : generateColor(item.count, maxCount),
          }));
        }

        // Force chart refresh
        chartKey.value++;

        await nextTick();
      } catch (error) {
        console.error("[ClosingDates] Failed to load closing dates data:", error);
        Notify.create({
          type: "negative",
          message: "Failed to load closing dates data",
          position: "top",
        });
      } finally {
        loading.value = false;
      }
    };

    const refreshData = async () => {
      await loadClosingDatesData();
      Notify.create({
        type: "positive",
        message: "Closing dates data refreshed",
        position: "top",
      });
    };

    onMounted(async () => {
      setTimeout(() => {
        chartReady.value = true;
      }, 100);

      await loadClosingDatesData();
    });

    return {
      chartOptions,
      chartSeries,
      loading,
      chartReady,
      chartKey,
      closingDates,
      refreshData,
    };
  },
};
</script>

<style scoped lang="scss">
.chart-container {
  margin-bottom: 15px;
}
</style>