<template>
  <q-dialog ref="dialogRef" @before-show="loadGoalDetails">
    <TemplateDialog minWidth="600px" maxWidth="700px">
      <template #DialogIcon>
        <q-icon name="o_flag" />
      </template>

      <template #DialogTitle>
        <div class="cursor-pointer">Goal Details</div>
      </template>

      <template #DialogContent>
        <section class="q-px-md q-pb-md">
          <div v-if="loading" class="text-center q-pa-lg">
            <q-spinner-dots size="40px" color="primary" />
          </div>

          <div v-else-if="goalDetails">
            <!-- Goal Header (Full Width) -->
            <div class="goal-header q-mb-sm">
              <h5 class="q-my-none">{{ goalDetails.name }}</h5>
              <q-badge
                :color="goalDetails.status === 'COMPLETED' ? 'positive' : 'primary'"
                :label="goalDetails.status"
                class="q-ml-sm"
              />
            </div>

            <!-- Description (Full Width) -->
            <div v-if="goalDetails.description" class="goal-description q-mb-sm">
              <div class="text-grey-7 text-caption q-mb-xs">Description</div>
              <div class="text-body2">{{ goalDetails.description }}</div>
            </div>

            <!-- 2-Column Layout: Stats (Left) + Chart (Right) -->
            <div class="goal-content-row q-mb-md">
              <!-- Left Column: Stats -->
              <div class="goal-stats-column">
                <!-- Stats -->
                <div class="goal-stats-row q-mb-sm">
                  <div class="stat-card">
                    <q-icon name="o_task_alt" size="20px" color="primary" />
                    <div class="stat-content">
                      <div class="stat-value">{{ goalDetails.completedTasks || 0 }} / {{ goalDetails.totalTasks || 0 }}</div>
                      <div class="stat-label">Tasks Completed</div>
                    </div>
                  </div>

                  <div class="stat-card" :class="{ 'overdue': isGoalOverdue }">
                    <q-icon
                      name="o_schedule"
                      size="20px"
                      :color="isGoalOverdue ? 'negative' : 'primary'"
                    />
                    <div class="stat-content">
                      <div class="stat-value" :class="{ 'text-negative text-weight-bold': isGoalOverdue }">
                        {{ goalDetails.deadline ? goalDetails.deadline.dateFull : 'No due date' }}
                      </div>
                      <div class="stat-label">Deadline</div>
                    </div>
                  </div>
                </div>

                <!-- Progress -->
                <div class="progress-section q-mb-sm">
                  <div class="progress-header q-mb-xs">
                    <span class="text-grey-7 text-caption">Progress</span>
                    <span class="text-primary text-weight-bold">{{ Math.round(goalDetails.progress) }}%</span>
                  </div>
                  <q-linear-progress
                    :value="goalDetails.progress / 100"
                    :color="goalDetails.status === 'COMPLETED' ? 'positive' : 'primary'"
                    size="8px"
                    rounded
                  />
                </div>

                <!-- Created By -->
                <div class="meta-info">
                  <div class="text-grey-7 text-caption">
                    Created by {{ goalDetails.createdBy.firstName }} {{ goalDetails.createdBy.lastName }}
                    on {{ goalDetails.createdAt.formatted }}
                  </div>
                </div>
              </div>

              <!-- Right Column: Progress Chart -->
              <div class="goal-chart-column">
                <GoalProgressChart :goal="goalDetails" />
              </div>
            </div>

            <!-- Linked Tasks -->
            <div class="linked-tasks-section">
              <div class="section-header q-mb-sm">
                <h6 class="q-my-none">Linked Tasks ({{ goalDetails.tasks?.length || 0 }})</h6>
                <q-btn
                  flat
                  dense
                  color="primary"
                  label="Link Tasks"
                  icon="o_link"
                  size="sm"
                  @click="emitLinkTasks"
                />
              </div>

              <div v-if="!goalDetails.tasks || goalDetails.tasks.length === 0" class="text-center q-pa-md text-grey-6">
                <q-icon name="o_task_alt" size="40px" class="q-mb-xs" />
                <div>No tasks linked to this goal</div>
              </div>

              <div v-else class="tasks-list">
                <div
                  v-for="task in goalDetails.tasks"
                  :key="task.id"
                  class="task-item"
                >
                  <q-icon
                    :name="task.boardLane?.key === 'DONE' ? 'check_circle' : 'o_radio_button_unchecked'"
                    :color="task.boardLane?.key === 'DONE' ? 'positive' : 'grey-5'"
                    size="20px"
                  />
                  <div class="task-content">
                    <div class="task-title">{{ task.title }}</div>
                    <div class="task-meta text-caption text-grey-6">
                      <span v-if="task.assignedTo">
                        {{ task.assignedTo.firstName }} {{ task.assignedTo.lastName }}
                      </span>
                      <span v-if="task.dueDate"> • Due: {{ task.dueDate.formatted }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="action-buttons q-mt-md text-right">
              <GButton
                v-if="goalDetails.status === 'PENDING'"
                no-caps
                variant="tonal"
                label="Edit"
                icon="o_edit"
                color="primary"
                class="q-mr-sm"
                @click="emitEdit"
              />
              <GButton
                v-if="goalDetails.status === 'PENDING'"
                no-caps
                variant="tonal"
                label="Mark as Completed"
                icon="o_check_circle"
                color="positive"
                class="q-mr-sm"
                @click="emitComplete"
              />
              <GButton
                no-caps
                variant="tonal"
                label="Delete"
                icon="o_delete"
                color="negative"
                class="q-mr-sm"
                @click="emitDelete"
              />
              <GButton
                no-caps
                label="Close"
                color="light-grey"
                v-close-popup
              />
            </div>
          </div>
        </section>
      </template>
    </TemplateDialog>
  </q-dialog>
</template>

<script lang="ts">
import { defineComponent, ref, computed, PropType, defineAsyncComponent } from 'vue';
import { QDialog } from 'quasar';
import GButton from 'src/components/shared/buttons/GButton.vue';
import { useGoalStore, type GoalData } from 'src/stores/goal';

// Lazy-loaded dialogs (ALL dialogs must be lazy loaded - CLAUDE.md)
const TemplateDialog = defineAsyncComponent(() =>
  import('src/components/dialog/TemplateDialog.vue')
);

// Lazy-loaded chart component (for bundle optimization)
const GoalProgressChart = defineAsyncComponent(() =>
  import('src/components/charts/GoalProgressChart.vue')
);

export default defineComponent({
  name: 'GoalViewDialog',
  components: {
    GButton,
    TemplateDialog,
    GoalProgressChart
  },
  props: {
    goal: {
      type: Object as PropType<GoalData | null>,
      default: null
    }
  },
  emits: ['close', 'edit', 'link-tasks', 'complete', 'delete'],
  setup(props, { emit }) {
    const goalStore = useGoalStore();
    const dialogRef = ref<InstanceType<typeof QDialog>>();
    const loading = ref(false);
    const goalDetails = ref<GoalData | null>(null);

    // Helper function to check if goal is overdue
    const isGoalOverdue = computed(() => {
      if (!goalDetails.value) return false;
      if (goalDetails.value.status !== 'PENDING') return false;
      if (!goalDetails.value.deadline || !goalDetails.value.deadline.raw) return false;

      const deadlineDate = new Date(goalDetails.value.deadline.raw);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      return deadlineDate < today;
    });

    const loadGoalDetails = async () => {
      if (!props.goal) return;

      loading.value = true;
      try {
        // Fetch full goal details with tasks
        const details = await goalStore.fetchGoalById(props.goal.id);
        goalDetails.value = details;
      } catch (error) {
        console.error('Failed to load goal details:', error);
      } finally {
        loading.value = false;
      }
    };

    const emitEdit = () => {
      if (props.goal) {
        emit('edit', props.goal);
        if (dialogRef.value) {
          dialogRef.value.hide();
        }
      }
    };

    const emitLinkTasks = () => {
      if (props.goal) {
        emit('link-tasks', props.goal);
        if (dialogRef.value) {
          dialogRef.value.hide();
        }
      }
    };

    const emitComplete = () => {
      if (props.goal) {
        emit('complete', props.goal);
        if (dialogRef.value) {
          dialogRef.value.hide();
        }
      }
    };

    const emitDelete = () => {
      if (props.goal) {
        emit('delete', props.goal);
        if (dialogRef.value) {
          dialogRef.value.hide();
        }
      }
    };

    return {
      dialogRef,
      loading,
      goalDetails,
      isGoalOverdue,
      loadGoalDetails,
      emitEdit,
      emitLinkTasks,
      emitComplete,
      emitDelete
    };
  }
});
</script>

<style lang="scss" scoped>
// Goal Header (Full Width)
.goal-header {
  display: flex;
  align-items: center;

  h5 {
    flex: 1;
    font-size: 18px;
    font-weight: 600;
  }
}

// Description (Full Width)
.goal-description {
  .text-body2 {
    white-space: pre-wrap;
    font-size: 13px;
  }
}

// 2-Column Layout Container
.goal-content-row {
  display: flex;
  gap: 16px;

  // Responsive: stack on mobile
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 12px;
  }
}

// Left Column: Stats
.goal-stats-column {
  flex: 1;
  min-width: 0; // Prevent overflow

  .goal-stats-row {
    display: flex;
    gap: 12px;

    .stat-card {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px;
      background: #f5f5f5;
      border-radius: 6px;

      &.overdue {
        background-color: #ffebee;
        border: 1px solid #ffcdd2;
      }

      .stat-content {
        .stat-value {
          font-size: 16px;
          font-weight: 600;
          line-height: 1.2;
        }

        .stat-label {
          font-size: 11px;
          color: #666;
        }
      }
    }
  }

  .progress-section {
    .progress-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
  }
}

// Right Column: Chart
.goal-chart-column {
  flex: 1;
  min-width: 0; // Prevent overflow
  display: flex;
  align-items: stretch;
  justify-content: center;
}

.linked-tasks-section {
  border-top: 1px solid #e0e0e0;
  padding-top: 12px;

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    h6 {
      font-size: 14px;
      font-weight: 600;
    }
  }

  .tasks-list {
    max-height: 300px;
    overflow-y: auto;
    overflow-x: hidden;

    &::-webkit-scrollbar {
      width: 6px;
    }

    &::-webkit-scrollbar-track {
      background: #f1f1f1;
      border-radius: 3px;
    }

    &::-webkit-scrollbar-thumb {
      background: #c1c1c1;
      border-radius: 3px;

      &:hover {
        background: #a8a8a8;
      }
    }

    .task-item {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 8px;
      border-radius: 4px;
      margin-bottom: 6px;
      background: #fafafa;

      &:hover {
        background: #f0f0f0;
      }

      .task-content {
        flex: 1;

        .task-title {
          font-weight: 500;
          margin-bottom: 3px;
          font-size: 13px;
        }

        .task-meta {
          display: flex;
          gap: 6px;
          font-size: 11px;
        }
      }
    }
  }
}
</style>
