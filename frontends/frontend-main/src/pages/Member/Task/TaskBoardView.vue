<template>
  <div class="task-board-view">
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
        <div class="column-title">
          {{ column.title }}
          <span class="column-count">{{ getColumnTasks(column.key).length }}</span>
        </div>
      </div>
      <div class="column-content">
        <div
          v-for="task in getColumnTasks(column.key)"
          :key="task.id"
          class="task-card"
          draggable="true"
          @dragstart="handleDragStart($event, task)"
          @dragend="handleDragEnd"
        >
          <div class="task-card-title">{{ task.title }}</div>
          <div class="task-card-meta">
            <q-chip dense size="xs" :color="getPriorityColor(task.priority)" v-if="task.priority">
              {{ task.priority }}
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
          No tasks in {{ column.title.toLowerCase() }}
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, PropType } from 'vue';
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
}

interface BoardColumn {
  key: string;
  title: string;
  statuses: string[];
}

export default defineComponent({
  name: 'TaskBoardView',
  props: {
    tasks: {
      type: Array as PropType<Task[]>,
      required: true,
    },
    filter: {
      type: String,
      required: true,
    },
  },
  setup(props, { emit }) {
    const taskSearchStore = useTaskSearchStore();
    const draggedTask = ref<Task | null>(null);
    const dragOverColumn = ref<string | null>(null);

    const boardColumns: BoardColumn[] = [
      { key: 'todo', title: 'To Do', statuses: ['todo', 'pending'] },
      { key: 'in_progress', title: 'In Progress', statuses: ['in_progress'] },
      { key: 'review', title: 'Review', statuses: ['review', 'pending_approval'] },
      { key: 'done', title: 'Done', statuses: ['done', 'completed'] },
    ];

    // Filter tasks by search query
    const filteredTasks = computed(() => {
      if (!taskSearchStore.searchQuery) {
        return props.tasks;
      }
      const query = taskSearchStore.searchQuery.toLowerCase();
      return props.tasks.filter(task =>
        (task.title && task.title.toLowerCase().includes(query)) ||
        (task.description && task.description.toLowerCase().includes(query))
      );
    });

    const getColumnTasks = (columnKey: string) => {
      const column = boardColumns.find(col => col.key === columnKey);
      if (!column) return [];

      return filteredTasks.value.filter(task =>
        column.statuses.includes(task.status)
      );
    };

    const handleDragStart = (event: DragEvent, task: Task) => {
      draggedTask.value = task;
      event.dataTransfer!.effectAllowed = 'move';
      event.dataTransfer!.setData('text/plain', task.id);

      const target = event.target as HTMLElement;
      target.classList.add('dragging');
    };

    const handleDragEnd = (event: DragEvent) => {
      const target = event.target as HTMLElement;
      target.classList.remove('dragging');
      draggedTask.value = null;
      dragOverColumn.value = null;
    };

    const handleDragOver = (columnKey: string) => {
      dragOverColumn.value = columnKey;
    };

    const handleDragLeave = () => {
      dragOverColumn.value = null;
    };

    const handleDrop = (event: DragEvent, targetColumnKey: string) => {
      event.preventDefault();
      dragOverColumn.value = null;

      if (!draggedTask.value) return;

      const targetColumn = boardColumns.find(col => col.key === targetColumnKey);
      if (!targetColumn) return;

      // Map column to new status
      const newStatus = targetColumn.statuses[0];
      emit('update-status', draggedTask.value, newStatus);
    };

    const getPriorityColor = (priority: string | undefined | null) => {
      if (!priority) return 'grey-5';

      switch (priority.toLowerCase()) {
        case 'high':
        case 'critical':
          return 'red-5';
        case 'medium':
        case 'normal':
          return 'orange-5';
        case 'low':
          return 'green-5';
        default:
          return 'grey-5';
      }
    };

    const formatDate = (dateString: string) => {
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

    return {
      boardColumns,
      dragOverColumn,
      getColumnTasks,
      handleDragStart,
      handleDragEnd,
      handleDragOver,
      handleDragLeave,
      handleDrop,
      getPriorityColor,
      formatDate,
      formatAssignee,
    };
  },
});
</script>

<style lang="scss" scoped src="./Task.scss"></style>

<style lang="scss" scoped>
.empty-column {
  padding: 12px;
  text-align: center;
  color: #6d6e78;
  font-size: 12px;
}
</style>