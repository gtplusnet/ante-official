<template>
  <GlobalWidgetCard>
    <template #title>API Usage</template>
    <template #actions>
      <q-btn
        flat
        dense
        label="View Details"
        color="primary"
        size="sm"
        class="md3-button"
      />
    </template>
    <template #content>
      <div class="md3-api-usage">
        <!-- Chart Section -->
        <div class="md3-chart-section">
          <div class="md3-chart-header">
            <h3 class="md3-title-medium">REST API Usage - Last 7 Days</h3>
          </div>

          <!-- ApexCharts Line Chart -->
          <div class="md3-chart-container">
            <apexchart
              v-if="chartSeries && chartSeries.length > 0"
              type="area"
              height="120"
              :options="chartOptions"
              :series="chartSeries"
              class="md3-chart-canvas"
            />
            <div v-else class="md3-chart-loading">
              <q-spinner color="primary" size="1.5em" />
              <span class="md3-body-small md3-on-surface-variant">Loading chart...</span>
            </div>
          </div>
        </div>

        <!-- Statistics Row -->
        <div class="md3-stats-row">
          <div class="md3-stat-item">
            <span class="md3-label-small md3-on-surface-variant">Total Requests</span>
            <span class="md3-title-large md3-on-surface">{{ formatNumber(apiStatistics?.totalRequests || 0) }}</span>
          </div>
          <div class="md3-stat-item">
            <span class="md3-label-small md3-on-surface-variant">Avg Response</span>
            <span class="md3-title-large md3-on-surface">{{ apiStatistics?.avgResponseTime || 0 }}ms</span>
          </div>
          <div class="md3-stat-item">
            <span class="md3-label-small md3-on-surface-variant">Success Rate</span>
            <span class="md3-title-large md3-success">{{ apiStatistics?.successRate || 100 }}%</span>
          </div>
          <div class="md3-stat-item">
            <span class="md3-label-small md3-on-surface-variant">Active Tokens</span>
            <span class="md3-title-large md3-on-surface">{{ apiStatistics?.activeTokens || 0 }}</span>
          </div>
        </div>

        <!-- Top Endpoints Section -->
        <div class="md3-endpoints-section">
          <div class="md3-section-header">
            <h4 class="md3-title-medium md3-on-surface">Top Endpoints</h4>
          </div>
          <div class="md3-endpoints-compact">
            <div v-if="loading" class="md3-loading-compact">
              <q-spinner color="primary" size="1.2em" />
            </div>
            <div v-else-if="topEndpoints.length === 0" class="md3-empty-compact">
              <span class="md3-body-small md3-on-surface-variant">No data</span>
            </div>
            <div v-else class="md3-endpoint-row" v-for="endpoint in topEndpoints" :key="endpoint.path">
              <div class="md3-endpoint-content">
                <q-badge
                  :label="endpoint.method"
                  :color="getMethodColor(endpoint.method)"
                  text-color="white"
                  class="md3-method-badge"
                />
                <span class="md3-body-small md3-on-surface md3-endpoint-path">{{ endpoint.path }}</span>
              </div>
              <span class="md3-label-small md3-on-surface-variant md3-calls-count">{{ endpoint.calls }}</span>
            </div>
          </div>
        </div>
      </div>
    </template>
  </GlobalWidgetCard>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, computed } from 'vue';
import { Notify } from 'quasar';
import GlobalWidgetCard from '../../../../../components/shared/global/GlobalWidgetCard.vue';
import {
  CMSAnalyticsService,
  WeeklyApiUsage,
  ApiStatistics,
  TopEndpoint
} from 'src/services/cms-analytics.service';

export default defineComponent({
  name: 'CMSAPIUsage',
  components: {
    GlobalWidgetCard,
  },
  setup() {
    const loading = ref(false);
    const weekData = ref<WeeklyApiUsage[]>([]);
    const apiStatistics = ref<ApiStatistics | null>(null);
    const topEndpoints = ref<TopEndpoint[]>([]);

    const loadApiUsageData = async () => {
      if (loading.value) return;

      loading.value = true;

      try {
        const [weeklyData, statistics, endpoints] = await Promise.all([
          CMSAnalyticsService.getWeeklyApiUsage(),
          CMSAnalyticsService.getApiStatistics(),
          CMSAnalyticsService.getTopEndpoints(),
        ]);

        weekData.value = weeklyData;
        apiStatistics.value = statistics;
        topEndpoints.value = endpoints.slice(0, 4); // Limit to 4 for display
      } catch (error) {
        console.error('Failed to load API usage data:', error);

        Notify.create({
          type: 'negative',
          message: 'Unable to load API usage data. Using default values.',
          timeout: 3000,
        });

        // Set fallback data
        weekData.value = [
          { name: 'Mon', rest: 0, restCount: 0 },
          { name: 'Tue', rest: 0, restCount: 0 },
          { name: 'Wed', rest: 0, restCount: 0 },
          { name: 'Thu', rest: 0, restCount: 0 },
          { name: 'Fri', rest: 0, restCount: 0 },
          { name: 'Sat', rest: 0, restCount: 0 },
          { name: 'Sun', rest: 0, restCount: 0 },
        ];

        apiStatistics.value = {
          totalRequests: 0,
          avgResponseTime: 0,
          successRate: 100,
          activeTokens: 0,
        };

        topEndpoints.value = [];
      } finally {
        loading.value = false;
      }
    };

    const getMethodColor = (method: string) => {
      const colors: Record<string, string> = {
        GET: 'green',
        POST: 'blue',
        PUT: 'orange',
        DELETE: 'red',
      };
      return colors[method] || 'grey';
    };

    const formatNumber = (num: number): string => {
      if (num >= 1000000) {
        return `${(num / 1000000).toFixed(1)}M`;
      } else if (num >= 1000) {
        return `${(num / 1000).toFixed(1)}k`;
      }
      return num.toString();
    };

    // ApexCharts configuration
    const chartSeries = computed(() => {
      if (!weekData.value || weekData.value.length === 0) return [];

      return [
        {
          name: 'REST API Calls',
          data: weekData.value.map(day => day.restCount),
        }
      ];
    });

    const chartOptions = computed(() => ({
      chart: {
        type: 'area',
        height: 120,
        toolbar: {
          show: false,
        },
        zoom: {
          enabled: false,
        },
        animations: {
          enabled: true,
          easing: 'easeinout',
          speed: 800,
        },
      },
      dataLabels: {
        enabled: false,
      },
      stroke: {
        curve: 'smooth',
        width: 2,
        colors: ['#6750a4'],
      },
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.3,
          opacityTo: 0.1,
          stops: [0, 90, 100],
        },
        colors: ['#6750a4'],
      },
      markers: {
        size: 4,
        colors: ['#6750a4'],
        strokeColors: '#ffffff',
        strokeWidth: 2,
        hover: {
          size: 6,
        },
      },
      xaxis: {
        categories: weekData.value.map(day => day.name),
        labels: {
          style: {
            colors: '#49454f',
            fontSize: '10px',
          },
        },
        axisBorder: {
          show: false,
        },
        axisTicks: {
          show: false,
        },
      },
      yaxis: {
        labels: {
          style: {
            colors: '#49454f',
            fontSize: '10px',
          },
          formatter: (value: number) => Math.round(value).toString(),
        },
        min: 0,
      },
      grid: {
        borderColor: 'rgba(230, 224, 233, 0.3)',
        strokeDashArray: 2,
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
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
        },
      },
      tooltip: {
        theme: 'dark',
        y: {
          formatter: (value: number) => `${value} API calls`,
        },
        style: {
          fontSize: '12px',
        },
      },
      legend: {
        show: false,
      },
    }));

    // Load data when component mounts
    onMounted(() => {
      loadApiUsageData();
    });

    return {
      loading,
      weekData,
      apiStatistics,
      topEndpoints,
      getMethodColor,
      formatNumber,
      chartSeries,
      chartOptions,
      loadApiUsageData,
    };
  },
});
</script>

<style scoped lang="scss">
// Material Design 3 Color Tokens
.md3-primary { background-color: #6750a4; }
.md3-secondary { background-color: #625b71; }
.md3-success { color: #1d7d33; }
.md3-on-surface { color: #1d1b20; }
.md3-on-surface-variant { color: #49454f; }

// Typography Scale (Compact)
.md3-title-large {
  font-size: 1.375rem;
  line-height: 1.75rem;
  font-weight: 600;
  letter-spacing: 0rem;
}

.md3-title-medium {
  font-size: 1rem;
  line-height: 1.5rem;
  font-weight: 500;
  letter-spacing: 0.009375rem;
  margin: 0;
}

.md3-body-small {
  font-size: 0.75rem;
  line-height: 1rem;
  font-weight: 400;
  letter-spacing: 0.025rem;
}

.md3-label-small {
  font-size: 0.6875rem;
  line-height: 1rem;
  font-weight: 500;
  letter-spacing: 0.03125rem;
  text-transform: uppercase;
}

// Main Container - Dense Layout
.md3-api-usage {
  padding: 16px 0;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

// Chart Section - ApexCharts Design
.md3-chart-section {
  .md3-chart-header {
    margin-bottom: 16px;
  }

  .md3-chart-container {
    height: 120px;
    position: relative;

    .md3-chart-canvas {
      width: 100%;
      height: 100%;
    }

    .md3-chart-loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 8px;
      height: 100%;
      color: #49454f;
    }
  }
}

// Statistics Row - Horizontal Layout
.md3-stats-row {
  display: flex;
  gap: 12px;

  .md3-stat-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 12px;
    background-color: #f7f4f8;
    border-radius: 8px;
    border: 1px solid #e6e0e9;
    transition: all 0.15s cubic-bezier(0.4, 0.0, 0.2, 1);
    text-align: center;

    &:hover {
      background-color: #f3f0f4;
      border-color: #cac4d0;
      transform: translateY(-1px);
    }
  }
}

// Endpoints Section - Compact Design
.md3-endpoints-section {
  .md3-section-header {
    margin-bottom: 8px;
  }

  .md3-endpoints-compact {
    .md3-loading-compact,
    .md3-empty-compact {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 16px;
      color: #49454f;
    }

    .md3-endpoint-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 12px;
      border-radius: 6px;
      transition: background-color 0.15s cubic-bezier(0.4, 0.0, 0.2, 1);
      margin-bottom: 4px;

      &:hover {
        background-color: #f7f4f8;
      }

      .md3-endpoint-content {
        display: flex;
        align-items: center;
        gap: 8px;
        flex: 1;
        min-width: 0;

        .md3-method-badge {
          font-size: 0.625rem;
          padding: 2px 6px;
          min-height: auto;
          border-radius: 3px;
          font-weight: 600;
        }

        .md3-endpoint-path {
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
          font-size: 0.625rem;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      }

      .md3-calls-count {
        flex-shrink: 0;
        font-weight: 600;
      }
    }
  }
}

// Button Enhancement
.md3-button {
  border-radius: 16px;
  font-weight: 500;
  letter-spacing: 0.025rem;
  transition: all 0.2s cubic-bezier(0.4, 0.0, 0.2, 1);

  &:hover {
    transform: translateY(-1px);
  }
}

// Mobile Responsive - Extra Dense
@media (max-width: 768px) {
  .md3-api-usage {
    padding: 12px 0;
    gap: 16px;
  }

  .md3-chart-section {
    .md3-chart-container {
      height: 100px;
    }
  }

  .md3-stats-row {
    flex-direction: column;
    gap: 8px;

    .md3-stat-item {
      padding: 10px;
      text-align: left;
      flex-direction: row;
      justify-content: space-between;
      align-items: center;

      .md3-title-large {
        font-size: 1.125rem;
      }
    }
  }

  .md3-endpoints-section {
    .md3-endpoint-row {
      padding: 6px 8px;

      .md3-endpoint-content {
        gap: 6px;

        .md3-endpoint-path {
          font-size: 0.5rem;
        }
      }
    }
  }
}

// Tablet Adjustments
@media (min-width: 769px) and (max-width: 1024px) {
  .md3-stats-row {
    flex-wrap: wrap;

    .md3-stat-item {
      min-width: calc(50% - 6px);
    }
  }
}
</style>
