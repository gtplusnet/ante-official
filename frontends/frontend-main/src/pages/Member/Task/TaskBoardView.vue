<template>
  <div class="task-board-view">
    <!-- Refresh button with cache indicator -->
    <div class="q-mb-md row items-center justify-end">
      <q-btn
        flat
        round
        dense
        size="sm"
        :loading="isRefreshing"
        @click="refreshTasks"
        class="q-mr-sm"
      >
        <q-icon
          name="refresh"
          size="18px"
          :class="{ 'rotate-animation': isRefreshing }"
          style="color: var(--q-grey-icon)"
        />
        <q-tooltip>{{ isCached ? 'Refresh tasks (showing cached data)' : 'Refresh tasks' }}</q-tooltip>
      </q-btn>
      <div v-if="isCached && lastUpdated" class="text-caption text-grey">
        Updated {{ getRelativeTime(lastUpdated) }}
      </div>
    </div>

    <div v-if="isLoading && !isCached" class="flex flex-center" style="height: 400px">
      <q-spinner-dots color="primary" size="40px" />
    </div>

    <template v-else>
      <div class="board-container q-pa-sm">
        <div
          v-for="column in boardColumns"
          :key="column.key"
          class="board-column"
          :class="{ 'drop-active': dragOverColumn === column.key }"
          @dragover.prevent="handleDragOver(column.key)"
          @dragleave="handleDragLeave"
          @drop="handleDrop($event, column.key)"
        >
          <div class="column-header">
            <div class="column-header-top">
              <h6 class="column-title text-title-large">{{ column.title }}</h6>
              <div class="q-badge text-title-small" :class="getColumnTasks(column.key).length === 0 ? 'q-badge-zero' : ''">
                {{ getColumnTasks(column.key).length }}
              </div>
            </div>
            <div class="divider q-my-sm"></div>
            <div class="column-total text-title-medium">
              {{ getColumnTasks(column.key).length }} {{ getColumnTasks(column.key).length === 1 ? 'task' : 'tasks' }}
            </div>
          </div>

          <div class="column-content">
            <div
              v-for="task in getColumnTasks(column.key)"
              :key="task.id"
              class="task-card"
              :class="{
                'drag-source': draggedTask?.id === task.id && isDragging
              }"
              draggable="true"
              @dragstart="handleDragStart($event, task)"
              @dragend="handleDragEnd"
              @click="viewTask(task.id)"
            >
              <div class="task-card-title">{{ task.title }}</div>
              <div class="task-card-meta">
                <q-chip dense size="xs" :color="getPriorityColor(task.priority)" v-if="task.priority">
                  {{ formatPriority(task.priority) }}
                </q-chip>
                <q-chip dense size="xs" color="grey-3" text-color="grey-8" v-if="task.assignee">
                  <q-icon name="person" size="xs" class="q-mr-xs" />
                  {{ formatAssignee(task.assignee) }}
                </q-chip>
                <q-chip dense size="xs" color="grey-3" text-color="grey-8" v-if="task.dueDate">
                  <q-icon name="event" size="xs" class="q-mr-xs" />
                  {{ formatDate(task.dueDate) }}
                </q-chip>
              </div>
            </div>

            <div v-if="!getColumnTasks(column.key).length" class="empty-column">
              No tasks in this stage
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import supabaseService from '../../../services/supabase';
import { useCache } from '../../../composables/useCache';
import { taskCache, CacheTTL } from '../../../utils/cache/implementations';

// Component definition
defineOptions({
  name: 'TaskBoardView'
});

// Define props (keeping for backwards compatibility, but not using them for data fetching)
defineProps({
  tasks: {
    type: Array,
    default: () => []
  },
  filter: {
    type: String,
    default: ''
  }
});

// Setup utilities
const router = useRouter();
const $q = useQuasar();

// Board lanes - will be fetched from database
const boardLanes = ref<any[]>([]);

// Fetch board lanes from database
const fetchBoardLanes = async () => {
  try {
    const { data, error } = await supabaseService.getClient()
      .from('BoardLane')
      .select('*')
      .eq('isDefault', true)
      .order('order', { ascending: true });

    if (error) {
      console.error('Error fetching board lanes:', error);
      return;
    }

    boardLanes.value = data || [];
  } catch (err) {
    console.error('Unexpected error fetching board lanes:', err);
  }
};

// Computed property for board columns based on fetched board lanes
const boardColumns = computed(() => {
  return boardLanes.value.map(lane => ({
    id: lane.id,
    key: lane.key || `lane_${lane.id}`,
    title: lane.name,
    boardLaneId: lane.id
  }));
});

// Type for internal task display
type TaskDisplayInterface = {
  id: number;
  title: string;
  description: string;
  boardLaneId: number;
  priority: string;
  priorityLevel: number;
  assignee: string | null;
  assignedToId: string | null;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  projectName?: string | null;
  projectId?: number | null;
};

// Reactive state
const draggedTask = ref<TaskDisplayInterface | null>(null);
const dragOverColumn = ref<string | null>(null);
const isDragging = ref<boolean>(false);

// Use centralized cache for tasks with Supabase
const {
  data: cachedTaskData,
  isCached,
  isRefreshing,
  lastUpdated,
  load: loadTasks,
  refresh: refreshTasksCache
} = useCache(
  taskCache,
  async () => {
    try {
      const { data: tasks, error } = await supabaseService.getClient()
        .from('Task')
        .select(`
          *,
          assignedTo:Account!Task_assignedToId_fkey (
            id,
            firstName,
            lastName,
            username
          ),
          project:Project (
            id,
            name
          ),
          boardLane:BoardLane!Task_boardLaneId_fkey (
            id,
            name,
            key,
            order
          )
        `)
        .eq('isDeleted', false)
        .order('order', { ascending: true });

      if (error) {
        console.error('Error fetching tasks:', error);
        $q.notify({
          type: 'negative',
          message: 'Failed to load tasks',
          position: 'top',
          timeout: 3000
        });
        return { tasks: [] };
      }

      return {
        tasks: tasks || []
      };
    } catch (err) {
      console.error('Unexpected error fetching tasks:', err);
      return { tasks: [] };
    }
  },
  {
    cacheKey: () => ({ type: 'board' }),
    ttl: CacheTTL.TASK_LIST,
    invalidateEvents: ['task-created', 'task-updated', 'task-deleted']
  }
);

// Computed properties
const isLoading = computed(() => isRefreshing.value && !isCached.value);

const taskList = computed<TaskDisplayInterface[]>(() => {
  if (!cachedTaskData.value?.tasks) return [];

  return cachedTaskData.value.tasks.map((item: any) => {
    const assigneeName = item.assignedTo
      ? `${item.assignedTo.firstName || ''} ${item.assignedTo.lastName || ''}`.trim() || item.assignedTo.username
      : null;

    return {
      id: item.id,
      title: item.title || 'Untitled Task',
      description: item.description || '',
      boardLaneId: item.boardLaneId,
      priority: item.priority || 'medium',
      priorityLevel: item.priorityLevel || 2,
      assignee: assigneeName,
      assignedToId: item.assignedToId,
      dueDate: item.dueDate,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      projectName: item.project?.name,
      projectId: item.projectId
    };
  });
});

// Get tasks for a specific column
const getColumnTasks = (columnKey: string) => {
  const column = boardColumns.value.find((c: any) => c.key === columnKey);
  if (!column) return [];

  return taskList.value.filter((task: TaskDisplayInterface) => {
    return task.boardLaneId === column.boardLaneId;
  });
};

// Drag and drop handlers
const handleDragStart = (event: DragEvent, task: TaskDisplayInterface) => {
  draggedTask.value = task;
  isDragging.value = true;
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', task.id.toString());
    event.dataTransfer.dropEffect = 'move';
  }
  const target = event.target as HTMLElement;
  target.classList.add('dragging');
};

const handleDragEnd = (event: DragEvent) => {
  const target = event.target as HTMLElement;
  target.classList.remove('dragging');
  draggedTask.value = null;
  dragOverColumn.value = null;
  isDragging.value = false;
};

const handleDragOver = (columnKey: string) => {
  dragOverColumn.value = columnKey;
};

const handleDragLeave = () => {
  dragOverColumn.value = null;
};

const handleDrop = async (event: DragEvent, columnKey: string) => {
  event.preventDefault();
  dragOverColumn.value = null;

  if (!draggedTask.value) {
    isDragging.value = false;
    return;
  }

  const targetColumn = boardColumns.value.find((col: any) => col.key === columnKey);
  if (!targetColumn) {
    draggedTask.value = null;
    isDragging.value = false;
    return;
  }

  // Get the new board lane ID
  const newBoardLaneId = targetColumn.boardLaneId;

  // Don't update if already in the same lane
  if (draggedTask.value.boardLaneId === newBoardLaneId) {
    draggedTask.value = null;
    isDragging.value = false;
    return;
  }

  // Store the task data before the API call
  const taskToMove = { ...draggedTask.value };
  const originalBoardLaneId = taskToMove.boardLaneId;

  // Clear drag state immediately for smooth UX
  draggedTask.value = null;
  isDragging.value = false;

  try {
    // Optimistically update the cache data first
    if (cachedTaskData.value?.tasks) {
      const cacheIndex = cachedTaskData.value.tasks.findIndex((t: any) => t.id === taskToMove.id);
      if (cacheIndex !== -1) {
        // Update the cache
        cachedTaskData.value.tasks[cacheIndex].boardLaneId = newBoardLaneId;

        // Then update the database
        const { error } = await supabaseService.getClient()
          .from('Task')
          .update({ boardLaneId: newBoardLaneId })
          .eq('id', taskToMove.id);

        if (error) {
          // Rollback on error
          cachedTaskData.value.tasks[cacheIndex].boardLaneId = originalBoardLaneId;
          throw error;
        }
      }
    }

    // Silent success - no notification needed for smooth UX
  } catch (error) {
    console.error('Error updating task board lane:', error);

    $q.notify({
      type: 'negative',
      message: 'Failed to update task',
      position: 'top',
      timeout: 3000
    });

    // Refresh to reset state on error
    await refreshTasksCache();
  }
};

// Methods
const refreshTasks = async () => {
  await refreshTasksCache();
  $q.notify({
    type: 'positive',
    message: 'Tasks refreshed',
    position: 'top',
    timeout: 1000
  });
};

const getRelativeTime = (date: Date): string => {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  return `${Math.floor(hours / 24)} day${Math.floor(hours / 24) > 1 ? 's' : ''} ago`;
};

const getPriorityColor = (priority: string | undefined | null) => {
  if (!priority) return 'grey-5';

  switch (priority.toLowerCase()) {
    case 'urgent':
    case 'high':
    case 'critical':
      return 'red-5';
    case 'medium':
    case 'normal':
      return 'orange-5';
    case 'low':
    case 'verylow':
      return 'green-5';
    default:
      return 'grey-5';
  }
};

const formatPriority = (priority: string | null | undefined) => {
  if (!priority) return 'None';
  return priority.charAt(0).toUpperCase() + priority.slice(1);
};

const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return 'No due date';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
};

const formatAssignee = (name: string | null | undefined) => {
  if (!name || typeof name !== 'string') return 'Unassigned';
  if (name === 'current_user') return 'Me';

  // Capitalize each word in the name
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

const viewTask = (id: number): void => {
  router.push({ name: 'member_task_page', params: { id } });
};

// Lifecycle
onMounted(async () => {
  await fetchBoardLanes();
  await loadTasks();
});
</script>

<style lang="scss" scoped src="./Task.scss"></style>

<style scoped>
.task-board-view {
  width: 100%;
}

/* Board Container */
.board-container {
  margin: 0 auto;
  display: flex;
  gap: 16px;
  height: calc(100vh - 250px);
  width: 100%;
  overflow: auto;
  user-select: none;
}

/* Board Column */
.board-column {
  flex: 0 0 310px;
  background: #f6f8fb;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  will-change: transform, box-shadow;
}

.board-column.drop-active {
  background: #e8f4fd;
  box-shadow: 0 0 0 2px #1976d2;
  transform: scale(1.01);
}

/* Column Header */
.column-header {
  margin: 16px;
}

.column-header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.column-title {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: var(--q-text-dark);
}

.q-badge {
  background-color: var(--q-secondary);
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  padding: 5px 8px;
  border-radius: 4px;
  transition: background-color 0.3s ease;
}

.q-badge-zero {
  background-color: #c7cbd2;
}

.divider {
  height: 3px;
  width: 35px;
  background-color: #615ff6;
}

.column-total {
  font-size: 18px;
  font-weight: 600;
  color: #747786;
}

/* Column Content */
.column-content {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 0 16px 16px 16px;
  max-height: calc(100vh - 350px);
  transition: padding 0.3s ease;
}

/* Task Card */
.task-card {
  background: #fff;
  border-radius: 8px;
  padding: 12px;
  cursor: move;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  transform-origin: center;
  will-change: transform, opacity;
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.task-card.drag-source {
  opacity: 0.3;
  transform: scale(0.98);
  transition: all 0.2s ease;
}

.task-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.task-card.dragging {
  cursor: grabbing;
}

.task-card-title {
  font-weight: 600;
  font-size: 14px;
  color: var(--q-text-dark);
  margin-bottom: 8px;
  word-break: break-word;
}

.task-card-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

/* Empty Column */
.empty-column {
  text-align: center;
  color: #999;
  padding: 40px 20px;
  font-size: 14px;
}

/* Rotation animation for refresh icon */
@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.rotate-animation {
  animation: rotate 1s linear infinite;
}
</style>
