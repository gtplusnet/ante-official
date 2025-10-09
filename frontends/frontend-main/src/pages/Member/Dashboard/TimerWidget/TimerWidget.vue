<template>
  <div>
    <GlobalWidgetCard>
      <template #title> Time Tracker </template>

      <template #more-actions>
        <q-icon 
          name="history" 
          size="18px" 
          class="text-grey more-action-icon" 
          @click="showHistoryDialog = true"
        >
          <q-tooltip>View time history</q-tooltip>
        </q-icon>
      </template>

      <template #actions>
        <q-icon 
          name="history" 
          size="18px" 
          class="text-grey action-icon" 
          @click="showHistoryDialog = true"
        >
          <q-tooltip>View time history</q-tooltip>
        </q-icon>
      </template>

      <template #content>
        <!-- Daily Summary -->
        <div v-if="!isInitialLoading" class="daily-summary-header q-mb-sm">
          <div class="row items-center justify-between">
            <div class="col">
              <span class="text-caption text-grey">Today's Total: </span>
              <span class="text-body-medium text-weight-medium">{{ formattedDailyTotal }}</span>
            </div>
            <q-icon name="today" size="18px" color="primary" />
          </div>
        </div>

        <!-- Loading Skeleton -->
        <div v-if="isInitialLoading" class="timer-container-dense">
          <div class="row items-center">
            <div class="col-2">
              <q-skeleton type="circle" size="32px" />
            </div>
            <div class="col-10">
              <q-skeleton type="text" width="120px" />
              <q-skeleton type="text" width="80px" class="q-mt-xs" />
            </div>
          </div>
        </div>

        <!-- No Active Timer -->
        <div v-else-if="!currentTimer" class="timer-container-dense">
          <div class="row items-center justify-between">
            <div class="col-auto">
              <div class="timer-icon-wrapper">
                <q-icon name="timer_off" size="30px" />
              </div>
            </div>
            <div class="col">
              <div class="timer-info-dense q-ml-sm">
                <div class="timer-digits-dense">00:00:00</div>
                <div class="text-caption text-grey">Not tracking</div>
              </div>
            </div>
            <div class="col-auto">
              <q-btn
                unelevated
                color="positive"
                label="TIME-IN"
                icon="login"
                size="sm"
                :loading="isLoading"
                :disable="isLoading"
                @click="startTimer"
              >
                <q-tooltip>Start time tracking</q-tooltip>
              </q-btn>
            </div>
          </div>
        </div>

        <!-- Active Timer -->
        <div v-else-if="currentTimer" class="timer-container-dense">
          <div class="row items-center justify-between q-mb-sm">
            <div class="col-auto">
              <div class="timer-icon-wrapper active">
                <q-icon name="timer" size="30px" />
              </div>
            </div>
            <div class="col">
              <div class="timer-info-dense q-ml-sm">
                <div class="timer-digits-dense active">
                  {{ formattedTime }}
                  <q-spinner-dots size="12px" class="q-ml-xs" />
                </div>
                <div class="text-caption text-grey">
                  {{ currentTimer?.taskTitle || currentTimer?.task?.title || 'Manual Entry' }}
                  <span v-if="currentTimer?.task?.project"> • {{ currentTimer.task.project.name }}</span>
                </div>
              </div>
            </div>
            <div class="col-auto">
              <div class="row q-gutter-xs">
                <q-btn
                  v-if="currentTimer.taskId"
                  flat
                  dense
                  round
                  size="sm"
                  icon="info"
                  :loading="isLoadingTaskInfo"
                  :disable="isLoadingTaskInfo"
                  @click="viewCurrentTaskInfo"
                >
                  <q-tooltip>View task details</q-tooltip>
                </q-btn>
                <q-btn
                  unelevated
                  color="negative"
                  label="TIME-OUT"
                  icon="logout"
                  size="sm"
                  :loading="isLoading"
                  :disable="isLoading"
                  @click="stopTimer"
                >
                  <q-tooltip>Stop time tracking</q-tooltip>
                </q-btn>
              </div>
            </div>
          </div>

          <!-- Change/Tag Task Button (always visible) -->
          <div class="row justify-center q-mt-xs">
            <q-btn
              flat
              dense
              color="primary"
              :label="currentTimer.taskId ? 'Change Task' : 'Tag Task'"
              icon="assignment"
              size="sm"
              @click="showTaskSelectionDialog = true"
            >
              <q-tooltip>{{ currentTimer.taskId ? 'Switch to different task' : 'Tag this time with a task' }}</q-tooltip>
            </q-btn>
          </div>
        </div>
      </template>
    </GlobalWidgetCard>

    <!-- Task Selection Dialog -->
    <TaskSelectionDialog 
      v-model="showTaskSelectionDialog"
      @select="onTaskSelected"
    />

    <!-- Time History Dialog -->
    <TimeHistoryDialog 
      v-model="showHistoryDialog"
    />
    
    <!-- Task Information Dialog -->
    <TaskInformationDialog
      v-if="taskInformation"
      v-model="isTaskInformationDialogOpen"
      :taskInformation="taskInformation"
      @updateTaskList="() => {}"
    />
  </div>
</template>

<style scoped lang="scss">
// Daily summary header
.daily-summary-header {
  padding: 8px 12px;
  background: var(--md3-sys-color-surface-variant);
  border: 1px solid var(--md3-sys-color-outline-variant);
  border-radius: 8px;
}

// Dense container with minimal padding
.timer-container-dense {
  padding: 4px 4px 16px 4px;
  min-height: 60px;
  
  // Timer icon wrapper - similar to petty cash widget
  .timer-icon-wrapper {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: var(--md3-sys-color-surface-variant);
    border: 1px solid var(--md3-sys-color-outline-variant);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--md3-sys-color-on-surface-variant);
    
    &.active {
      background: var(--md3-sys-color-primary-container);
      border-color: var(--md3-sys-color-primary);
      color: var(--md3-sys-color-primary);
    }
  }
  
  // Dense timer info section
  .timer-info-dense {
    .timer-digits-dense {
      font-size: 20px;
      font-weight: 500;
      font-family: 'Roboto Mono', monospace;
      color: var(--md3-sys-color-on-surface);
      line-height: 1.2;
      
      &.active {
        color: var(--md3-sys-color-primary);
      }
    }
  }
  
  // Compact task input section
  .task-input-dense {
    padding: 0 2px;
    
    .q-input {
      font-size: 13px;
    }
    
    // Task display field when selected
    .task-display-field {
      padding: 6px 8px;
      background: var(--md3-sys-color-primary-container);
      border: 1px solid var(--md3-sys-color-primary);
      border-radius: 4px;
      display: flex;
      align-items: start;
      gap: 6px;
      font-size: var(--font-label-medium);
      color: var(--md3-sys-color-on-primary-container);
      line-height: 1.2;
      width: 240px;

      span {
        min-width: 100%;
      }
    }
  }
  
  // Responsive columns
  .col-2 {
    max-width: 50px;
    flex: 0 0 50px;
  }
  
  .col-10 {
    flex: 1;
    padding-left: 8px;
  }
}

.text-caption {
  line-height: 1.2;
  width: 240px;
  margin-top: 4px;
}

// Action icons - smaller size
.more-action-icon, .action-icon {
  cursor: pointer;
  transition: color 0.2s;
  
  &:hover {
    color: var(--md3-sys-color-primary) !important;
  }
}

// Utility classes
.ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>

<script lang="ts">
import { defineComponent, ref, computed, onMounted, onUnmounted, getCurrentInstance } from 'vue';
import GlobalWidgetCard from '../../../../components/shared/global/GlobalWidgetCard.vue';
import TaskSelectionDialog from './dialog/TaskSelectionDialog.vue';
import TimeHistoryDialog from './dialog/TimeHistoryDialog.vue';
import TaskInformationDialog from '../../../../components/dialog/TaskInformationDialog/TaskInformationDialog.vue';
import { useLocationStore } from 'src/stores/location';

interface Task {
  id: number;
  title: string;
  project?: {
    id: number;
    name: string;
  };
}

interface CurrentTimer {
  id: number;
  taskId: number | null;
  taskTitle: string | null;
  timeIn: string;
  elapsedSeconds: number;
  taskTotalSeconds?: number; // Total time for this task today
  task?: Task;
}

export default defineComponent({
  name: 'TimerWidget',
  components: {
    GlobalWidgetCard,
    TaskSelectionDialog,
    TimeHistoryDialog,
    TaskInformationDialog
  },
  setup() {
    const instance = getCurrentInstance();
    const api = instance?.proxy?.$api;
    const bus = instance?.appContext.config.globalProperties.$bus;
    const locationStore = useLocationStore();

    // State
    const isInitialLoading = ref(true);
    const isLoading = ref(false);
    const isLoadingTaskInfo = ref(false);
    const isRefreshing = ref(false);
    const currentTimer = ref<CurrentTimer | null>(null);
    const selectedTask = ref<Task | null>(null);
    const showTaskSelectionDialog = ref(false);
    const showHistoryDialog = ref(false);
    const isTaskInformationDialogOpen = ref(false);
    const taskInformation = ref<any | null>(null);
    const elapsedSeconds = ref(0);
    const dailyTotalMinutes = ref(0);
    const taskBaseSeconds = ref(0); // Base time for current task (previous sessions)
    const serverTimeIn = ref<Date | null>(null);
    let timerInterval: number | null = null;
    let visibilityListener: (() => void) | null = null;
    
    // Computed
    const formattedTime = computed(() => {
      // If task is tagged, show task total + current session
      // If no task, show current session only
      const displaySeconds = currentTimer.value?.taskId
        ? taskBaseSeconds.value + elapsedSeconds.value
        : elapsedSeconds.value;

      const hours = Math.floor(displaySeconds / 3600);
      const minutes = Math.floor((displaySeconds % 3600) / 60);
      const secs = displaySeconds % 60;

      return [hours, minutes, secs]
        .map(val => String(val).padStart(2, '0'))
        .join(':');
    });

    const formattedDailyTotal = computed(() => {
      const totalSeconds = dailyTotalMinutes.value * 60 + elapsedSeconds.value;
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);

      if (hours > 0) {
        return `${hours}h ${minutes}m`;
      }
      return `${minutes}m`;
    });
    
    // Methods
    const fetchCurrentTimer = async () => {
      // Set refresh flag if this is not the initial load
      if (!isInitialLoading.value) {
        isRefreshing.value = true;
      }

      try {
        const response = await api.get('/time-tracking/current');
        currentTimer.value = response.data;

        if (currentTimer.value) {
          // Store server time-in for accurate calculation
          serverTimeIn.value = new Date(currentTimer.value.timeIn);

          // Extract task base time (previous sessions)
          if (currentTimer.value.taskTotalSeconds !== undefined) {
            // taskTotalSeconds includes current session, so subtract it to get base
            taskBaseSeconds.value = currentTimer.value.taskTotalSeconds - currentTimer.value.elapsedSeconds;
          } else {
            taskBaseSeconds.value = 0;
          }

          // Calculate elapsed time from server timestamp
          calculateElapsedTime();
          startTimerInterval();
        } else {
          // Clear timer if no current timer
          stopTimerInterval();
          elapsedSeconds.value = 0;
          taskBaseSeconds.value = 0;
          serverTimeIn.value = null;
        }
      } catch (error) {
        console.error('Failed to fetch current timer:', error);
      } finally {
        isInitialLoading.value = false;
        isRefreshing.value = false;
      }
    };

    const fetchDailySummary = async () => {
      try {
        const response = await api.get('/time-tracking/daily-summary');
        dailyTotalMinutes.value = response.data?.totalMinutes || 0;
      } catch (error) {
        console.error('Failed to fetch daily summary:', error);
      }
    };

    const calculateElapsedTime = () => {
      if (!serverTimeIn.value) return;
      const now = new Date();
      const elapsed = Math.floor((now.getTime() - serverTimeIn.value.getTime()) / 1000);
      elapsedSeconds.value = Math.max(0, elapsed);
    };
    
    const startTimer = async () => {
      // If already running, show warning
      if (currentTimer.value) {
        instance?.proxy?.$q.dialog({
          title: 'Timer Already Running',
          message: `Timer is currently running for "${currentTimer.value.taskTitle}". Please stop the current timer first.`,
          ok: {
            label: 'OK',
            flat: true
          }
        });
        return;
      }

      await performStartTimer();
    };
    
    const performStartTimer = async () => {
      // Show loading immediately for instant feedback
      isLoading.value = true;

      // Get location from store (instant - no waiting!)
      const location = locationStore.currentLocation;

      try {
        // Start timer without task (manual time-in)
        const response = await api.post('/time-tracking/start', {
          // taskId is optional now - omit it for manual time-in
          timeInLatitude: location?.latitude || 0,
          timeInLongitude: location?.longitude || 0,
          timeInLocation: location?.location || null,
          timeInGeolocationEnabled: location?.geolocationEnabled || false,
        });

        // Stop existing timer interval if running
        stopTimerInterval();

        currentTimer.value = {
          id: response.data.id,
          taskId: response.data.taskId,
          taskTitle: response.data.taskTitle,
          timeIn: response.data.timeIn,
          elapsedSeconds: 0,
          task: response.data.task
        };

        // Store server time-in for accurate calculation
        serverTimeIn.value = new Date(response.data.timeIn);
        elapsedSeconds.value = 0;
        startTimerInterval();

        // Clear selection
        selectedTask.value = null;

        // Show success message with location if captured
        let message = 'Timer started';
        if (location?.geolocationEnabled && location?.location) {
          message += ` at ${location.location}`;
        }

        instance?.proxy?.$q.notify({
          type: 'positive',
          message
        });

        // Emit events and refresh daily summary
        if (bus) {
          bus.emit('timer-started');
        }
        fetchDailySummary();
      } catch (error: any) {
        instance?.proxy?.$q.notify({
          type: 'negative',
          message: error.response?.data?.message || 'Failed to start timer'
        });
      } finally {
        isLoading.value = false;
      }
    };
    
    const stopTimer = async () => {
      if (!currentTimer.value) return;

      // Show loading immediately for instant feedback
      isLoading.value = true;

      // Get location from store (instant - no waiting!)
      const location = locationStore.currentLocation;

      try {
        await api.post('/time-tracking/stop', {
          timeOutLatitude: location?.latitude || 0,
          timeOutLongitude: location?.longitude || 0,
          timeOutLocation: location?.location || null,
          timeOutGeolocationEnabled: location?.geolocationEnabled || false,
        });

        stopTimerInterval();
        currentTimer.value = null;
        elapsedSeconds.value = 0;
        serverTimeIn.value = null;

        // Show success message with location if captured
        let message = 'Timer stopped successfully';
        if (location?.geolocationEnabled && location?.location) {
          message += ` at ${location.location}`;
        }

        instance?.proxy?.$q.notify({
          type: 'positive',
          message
        });

        // Refresh daily summary after stopping
        fetchDailySummary();
      } catch (error: any) {
        instance?.proxy?.$q.notify({
          type: 'negative',
          message: error.response?.data?.message || 'Failed to stop timer'
        });
      } finally {
        isLoading.value = false;
      }
    };
    
    const startTimerInterval = () => {
      if (timerInterval) return;

      // Use timestamp-based calculation instead of incrementing
      // This prevents desync when tab is inactive
      timerInterval = window.setInterval(() => {
        calculateElapsedTime();
      }, 1000);
    };
    
    const stopTimerInterval = () => {
      if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
      }
    };
    
    const onTaskSelected = async (task: Task) => {
      selectedTask.value = task;
      showTaskSelectionDialog.value = false;

      // If timer is running, switch to the selected task (stops current, starts new)
      if (currentTimer.value) {
        isLoading.value = true;
        try {
          // Backend stops current timer and creates new timer for the new task
          const response = await api.post('/time-tracking/tag', {
            taskId: task.id
          });

          // Reset timer state for NEW timer (starts from 0)
          serverTimeIn.value = new Date(response.data.timeIn);
          elapsedSeconds.value = 0;

          // Fetch task summary to get total time for this task TODAY (previous sessions)
          const taskSummaryResponse = await api.get(`/time-tracking/task-summary/${task.id}`);
          const taskSummary = taskSummaryResponse.data;

          // Set base seconds from previous sessions (excludes current session which is 0)
          taskBaseSeconds.value = taskSummary.totalSeconds;

          // Update current timer with NEW timer info
          currentTimer.value = {
            id: response.data.id, // NEW timer ID
            taskId: response.data.taskId,
            taskTitle: response.data.taskTitle,
            timeIn: response.data.timeIn, // NEW timeIn
            elapsedSeconds: 0,
            taskTotalSeconds: taskSummary.totalSeconds,
            task: response.data.task
          };

          // Restart timer interval with new timestamp
          stopTimerInterval();
          startTimerInterval();

          instance?.proxy?.$q.notify({
            type: 'positive',
            message: `Switched to task: ${task.title}`
          });

          // Clear selection
          selectedTask.value = null;

          // Emit events and refresh daily summary
          if (bus) {
            bus.emit('timer-tagged');
            bus.emit('reloadTaskList');
          }
          fetchDailySummary(); // Refresh since previous task was stopped
        } catch (error: any) {
          instance?.proxy?.$q.notify({
            type: 'negative',
            message: error.response?.data?.message || 'Failed to switch task'
          });
        } finally {
          isLoading.value = false;
        }
      }
    };
    
    const clearTaskSelection = () => {
      selectedTask.value = null;
    };
    
    const viewTaskInfo = async () => {
      if (!selectedTask.value) return;
      
      isLoadingTaskInfo.value = true;
      try {
        // Fetch full task details
        const response = await api.get(`/task?id=${selectedTask.value.id}`);
        taskInformation.value = response.data;
        isTaskInformationDialogOpen.value = true;
      } catch (error: any) {
        instance?.proxy?.$q.notify({
          type: 'negative',
          message: 'Failed to load task information'
        });
      } finally {
        isLoadingTaskInfo.value = false;
      }
    };
    
    const viewCurrentTaskInfo = async () => {
      if (!currentTimer.value?.taskId) return;
      
      isLoadingTaskInfo.value = true;
      try {
        // Fetch full task details for the current timer's task
        const response = await api.get(`/task?id=${currentTimer.value.taskId}`);
        taskInformation.value = response.data;
        isTaskInformationDialogOpen.value = true;
      } catch (error: any) {
        instance?.proxy?.$q.notify({
          type: 'negative',
          message: 'Failed to load task information'
        });
      } finally {
        isLoadingTaskInfo.value = false;
      }
    };
    
    // Lifecycle
    onMounted(() => {
      fetchCurrentTimer();
      fetchDailySummary();

      // Add Page Visibility API listener to recalculate when tab becomes visible
      visibilityListener = () => {
        if (!document.hidden && currentTimer.value) {
          // Recalculate elapsed time when page becomes visible
          calculateElapsedTime();
        }
      };
      document.addEventListener('visibilitychange', visibilityListener);

      // Listen for timer events from other components
      if (bus) {
        bus.on('timer-switched', fetchCurrentTimer);
        bus.on('timer-started', fetchCurrentTimer);
        bus.on('timer-stopped', fetchCurrentTimer);
        bus.on('timer-tagged', fetchCurrentTimer);
      }
    });

    onUnmounted(() => {
      stopTimerInterval();

      // Remove Page Visibility API listener
      if (visibilityListener) {
        document.removeEventListener('visibilitychange', visibilityListener);
      }

      // Clean up event listeners
      if (bus) {
        bus.off('timer-switched', fetchCurrentTimer);
        bus.off('timer-started', fetchCurrentTimer);
        bus.off('timer-stopped', fetchCurrentTimer);
        bus.off('timer-tagged', fetchCurrentTimer);
      }
    });
    
    return {
      isInitialLoading,
      isLoading,
      isLoadingTaskInfo,
      isRefreshing,
      currentTimer,
      selectedTask,
      showTaskSelectionDialog,
      showHistoryDialog,
      isTaskInformationDialogOpen,
      taskInformation,
      formattedTime,
      formattedDailyTotal,
      elapsedSeconds,
      startTimer,
      stopTimer,
      onTaskSelected,
      clearTaskSelection,
      viewTaskInfo,
      viewCurrentTaskInfo
    };
  }
});
</script>