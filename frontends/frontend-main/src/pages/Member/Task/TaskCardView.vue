<template>
  <div class="task-card-view">
    <div
      v-for="task in filteredTasks"
      :key="task.id"
      class="task-card"
      @click="selectTask(task)"
      :class="{ 'completed-card': task.status === 'done' }"
    >
      <div class="card-header">
        <div
          class="task-checkbox"
          :class="{ checked: task.status === 'done' }"
          @click.stop="toggleTaskStatus(task)"
        ></div>
        <div class="card-title">{{ task.title }}</div>
        <q-btn
          flat
          round
          dense
          size="sm"
          icon="more_horiz"
          class="card-menu"
          @click.stop="openTaskMenu(task)"
        >
          <q-menu anchor="bottom right" self="top right" auto-close>
            <q-list dense>
              <q-item clickable v-close-popup @click.stop="editTask(task)">
                <q-item-section>Edit</q-item-section>
              </q-item>
              <q-item clickable v-close-popup @click.stop="viewTask(task)">
                <q-item-section>View Details</q-item-section>
              </q-item>
              <q-item v-if="filter === 'deleted'" clickable v-close-popup @click.stop="restoreTask(task)">
                <q-item-section>Restore</q-item-section>
              </q-item>
              <q-item v-if="filter !== 'deleted'" clickable v-close-popup @click.stop="deleteTask(task)">
                <q-item-section>Delete</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
      </div>

      <div class="card-body">
        <p class="task-description">{{ task.description }}</p>

        <div v-if="task.tags?.length" class="task-tags">
          <span v-for="tag in task.tags" :key="tag" class="task-tag">
            {{ tag }}
          </span>
        </div>

        <div class="card-meta">
          <div class="meta-row">
            <div class="meta-item" v-if="task.priority">
              <q-icon name="flag" size="16px" :color="getPriorityIconColor(task.priority)" />
              <span class="meta-label">{{ task.priority }}</span>
            </div>
            <div class="meta-item" v-if="task.subtaskCount">
              <q-icon name="checklist" size="16px" color="grey-6" />
              <span class="meta-label">{{ task.subtaskCount }} subtasks</span>
            </div>
          </div>

          <div class="meta-row">
            <div class="meta-item">
              <q-avatar size="24px" color="primary" text-color="white">
                {{ getInitials(task.assignee) }}
              </q-avatar>
              <span class="meta-label">{{ formatAssignee(task.assignee) }}</span>
            </div>
            <div
              class="due-date-chip"
              :class="getDueDateClass(task.dueDate)"
              v-if="task.dueDate"
            >
              <q-icon name="event" size="14px" />
              {{ formatDueDate(task.dueDate) }}
            </div>
          </div>
        </div>
      </div>

      <div class="card-footer" v-if="task.status !== 'done'">
        <div class="progress-indicator">
          <div class="progress-bar" :style="{ width: getProgressWidth(task) }"></div>
        </div>
      </div>
    </div>

    <div v-if="!filteredTasks.length && !loading" class="empty-state">
      <q-icon name="inbox" size="64px" color="grey-5" />
      <p class="text-subtitle1 text-grey-7 q-mt-md">No tasks found</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useTaskSearchStore } from '../../../stores/taskSearch';

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  assignee: string;
  creator: string;
  dueDate: string;
  createdAt: string;
  completedAt?: string;
  subtaskCount?: number;
  tags?: string[];
}

const props = defineProps<{
  tasks: Task[];
  filter: string;
  loading?: boolean;
}>();

const emit = defineEmits<{
  'toggle-status': [task: Task];
  'select-task': [task: Task];
  'edit-task': [task: Task];
  'view-task': [task: Task];
  'delete-task': [task: Task];
  'restore-task': [task: Task];
}>();

const taskSearchStore = useTaskSearchStore();

// Filter tasks by search query
const filteredTasks = computed(() => {
  if (!taskSearchStore.searchQuery) {
    return props.tasks;
  }
  const query = taskSearchStore.searchQuery.toLowerCase();
  return props.tasks.filter((task: Task) =>
    task.title.toLowerCase().includes(query) ||
    task.description.toLowerCase().includes(query)
  );
});

const toggleTaskStatus = (task: Task) => {
  emit('toggle-status', task);
};

const selectTask = (task: Task) => {
  emit('select-task', task);
};

const openTaskMenu = (_task: Task) => {
  // Menu opens automatically with q-menu
};

const editTask = (task: Task) => {
  emit('edit-task', task);
};

const viewTask = (task: Task) => {
  emit('view-task', task);
};

const deleteTask = (task: Task) => {
  emit('delete-task', task);
};

const restoreTask = (task: Task) => {
  emit('restore-task', task);
};

const getInitials = (name: string | null | undefined) => {
  if (!name || typeof name !== 'string') return '?';
  if (name === 'current_user') return 'ME';
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
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

const formatDueDate = (dateString: string | null | undefined) => {
  if (!dateString) return '';

  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Check if today
  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  }

  // Check if tomorrow
  if (date.toDateString() === tomorrow.toDateString()) {
    return 'Tomorrow';
  }

  // Check if overdue
  if (date < today) {
    const daysOverdue = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (daysOverdue === 1) {
      return 'Yesterday';
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  // Otherwise show date
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const getDueDateClass = (dateString: string) => {
  if (!dateString) return '';

  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (date < today) {
    return 'overdue';
  } else if (date.toDateString() === today.toDateString()) {
    return 'today';
  }

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (date.toDateString() === tomorrow.toDateString()) {
    return 'tomorrow';
  }

  return 'upcoming';
};

const getPriorityIconColor = (priority: string) => {
  switch (priority.toLowerCase()) {
    case 'high':
      return 'red-5';
    case 'medium':
      return 'orange-5';
    case 'low':
      return 'green-5';
    default:
      return 'grey-5';
  }
};

const getProgressWidth = (task: Task) => {
  // Simple progress calculation based on status
  switch (task.status) {
    case 'done':
      return '100%';
    case 'review':
    case 'pending_approval':
      return '75%';
    case 'in_progress':
      return '50%';
    case 'todo':
    default:
      return '10%';
  }
};
</script>

<style lang="scss" scoped src="./Task.scss"></style>

<style lang="scss" scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px;
  grid-column: 1 / -1;
}
</style>