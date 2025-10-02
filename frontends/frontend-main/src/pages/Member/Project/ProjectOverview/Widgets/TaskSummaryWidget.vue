<template>
  <q-card flat bordered class="task-summary-widget">
    <q-card-section class="q-pa-md">
      <div class="row items-center justify-between q-mb-md">
        <div class="row items-center">
          <q-icon name="task" size="20px" color="primary" class="q-mr-sm" />
          <span class="text-subtitle2">Task Summary</span>
        </div>
        <q-btn
          flat
          dense
          round
          icon="refresh"
          size="sm"
          @click="fetchTasks"
          :loading="loading"
        >
          <q-tooltip>Refresh tasks</q-tooltip>
        </q-btn>
      </div>

      <!-- Task Statistics -->
      <div v-if="!loading" class="task-stats">
        <div class="row q-gutter-sm q-mb-md">
          <div class="col task-stat-card todo">
            <div class="stat-icon">
              <q-icon name="pending_actions" size="18px" />
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ taskCounts.todo }}</div>
              <div class="stat-label">To Do</div>
            </div>
          </div>
          <div class="col task-stat-card in-progress">
            <div class="stat-icon">
              <q-icon name="autorenew" size="18px" />
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ taskCounts.inProgress }}</div>
              <div class="stat-label">In Progress</div>
            </div>
          </div>
          <div class="col task-stat-card done">
            <div class="stat-icon">
              <q-icon name="check_circle" size="18px" />
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ taskCounts.done }}</div>
              <div class="stat-label">Done</div>
            </div>
          </div>
        </div>

        <!-- Progress Bar -->
        <div class="progress-section q-mb-md">
          <div class="row justify-between text-caption q-mb-xs">
            <span>Completion</span>
            <span class="text-weight-medium">{{ completionPercentage }}%</span>
          </div>
          <q-linear-progress
            :value="completionPercentage / 100"
            size="6px"
            color="positive"
            track-color="grey-3"
            rounded
          />
        </div>

        <!-- Recent Tasks -->
        <div v-if="recentTasks.length > 0" class="recent-tasks q-mb-md">
          <div class="text-caption text-grey-7 q-mb-sm">Recent Tasks</div>
          <q-list dense separator>
            <q-item
              v-for="task in recentTasks"
              :key="task.id"
              clickable
              class="q-pa-xs"
            >
              <q-item-section avatar>
                <q-icon
                  :name="getTaskIcon(task)"
                  size="16px"
                  :color="getTaskColor(task)"
                />
              </q-item-section>
              <q-item-section>
                <q-item-label class="text-body2">{{ task.title }}</q-item-label>
                <q-item-label caption>
                  {{ getTaskAssignee(task) }}
                </q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-chip
                  dense
                  square
                  size="sm"
                  :color="getPriorityColor(task.priority)"
                  text-color="white"
                >
                  {{ task.priority }}
                </q-chip>
              </q-item-section>
            </q-item>
          </q-list>
        </div>

        <!-- Empty State -->
        <div v-else class="text-center q-pa-md">
          <q-icon name="assignment" size="48px" color="grey-5" />
          <div class="text-body2 text-grey-7 q-mt-sm">No tasks yet</div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-else class="text-center q-pa-md">
        <q-spinner-dots size="40px" color="primary" />
      </div>

      <!-- Action Buttons -->
      <div class="row q-gutter-sm">
        <q-btn
          unelevated
          color="primary"
          icon="add"
          label="Add Task"
          no-caps
          dense
          class="col"
          @click="$emit('add-task')"
        />
        <q-btn
          outline
          color="primary"
          icon="view_list"
          label="View All"
          no-caps
          dense
          class="col"
          @click="navigateToTasks"
        />
      </div>
    </q-card-section>
  </q-card>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted, PropType } from 'vue';
import { useRouter } from 'vue-router';
import { ProjectDataResponse } from '@shared/response';
import supabaseService from '../../../../../services/supabase';

interface Task {
  id: number;
  title: string;
  isDone: boolean;
  isInProgress: boolean;
  priority: string;
  assignedToId?: string;
  Account?: {
    firstName: string;
    lastName: string;
  };
}

export default defineComponent({
  name: 'TaskSummaryWidget',
  emits: ['add-task'],
  props: {
    projectData: {
      type: Object as PropType<ProjectDataResponse | null>,
      default: null
    }
  },
  setup(props) {
    const router = useRouter();
    const loading = ref(false);
    const tasks = ref<Task[]>([]);

    const taskCounts = computed(() => {
      const todo = tasks.value.filter(t => !t.isDone && !t.isInProgress).length;
      const inProgress = tasks.value.filter(t => t.isInProgress && !t.isDone).length;
      const done = tasks.value.filter(t => t.isDone).length;

      return { todo, inProgress, done };
    });

    const completionPercentage = computed(() => {
      const total = tasks.value.length;
      if (total === 0) return 0;
      return Math.round((taskCounts.value.done / total) * 100);
    });

    const recentTasks = computed(() => {
      return tasks.value
        .filter(t => !t.isDone)
        .slice(0, 3);
    });

    const fetchTasks = async () => {
      if (!props.projectData?.id) return;

      loading.value = true;
      try {
        const { data, error } = await supabaseService.getClient()
          .from('Task')
          .select(`
            id,
            title,
            priorityLevel,
            assignedToId,
            boardLane:boardLaneId (
              id,
              key,
              name
            ),
            Account:assignedToId (
              firstName,
              lastName
            )
          `)
          .eq('projectId', props.projectData.id)
          .eq('isDeleted', false)
          .order('createdAt', { ascending: false })
          .limit(10);

        if (!error && data) {
          // Map data to include isDone, isInProgress, and priority for compatibility
          tasks.value = data.map(task => ({
            ...task,
            isDone: task.boardLane?.key === 'DONE',
            isInProgress: task.boardLane?.key === 'IN_PROGRESS',
            priority: task.priorityLevel === 3 ? 'high' : task.priorityLevel === 2 ? 'medium' : 'low'
          })) as Task[];
        }
      } catch (err) {
        console.error('Error fetching tasks:', err);
      } finally {
        loading.value = false;
      }
    };

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

    const getTaskAssignee = (task: Task) => {
      if (task.Account) {
        return `${task.Account.firstName} ${task.Account.lastName}`;
      }
      return 'Unassigned';
    };

    const getPriorityColor = (priority: string) => {
      switch (priority?.toUpperCase()) {
        case 'HIGH': return 'negative';
        case 'MEDIUM': return 'warning';
        case 'LOW': return 'info';
        default: return 'grey';
      }
    };

    const navigateToTasks = () => {
      // Navigate to task board or task list
      router.push(`/member/tasks?projectId=${props.projectData?.id}`);
    };

    onMounted(() => {
      fetchTasks();
    });

    return {
      loading,
      taskCounts,
      completionPercentage,
      recentTasks,
      fetchTasks,
      getTaskIcon,
      getTaskColor,
      getTaskAssignee,
      getPriorityColor,
      navigateToTasks
    };
  }
});
</script>

<style scoped lang="scss">
.task-summary-widget {
  border: 1px solid var(--md-sys-color-outline-variant);
  border-radius: 8px;

  .task-stat-card {
    padding: 8px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;

    &.todo {
      background: rgba(255, 152, 0, 0.08);
      color: #e65100;

      .stat-icon {
        color: #ff9800;
      }
    }

    &.in-progress {
      background: rgba(33, 150, 243, 0.08);
      color: #0d47a1;

      .stat-icon {
        color: #2196f3;
      }
    }

    &.done {
      background: rgba(76, 175, 80, 0.08);
      color: #1b5e20;

      .stat-icon {
        color: #4caf50;
      }
    }

    .stat-content {
      flex: 1;
      min-width: 0;
    }

    .stat-value {
      font-size: 18px;
      font-weight: 600;
      line-height: 1.2;
    }

    .stat-label {
      font-size: 11px;
      opacity: 0.8;
    }
  }

  .progress-section {
    padding: 8px 0;
  }

  .recent-tasks {
    .q-item {
      border-radius: 4px;
      transition: background 0.2s;

      &:hover {
        background: var(--md-sys-color-surface-variant);
      }
    }
  }
}
</style>