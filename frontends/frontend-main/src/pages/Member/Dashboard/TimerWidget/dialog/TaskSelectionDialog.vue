<template>
  <q-dialog
    v-model="dialogModel"
    persistent
    transition-show="scale"
    transition-hide="scale"
  >
    <q-card class="md3-dialog-dense" style="width: 600px; max-width: 90vw;">
      <q-card-section class="md3-dialog-header">
        <div class="text-h6">Select Task</div>
        <q-space />
        <q-btn 
          icon="close" 
          flat 
          round 
          dense 
          @click="dialogModel = false" 
        />
      </q-card-section>

      <q-card-section class="md3-dialog-content q-pt-none">
        <!-- Search Bar -->
        <q-input
          v-model="searchQuery"
          dense
          outlined
          placeholder="Search tasks..."
          class="q-mb-md"
        >
          <template v-slot:append>
            <q-icon name="search" />
          </template>
        </q-input>

        <!-- Loading State -->
        <div v-if="isLoading" class="q-pa-md text-center">
          <q-spinner-dots size="40px" />
          <div class="q-mt-sm text-grey">Loading tasks...</div>
        </div>

        <!-- No Tasks -->
        <div v-else-if="filteredTasks.length === 0" class="q-pa-md text-center text-grey">
          <q-icon name="assignment" size="48px" class="q-mb-sm" />
          <div>No tasks available</div>
        </div>

        <!-- Task List -->
        <q-list v-else separator class="task-list">
          <q-item
            v-for="task in filteredTasks"
            :key="task.id"
            clickable
            v-ripple
            @click="selectTask(task)"
            class="task-item"
          >
            <q-item-section avatar>
              <q-icon 
                :name="getTaskIcon(task.boardLane?.key)" 
                :color="getTaskColor(task.boardLane?.key)"
              />
            </q-item-section>

            <q-item-section>
              <q-item-label class="text-body-medium">
                {{ task.title }}
              </q-item-label>
              <q-item-label caption>
                <span v-if="task.project">{{ task.project.name }}</span>
                <span v-if="task.project && task.boardLane"> • </span>
                <span v-if="task.boardLane">{{ task.boardLane.name }}</span>
              </q-item-label>
            </q-item-section>

            <q-item-section side>
              <div class="column items-end q-gutter-xs">
                <!-- Time badge (if any time spent) -->
                <q-badge
                  v-if="task.timeSpentSeconds && task.timeSpentSeconds > 0"
                  color="primary"
                  :label="formatTimeSpent(task.timeSpentSeconds)"
                >
                  <q-tooltip>Total time spent</q-tooltip>
                </q-badge>

                <!-- Priority badge -->
                <q-badge
                  v-if="task.priorityLevel"
                  :color="getPriorityColor(task.priorityLevel)"
                  :label="getPriorityLabel(task.priorityLevel)"
                />
              </div>
            </q-item-section>
          </q-item>
        </q-list>
      </q-card-section>

      <q-card-actions align="right" class="q-px-md q-pb-md">
        <q-btn 
          flat 
          label="Cancel" 
          @click="dialogModel = false" 
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<style scoped lang="scss">
.md3-dialog-dense {
  .md3-dialog-header {
    display: flex;
    align-items: center;
    padding: 16px 24px;
    border-bottom: 1px solid var(--md3-sys-color-outline-variant);
  }
  
  .md3-dialog-content {
    padding: 16px 24px;
    max-height: 60vh;
    overflow-y: auto;
  }
  
  .task-list {
    max-height: 400px;
    overflow-y: auto;
  }
  
  .task-item {
    border: 1px solid var(--md3-sys-color-outline-variant);
    margin-bottom: 8px;
    border-radius: 8px;
    
    &:hover {
      background: var(--md3-sys-color-surface-variant);
    }
  }
}
</style>

<script lang="ts">
import { defineComponent, ref, computed, getCurrentInstance, watch } from 'vue';

interface Task {
  id: number;
  title: string;
  priorityLevel: number;
  timeSpentMinutes?: number;
  timeSpentSeconds?: number;
  project?: {
    id: number;
    name: string;
  };
  boardLane?: {
    id: number;
    name: string;
    key: string;
  };
}

export default defineComponent({
  name: 'TaskSelectionDialog',
  props: {
    modelValue: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update:modelValue', 'select'],
  setup(props, { emit }) {
    const instance = getCurrentInstance();
    const api = instance?.proxy?.$api;
    
    // State
    const isLoading = ref(false);
    const tasks = ref<Task[]>([]);
    const searchQuery = ref('');
    
    // Computed
    const dialogModel = computed({
      get: () => props.modelValue,
      set: (val) => emit('update:modelValue', val)
    });
    
    const filteredTasks = computed(() => {
      if (!searchQuery.value) return tasks.value;
      
      const query = searchQuery.value.toLowerCase();
      return tasks.value.filter(task => 
        task.title.toLowerCase().includes(query) ||
        task.project?.name.toLowerCase().includes(query) ||
        task.boardLane?.name.toLowerCase().includes(query)
      );
    });
    
    // Methods
    const fetchTasks = async () => {
      isLoading.value = true;
      try {
        const response = await api.get('/time-tracking/timer-tasks');
        tasks.value = response.data || [];
      } catch (error) {
        console.error('Failed to fetch tasks:', error);
        tasks.value = [];
      } finally {
        isLoading.value = false;
      }
    };
    
    const selectTask = (task: Task) => {
      emit('select', task);
      dialogModel.value = false;
    };
    
    const getTaskIcon = (laneKey?: string) => {
      const icons: Record<string, string> = {
        'BACKLOG': 'inventory_2',
        'TO_DO': 'checklist',
        'IN_PROGRESS': 'pending',
        'DONE': 'check_circle',
        'CANCELLED': 'cancel'
      };
      return icons[laneKey || ''] || 'assignment';
    };
    
    const getTaskColor = (laneKey?: string) => {
      const colors: Record<string, string> = {
        'BACKLOG': 'grey',
        'TO_DO': 'blue',
        'IN_PROGRESS': 'orange',
        'DONE': 'green',
        'CANCELLED': 'red'
      };
      return colors[laneKey || ''] || 'grey';
    };
    
    const getPriorityColor = (level: number) => {
      if (level >= 4) return 'red';
      if (level >= 3) return 'orange';
      if (level >= 2) return 'yellow';
      return 'grey';
    };
    
    const getPriorityLabel = (level: number) => {
      if (level >= 4) return 'Critical';
      if (level >= 3) return 'High';
      if (level >= 2) return 'Medium';
      return 'Low';
    };

    const formatTimeSpent = (seconds: number) => {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);

      if (hours > 0) {
        return `${hours}h ${minutes}m`;
      }
      return `${minutes}m`;
    };

    // Watch for dialog open
    watch(() => props.modelValue, (newVal) => {
      if (newVal) {
        fetchTasks();
        searchQuery.value = '';
      }
    });
    
    return {
      dialogModel,
      isLoading,
      tasks,
      searchQuery,
      filteredTasks,
      selectTask,
      getTaskIcon,
      getTaskColor,
      getPriorityColor,
      getPriorityLabel,
      formatTimeSpent
    };
  }
});
</script>