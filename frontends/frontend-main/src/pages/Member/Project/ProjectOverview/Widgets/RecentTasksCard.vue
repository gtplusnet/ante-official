<template>
  <q-card flat class="recent-tasks-card">
    <q-card-section class="q-pa-md">
      <div class="row items-center justify-between q-mb-sm">
        <div class="row items-center">
          <q-icon name="list_alt" size="20px" color="primary" class="q-mr-sm" />
          <span class="text-subtitle2">Recent Tasks</span>
        </div>
        <q-btn
          flat
          dense
          no-caps
          size="sm"
          label="View All"
          @click="$emit('view-all')"
        />
      </div>

      <div v-if="!loading && tasks.length > 0" class="tasks-list">
        <q-list dense separator>
          <q-item
            v-for="task in tasks"
            :key="task.id"
            clickable
            class="task-item q-pa-xs"
            @click="$emit('task-click', task)"
          >
            <q-item-section avatar>
              <q-icon
                :name="getTaskIcon(task)"
                size="18px"
                :color="getTaskColor(task)"
              />
            </q-item-section>

            <q-item-section>
              <q-item-label class="text-body2">
                {{ task.title }}
              </q-item-label>
              <q-item-label caption>
                <span v-if="task.assignee">
                  {{ task.assignee }}
                </span>
                <span v-else class="text-grey-5">Unassigned</span>
                <span class="q-mx-xs">•</span>
                <span>{{ formatDate(task.createdAt) }}</span>
              </q-item-label>
            </q-item-section>

            <q-item-section side>
              <q-chip
                v-if="task.priority"
                dense
                square
                size="sm"
                :color="getPriorityColor(task.priority)"
                text-color="white"
                class="priority-chip"
              >
                {{ task.priority }}
              </q-chip>
            </q-item-section>
          </q-item>
        </q-list>
      </div>

      <!-- Empty State -->
      <div v-else-if="!loading && tasks.length === 0" class="empty-state">
        <q-icon name="assignment" size="56px" color="grey-4" />
        <div class="text-body1 text-grey-6 q-mt-md">No recent tasks</div>
        <div class="text-caption text-grey-5 q-mb-md">Start by creating your first task</div>
        <q-btn
          unelevated
          color="primary"
          icon="add"
          label="Create First Task"
          no-caps
          size="md"
          class="create-task-btn"
          @click="$emit('add-task')"
        />
      </div>

      <!-- Loading State -->
      <div v-else class="text-center q-pa-md">
        <q-spinner-dots size="32px" color="primary" />
      </div>
    </q-card-section>
  </q-card>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

interface Task {
  id: number;
  title: string;
  isDone: boolean;
  isInProgress: boolean;
  priority?: string;
  assignee?: string;
  createdAt?: string;
}

export default defineComponent({
  name: 'RecentTasksCard',
  emits: ['view-all', 'task-click', 'add-task'],
  props: {
    tasks: {
      type: Array as PropType<Task[]>,
      default: () => []
    },
    loading: {
      type: Boolean,
      default: false
    }
  },
  setup() {
    const getTaskIcon = (task: Task) => {
      if (task.isDone) return 'check_circle';
      if (task.isInProgress) return 'autorenew';
      return 'radio_button_unchecked';
    };

    const getTaskColor = (task: Task) => {
      if (task.isDone) return 'positive';
      if (task.isInProgress) return 'warning';
      return 'grey-6';
    };

    const getPriorityColor = (priority: string) => {
      switch (priority?.toUpperCase()) {
        case 'HIGH': return 'negative';
        case 'MEDIUM': return 'warning';
        case 'LOW': return 'info';
        default: return 'grey';
      }
    };

    const formatDate = (date: string | undefined) => {
      if (!date) return 'No date';

      const taskDate = new Date(date);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - taskDate.getTime());
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 0) return 'Today';
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays} days ago`;

      return taskDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    };

    return {
      getTaskIcon,
      getTaskColor,
      getPriorityColor,
      formatDate
    };
  }
});
</script>

<style scoped lang="scss">
.recent-tasks-card {
  height: 100%;
  display: flex;
  flex-direction: column;

  :deep(.q-card-section) {
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  .tasks-list {
    flex: 1;
    overflow-y: auto;
    max-height: 240px;

    .task-item {
      border-radius: 4px;
      transition: background 0.2s;

      &:hover {
        background: var(--md-sys-color-surface-variant);
      }

      .priority-chip {
        font-size: 10px;
        padding: 2px 6px;
        border-radius: 3px;
      }
    }
  }

  .empty-state {
    min-height: 200px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 24px;

    .create-task-btn {
      padding: 8px 24px;
    }
  }
}
</style>