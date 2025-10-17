<template>
  <div class="goal-progress-chart">
    <div v-if="!hasData" class="no-data-message">
      <q-icon name="o_show_chart" size="40px" color="grey-4" />
      <div class="text-caption text-grey-6 q-mt-xs">No progress data yet</div>
      <div class="text-caption text-grey-5">
        {{ getNoDataMessage() }}
      </div>
    </div>
    <div v-else class="chart-container">
      <Line 
        :key="chartKey" 
        :data="chartData" 
        :options="chartOptions" 
      />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, PropType, onMounted, onUnmounted, ref, nextTick, watch } from 'vue';
import { Line } from 'vue-chartjs';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js';
import { useGoalStore, type GoalData } from 'src/stores/goal';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default defineComponent({
  name: 'GoalProgressChart',
  components: {
    Line
  },
  props: {
    goal: {
      type: Object as PropType<GoalData>,
      required: true
    }
  },
  setup(props) {
    const goalStore = useGoalStore();

    // Helper to normalize dates to midnight in local timezone
    const normalizeDate = (dateStr: string): Date => {
      const date = new Date(dateStr);
      date.setHours(0, 0, 0, 0);
      return date;
    };

    // Helper to format date for display
    const formatDateLabel = (date: Date): string => {
      return `${date.getMonth() + 1}/${date.getDate()}`;
    };

    // Helper to get date string key (YYYY-MM-DD in local timezone)
    const getDateKey = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    // Progress data from API
    const progressData = ref<any>(null);
    const loadingProgress = ref(false);

    // Load progress data from API
    const loadProgressData = async () => {
      if (!props.goal.id) return;
      
      try {
        loadingProgress.value = true;
        const data = await goalStore.fetchGoalProgress(props.goal.id);
        progressData.value = data;
      } catch (error) {
        console.error('Failed to load goal progress:', error);
        progressData.value = null;
      } finally {
        loadingProgress.value = false;
      }
    };

    // Check if we have data to display
    const hasData = computed(() => {
      return !!progressData.value && progressData.value.totalTasks > 0;
    });

    // Check if goal has a deadline
    const hasDeadline = computed(() => {
      return !!props.goal.deadline;
    });

    // Create a unique key for the chart to force re-rendering
    const chartKey = computed(() => {
      return `chart-${props.goal.id}-${props.goal.updatedAt?.raw || props.goal.createdAt?.raw}`;
    });

    // Chart lifecycle management
    const chartInstance = ref<any>(null);

    onMounted(() => {
      // Load progress data on mount
      loadProgressData();
    });

    onUnmounted(() => {
      // Clean up chart instance if it exists
      if (chartInstance.value) {
        chartInstance.value.destroy();
        chartInstance.value = null;
      }
    });

    // Watch for goal changes and reload progress data
    watch(
      () => props.goal.id,
      () => {
        loadProgressData();
      }
    );

    // Calculate ideal and actual progress data using API data
    const chartData = computed(() => {
      if (!hasData.value || !progressData.value) {
        return {
          labels: [],
          datasets: []
        };
      }

      const data = progressData.value;
      const createdAt = normalizeDate(data.createdAt);
      const deadline = data.deadline ? normalizeDate(data.deadline) : null;
      const totalTasks = data.totalTasks;

      if (totalTasks === 0) {
        return {
          labels: [],
          datasets: []
        };
      }

      // Determine date range
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const endDate = deadline || today;

      // Calculate timeline
      const daysDiff = Math.ceil((endDate.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));

      // Prevent division by zero for same-day goals
      const tasksPerDay = daysDiff > 0 ? totalTasks / daysDiff : totalTasks;

      // Build completion map from API data (using accurate completedAt)
      const completedTasksByDate = new Map<string, number>();
      data.progressData.forEach((item: any) => {
        completedTasksByDate.set(item.date, item.cumulativeCompleted);
      });

      // Generate chart data with proper logic
      const dates: string[] = [];
      const idealProgress: number[] = [];
      const actualProgress: number[] = [];

      const iterDate = new Date(createdAt);

      // First point: start with all tasks remaining
      dates.push(formatDateLabel(iterDate));
      idealProgress.push(totalTasks);
      actualProgress.push(totalTasks);

      // Generate daily data points
      for (let i = 1; i <= daysDiff; i++) {
        iterDate.setDate(iterDate.getDate() + 1);
        const dateKey = getDateKey(iterDate);
        
        dates.push(formatDateLabel(iterDate));
        
        // Ideal: linear burndown (only if has deadline)
        if (hasDeadline.value) {
          const idealRemaining = Math.max(0, totalTasks - (tasksPerDay * i));
          idealProgress.push(Math.round(idealRemaining));
        } else {
          idealProgress.push(totalTasks); // Flat line if no deadline
        }
        
        // Actual: use cumulative completion from API
        if (iterDate <= today) {
          // Get cumulative completed up to this date
          let cumulativeCompleted = 0;
          for (const [date, cumulative] of completedTasksByDate.entries()) {
            if (date <= dateKey) {
              cumulativeCompleted = Math.max(cumulativeCompleted, cumulative);
            }
          }
          const actualRemaining = Math.max(0, totalTasks - cumulativeCompleted);
          actualProgress.push(actualRemaining);
        } else {
          // Future dates: use last known value (don't project)
          actualProgress.push(actualProgress[actualProgress.length - 1]);
        }
      }

      // Determine schedule status
      const todayIndex = Math.min(
        dates.length - 1,
        Math.ceil((today.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24))
      );

      const currentActual = actualProgress[todayIndex];
      const currentIdeal = hasDeadline.value ? idealProgress[todayIndex] : totalTasks;
      const cumulativeCompleted = data.completedTasks;

      // Status: ahead (green), on-track (blue), behind (orange), completed (green)
      const isCompleted = cumulativeCompleted >= totalTasks;
      const tolerance = Math.max(1, totalTasks * 0.1); // 10% tolerance, min 1 task

      let actualColor = '#1976d2'; // Blue (on track)
      if (isCompleted) {
        actualColor = '#4caf50'; // Green (completed)
      } else if (hasDeadline.value) {
        const isAhead = currentActual < currentIdeal - tolerance;
        const isBehind = currentActual > currentIdeal + tolerance;
        
        if (isAhead) actualColor = '#4caf50'; // Green (ahead)
        else if (isBehind) actualColor = '#ff9800'; // Orange (behind)
      }

      return {
        labels: dates,
        datasets: [
          {
            label: 'Ideal Progress',
            data: idealProgress,
            borderColor: '#9e9e9e',
            backgroundColor: 'transparent',
            borderDash: [5, 5],
            borderWidth: 2,
            pointRadius: 0,
            tension: 0
          },
          {
            label: 'Actual Progress',
            data: actualProgress,
            borderColor: actualColor,
            backgroundColor: 'transparent',
            borderWidth: 3,
            pointRadius: 4,
            pointHoverRadius: 6,
            tension: 0
          }
        ]
      };
    });

    const chartOptions = computed<ChartOptions<'line'>>(() => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'bottom',
          labels: {
            boxWidth: 20,
            padding: 10,
            font: {
              size: 11
            }
          }
        },
        title: {
          display: true,
          text: hasDeadline.value 
            ? 'Burndown Chart (Remaining Tasks)' 
            : 'Completion Progress (Remaining Tasks)',
          font: {
            size: 14,
            weight: 'bold'
          },
          padding: {
            top: 0,
            bottom: 10
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = context.dataset.label || '';
              const value = context.parsed.y;
              const totalTasks = progressData.value?.totalTasks || 0;
              const completedTasks = totalTasks - value;
              const percentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
              
              if (label === 'Actual Progress') {
                return `${label}: ${value} remaining (${completedTasks}/${totalTasks} completed, ${percentage}%)`;
              }
              return `${label}: ${value} tasks remaining`;
            }
          }
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Date',
            font: {
              size: 11
            }
          },
          ticks: {
            font: {
              size: 10
            },
            maxRotation: 45,
            minRotation: 45
          }
        },
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Tasks Remaining',
            font: {
              size: 11
            }
          },
          ticks: {
            font: {
              size: 10
            },
            stepSize: 1
          }
        }
      }
    }));

    // Get appropriate no-data message based on goal state
    const getNoDataMessage = () => {
      if (loadingProgress.value) {
        return 'Loading progress data...';
      }
      if (!progressData.value) {
        return 'Unable to load progress data';
      }
      if (progressData.value.totalTasks === 0) {
        return 'Link tasks to this goal to see progress';
      }
      return 'Complete tasks to see progress';
    };

    return {
      hasData,
      hasDeadline,
      chartKey,
      chartInstance,
      chartData,
      chartOptions,
      getNoDataMessage,
      loadingProgress
    };
  }
});
</script>

<style lang="scss" scoped>
.goal-progress-chart {
  width: 100%;
  height: 100%;
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;

  .no-data-message {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 20px;
  }

  .chart-container {
    width: 100%;
    height: 100%;
    min-height: 200px;
    position: relative;
    
    // Ensure chart has proper dimensions
    canvas {
      max-width: 100% !important;
      max-height: 100% !important;
    }
  }
}
</style>
