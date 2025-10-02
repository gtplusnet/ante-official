<template>
  <div class="task-stats-card-content">
    <div v-if="!loading" class="stats-content">
        <!-- Task Counters -->
        <div class="task-counters">
          <div class="counter-item todo">
            <div class="counter-icon">
              <q-icon name="pending_actions" size="20px" />
            </div>
            <div class="counter-details">
              <div class="counter-value">{{ taskCounts.todo }}</div>
              <div class="counter-label">To Do</div>
            </div>
          </div>

          <div class="counter-item in-progress">
            <div class="counter-icon">
              <q-icon name="autorenew" size="20px" />
            </div>
            <div class="counter-details">
              <div class="counter-value">{{ taskCounts.inProgress }}</div>
              <div class="counter-label">In Progress</div>
            </div>
          </div>

          <div class="counter-item done">
            <div class="counter-icon">
              <q-icon name="check_circle" size="20px" />
            </div>
            <div class="counter-details">
              <div class="counter-value">{{ taskCounts.done }}</div>
              <div class="counter-label">Completed</div>
            </div>
          </div>
        </div>

        <!-- Completion Bar -->
        <div class="completion-section q-mt-md">
          <div class="row justify-between text-caption q-mb-xs">
            <span class="text-grey-6">Overall Completion</span>
            <span class="text-weight-medium">{{ completionPercentage }}%</span>
          </div>
          <q-linear-progress
            :value="completionPercentage / 100"
            size="6px"
            :color="completionColor"
            track-color="grey-3"
            rounded
          />
        </div>

        <!-- Quick Actions -->
        <div class="quick-actions q-mt-md">
          <q-btn
            unelevated
            color="primary"
            icon="add"
            label="New Task"
            no-caps
            dense
            size="sm"
            class="full-width"
            @click="$emit('add-task')"
          />
        </div>
    </div>

    <!-- Loading State -->
    <div v-else class="text-center q-pa-md">
      <q-spinner-dots size="32px" color="primary" />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, PropType } from 'vue';

export default defineComponent({
  name: 'TaskStatsCard',
  emits: ['refresh', 'add-task'],
  props: {
    taskCounts: {
      type: Object as PropType<{ todo: number; inProgress: number; done: number }>,
      default: () => ({ todo: 0, inProgress: 0, done: 0 })
    },
    loading: {
      type: Boolean,
      default: false
    }
  },
  setup(props) {
    const totalTasks = computed(() => {
      return props.taskCounts.todo + props.taskCounts.inProgress + props.taskCounts.done;
    });

    const completionPercentage = computed(() => {
      if (totalTasks.value === 0) return 0;
      return Math.round((props.taskCounts.done / totalTasks.value) * 100);
    });

    const completionColor = computed(() => {
      const percentage = completionPercentage.value;
      if (percentage >= 100) return 'positive';
      if (percentage >= 75) return 'primary';
      if (percentage >= 50) return 'info';
      if (percentage >= 25) return 'warning';
      return 'grey';
    });

    return {
      totalTasks,
      completionPercentage,
      completionColor
    };
  }
});
</script>

<style scoped lang="scss">
.task-stats-card-content {
  height: 100%;
  display: flex;
  flex-direction: column;

  .stats-content {
    display: flex;
    flex-direction: column;
    height: 100%;

    .task-counters {
      display: flex;
      flex-direction: column;
      gap: 8px;

      .counter-item {
        padding: 12px;
        border-radius: 8px;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        gap: 12px;

        &:hover {
          transform: translateY(-2px);
        }

        &.todo {
          background: linear-gradient(135deg, #FFF3E0 0%, #FFE0B2 100%);
          border: 1px solid #FFCC80;

          .counter-icon {
            color: #FF9800;
          }

          .counter-value {
            color: #E65100;
          }

          .counter-label {
            color: #E65100;
          }
        }

        &.in-progress {
          background: linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%);
          border: 1px solid #90CAF9;

          .counter-icon {
            color: #2196F3;
          }

          .counter-value {
            color: #0D47A1;
          }

          .counter-label {
            color: #0D47A1;
          }
        }

        &.done {
          background: linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%);
          border: 1px solid #A5D6A7;

          .counter-icon {
            color: #4CAF50;
          }

          .counter-value {
            color: #1B5E20;
          }

          .counter-label {
            color: #1B5E20;
          }
        }

        .counter-icon {
          flex-shrink: 0;
        }

        .counter-details {
          display: flex;
          align-items: baseline;
          gap: 8px;
          flex: 1;
        }

        .counter-value {
          font-size: 20px;
          font-weight: 600;
          line-height: 1;
        }

        .counter-label {
          font-size: 12px;
          font-weight: 500;
          opacity: 0.9;
        }
      }
    }

    .completion-section {
      margin-top: auto;
      padding-top: 12px;
    }

    .quick-actions {
      margin-top: 12px;
    }
  }
}
</style>