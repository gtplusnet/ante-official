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
          <div class="row items-center">
            <div class="col-2">
              <div class="timer-icon-wrapper">
                <q-icon name="timer_off" size="30px" />
              </div>
            </div>
            <div class="col-10">
              <div class="timer-info-dense">
                <div class="timer-digits-dense">00:00:00</div>
                <div class="text-caption text-grey">No active timer</div>
              </div>
            </div>
          </div>
          
          <!-- Task Selection/Input -->
          <div class="task-input-dense q-mt-sm">
            <!-- If task selected, show it -->
            <div v-if="selectedTask" class="selected-task-display">
              <div class="row items-center">
                <div class="col">
                  <div class="task-display-field">
                    <q-icon name="assignment_turned_in" size="14px" color="primary" />
                    <span>{{ selectedTask.title }}</span>
                  </div>
                </div>
                <div class="col-auto">
                  <q-btn
                    flat
                    dense
                    round
                    size="sm"
                    icon="info"
                    :loading="isLoadingTaskInfo"
                    :disable="isLoadingTaskInfo"
                    @click="viewTaskInfo"
                  >
                    <q-tooltip>View task details</q-tooltip>
                  </q-btn>
                </div>
                <div class="col-auto">
                  <q-btn
                    flat
                    dense
                    round
                    size="sm"
                    icon="close"
                    @click="clearTaskSelection"
                  >
                    <q-tooltip>Clear selection</q-tooltip>
                  </q-btn>
                </div>
                <div class="col-auto">
                  <q-btn
                    flat
                    dense
                    color="primary"
                    icon="play_arrow"
                    :loading="isLoading"
                    :disable="isLoading"
                    @click="startTimer"
                  />
                </div>
              </div>
            </div>
            
            <!-- If no task selected, show input -->
            <div v-else>
              <div class="row q-col-gutter-xs items-center">
                <div class="col">
                  <q-input
                    v-model="newTaskTitle"
                    dense
                    outlined
                    placeholder="What are you working on?"
                    hide-bottom-space
                    @keyup.enter="startTimer"
                  >
                    <template v-slot:append>
                      <q-icon 
                        name="assignment" 
                        size="16px"
                        class="cursor-pointer" 
                        @click="showTaskSelectionDialog = true"
                      >
                        <q-tooltip>Select existing task</q-tooltip>
                      </q-icon>
                    </template>
                  </q-input>
                </div>
                <div class="col-auto">
                  <q-btn
                    flat
                    dense
                    color="primary"
                    icon="play_arrow"
                    :disable="!newTaskTitle || isLoading"
                    :loading="isLoading"
                    @click="startTimer"
                  >
                    <q-tooltip>Create task & start timer</q-tooltip>
                  </q-btn>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Active Timer -->
        <div v-else-if="currentTimer" class="timer-container-dense">
          <div class="row items-center">
            <div class="col-2">
              <div class="timer-icon-wrapper active">
                <q-icon name="timer" size="30px" />
              </div>
            </div>
            <div class="col-10">
              <div class="row items-center justify-between">
                <div class="timer-info-dense">
                  <div class="timer-digits-dense active">
                    {{ formattedTime }}
                    <q-spinner-dots size="12px" class="q-ml-xs" />
                  </div>
                  <div class="text-caption text-grey">
                    {{ currentTimer?.taskTitle || currentTimer?.task?.title || 'Working...' }}
                    <span v-if="currentTimer?.task?.project"> • {{ currentTimer.task.project.name }}</span>
                  </div>
                </div>
                <div class="row q-gutter-xs">
                  <q-btn
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
                    flat
                    dense
                    round
                    color="negative"
                    icon="stop"
                    size="sm"
                    :loading="isLoading"
                    :disable="isLoading"
                    @click="stopTimer"
                  >
                    <q-tooltip>Stop timer</q-tooltip>
                  </q-btn>
                </div>
              </div>
            </div>
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
    
    // State
    const isInitialLoading = ref(true);
    const isLoading = ref(false);
    const isLoadingTaskInfo = ref(false);
    const isRefreshing = ref(false);
    const currentTimer = ref<CurrentTimer | null>(null);
    const newTaskTitle = ref('');
    const selectedTask = ref<Task | null>(null);
    const showTaskSelectionDialog = ref(false);
    const showHistoryDialog = ref(false);
    const isTaskInformationDialogOpen = ref(false);
    const taskInformation = ref<any | null>(null);
    const elapsedSeconds = ref(0);
    let timerInterval: number | null = null;
    
    // Computed
    const formattedTime = computed(() => {
      const seconds = elapsedSeconds.value;
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const secs = seconds % 60;
      
      return [hours, minutes, secs]
        .map(val => String(val).padStart(2, '0'))
        .join(':');
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
          elapsedSeconds.value = currentTimer.value.elapsedSeconds;
          startTimerInterval();
        } else {
          // Clear timer if no current timer
          stopTimerInterval();
          elapsedSeconds.value = 0;
        }
      } catch (error) {
        console.error('Failed to fetch current timer:', error);
      } finally {
        isInitialLoading.value = false;
        isRefreshing.value = false;
      }
    };
    
    const startTimer = async () => {
      if (!newTaskTitle.value && !selectedTask.value) return;
      
      // Check if there's a timer running for a different task
      const taskIdToStart = selectedTask.value?.id;
      const isNewTask = !selectedTask.value;
      
      if (currentTimer.value && taskIdToStart && currentTimer.value.taskId !== taskIdToStart) {
        // Show confirmation dialog for switching timers
        instance?.proxy?.$q.dialog({
          title: 'Switch Timer',
          message: `Timer is currently running for "${currentTimer.value.taskTitle}". Switch to "${selectedTask.value?.title}"?`,
          cancel: true,
          persistent: true,
          ok: {
            label: 'Switch Timer',
            color: 'primary',
            flat: false
          },
          cancel: {
            label: 'Cancel',
            flat: true
          }
        }).onOk(async () => {
          await performStartTimer(isNewTask, true);
        });
      } else if (currentTimer.value && isNewTask) {
        // Show confirmation dialog for creating new task and switching
        instance?.proxy?.$q.dialog({
          title: 'Switch Timer',
          message: `Timer is currently running for "${currentTimer.value.taskTitle}". Create new task and switch timer?`,
          cancel: true,
          persistent: true,
          ok: {
            label: 'Create & Switch',
            color: 'primary',
            flat: false
          },
          cancel: {
            label: 'Cancel',
            flat: true
          }
        }).onOk(async () => {
          await performStartTimer(isNewTask, true);
        });
      } else {
        await performStartTimer(isNewTask, false);
      }
    };
    
    const performStartTimer = async (isNewTask: boolean, isSwitching: boolean = false) => {
      isLoading.value = true;
      try {
        let response: any;
        
        if (selectedTask.value) {
          // Use existing task
          response = await api.post('/time-tracking/start', { 
            taskId: selectedTask.value.id 
          });
        } else {
          // Create new task and start timer
          response = await api.post('/time-tracking/create-and-start', { 
            title: newTaskTitle.value,
            description: ''
          });
          // Response includes both task and timer
          response.data = response.data.timer;
        }
        
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
        
        elapsedSeconds.value = 0;
        startTimerInterval();
        
        // Clear inputs
        newTaskTitle.value = '';
        selectedTask.value = null;
        
        let message = '';
        if (isSwitching) {
          message = isNewTask ? 'Task created and timer switched' : 'Timer switched successfully';
        } else {
          message = isNewTask ? 'Task created and timer started' : 'Timer started';
        }
        
        instance?.proxy?.$q.notify({
          type: 'positive',
          message
        });
        
        // Emit events
        if (bus) {
          if (isNewTask) {
            bus.emit('task-created');
          }
          if (isSwitching) {
            bus.emit('timer-switched');  // Specific event for timer switching
          }
          bus.emit('timer-started');
          bus.emit('reloadTaskList');
        }
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
      
      isLoading.value = true;
      try {
        await api.post('/time-tracking/stop', {});
        
        stopTimerInterval();
        currentTimer.value = null;
        elapsedSeconds.value = 0;
        
        instance?.proxy?.$q.notify({
          type: 'positive',
          message: 'Timer stopped successfully'
        });
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
      
      timerInterval = window.setInterval(() => {
        elapsedSeconds.value++;
      }, 1000);
    };
    
    const stopTimerInterval = () => {
      if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
      }
    };
    
    const onTaskSelected = (task: Task) => {
      selectedTask.value = task;
      newTaskTitle.value = '';
      showTaskSelectionDialog.value = false;
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
      
      // Listen for timer events from other components
      if (bus) {
        bus.on('timer-switched', fetchCurrentTimer);
        bus.on('timer-started', fetchCurrentTimer);
        bus.on('timer-stopped', fetchCurrentTimer);
      }
    });
    
    onUnmounted(() => {
      stopTimerInterval();
      
      // Clean up event listeners
      if (bus) {
        bus.off('timer-switched', fetchCurrentTimer);
        bus.off('timer-started', fetchCurrentTimer);
        bus.off('timer-stopped', fetchCurrentTimer);
      }
    });
    
    return {
      isInitialLoading,
      isLoading,
      isLoadingTaskInfo,
      isRefreshing,
      currentTimer,
      newTaskTitle,
      selectedTask,
      showTaskSelectionDialog,
      showHistoryDialog,
      isTaskInformationDialogOpen,
      taskInformation,
      formattedTime,
      elapsedSeconds,
      startTimer,
      stopTimer,
      performStartTimer,
      onTaskSelected,
      clearTaskSelection,
      viewTaskInfo,
      viewCurrentTaskInfo
    };
  }
});
</script>