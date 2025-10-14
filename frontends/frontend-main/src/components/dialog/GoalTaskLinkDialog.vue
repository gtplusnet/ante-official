<template>
  <q-dialog ref="dialogRef" @before-show="loadTasks">
    <TemplateDialog minWidth="700px" maxWidth="800px">
      <template #DialogIcon>
        <q-icon name="o_link" />
      </template>

      <template #DialogTitle>
        <div class="cursor-pointer">Link Tasks to Goal</div>
      </template>

      <template #DialogContent>
        <section class="q-px-md q-pb-md">
          <div v-if="loading" class="text-center q-pa-lg">
            <q-spinner-dots size="40px" color="primary" />
          </div>

          <div v-else>
            <!-- Goal Info -->
            <div class="goal-info-header q-mb-md q-pa-md bg-grey-2 rounded-borders">
              <div class="text-subtitle1 text-weight-bold">{{ goal?.name }}</div>
              <div class="text-caption text-grey-7">
                Current Progress: {{ goal?.completedTasks || 0 }} / {{ goal?.totalTasks || 0 }} tasks
              </div>
            </div>

            <!-- Search and Filter -->
            <div class="search-section q-mb-md">
              <g-input
                v-model="searchQuery"
                type="text"
                label="Search tasks"
                placeholder="Type to search..."
                clearable
                @update:model-value="filterTasks"
              >
                <template #prepend>
                  <q-icon name="search" />
                </template>
              </g-input>
            </div>

            <!-- Available Tasks List -->
            <div class="tasks-section">
              <div class="section-label q-mb-sm text-grey-7">
                Available Tasks ({{ filteredTasks.length }})
              </div>

              <div v-if="filteredTasks.length === 0" class="text-center q-pa-lg text-grey-6">
                <q-icon name="o_task_alt" size="48px" class="q-mb-sm" />
                <div>No available tasks found</div>
                <div class="text-caption">All tasks may already be linked to goals</div>
              </div>

              <div v-else class="tasks-list">
                <q-checkbox
                  v-for="task in filteredTasks"
                  :key="task.id"
                  v-model="selectedTaskIds"
                  :val="task.id"
                  class="task-checkbox-item"
                >
                  <div class="task-item-content">
                    <div class="task-title">{{ task.title }}</div>
                    <div class="task-meta text-caption text-grey-6">
                      <span v-if="task.assignedTo">
                        {{ task.assignedTo.firstName }} {{ task.assignedTo.lastName }}
                      </span>
                      <span v-if="task.project"> • {{ task.project.name }}</span>
                      <span v-if="task.dueDate"> • Due: {{ task.dueDate.formatted }}</span>
                    </div>
                    <div v-if="task.goal" class="task-warning text-caption text-warning q-mt-xs">
                      <q-icon name="warning" size="14px" />
                      Already linked to: {{ task.goal.name }}
                    </div>
                  </div>
                </q-checkbox>
              </div>
            </div>

            <!-- Selected Count -->
            <div v-if="selectedTaskIds.length > 0" class="selected-count q-mt-md q-pa-sm bg-primary text-white rounded-borders">
              <q-icon name="check_circle" />
              {{ selectedTaskIds.length }} task(s) selected
            </div>

            <!-- Action Buttons -->
            <div class="action-buttons q-mt-lg text-right">
              <GButton
                no-caps
                class="q-mr-sm"
                variant="tonal"
                label="Cancel"
                color="light-grey"
                v-close-popup
              />
              <GButton
                no-caps
                unelevated
                label="Link Selected Tasks"
                color="primary"
                :disabled="selectedTaskIds.length === 0"
                :loading="linking"
                @click="linkTasks"
              />
            </div>
          </div>
        </section>
      </template>
    </TemplateDialog>
  </q-dialog>
</template>

<script lang="ts">
import { defineComponent, ref, PropType, computed } from 'vue';
import { defineAsyncComponent } from 'vue';
import { QDialog, useQuasar } from 'quasar';
import GInput from 'src/components/shared/form/GInput.vue';
import GButton from 'src/components/shared/buttons/GButton.vue';
import { useGoalStore, type GoalData } from 'src/stores/goal';
import { api } from 'src/boot/axios';

// Lazy-loaded dialogs (ALL dialogs must be lazy loaded - CLAUDE.md)
const TemplateDialog = defineAsyncComponent(() =>
  import('src/components/dialog/TemplateDialog.vue')
);

interface Task {
  id: number;
  title: string;
  description?: string;
  assignedTo?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  project?: {
    id: number;
    name: string;
  };
  dueDate?: {
    raw: string;
    formatted: string;
  };
  goal?: {
    id: number;
    name: string;
  };
}

export default defineComponent({
  name: 'GoalTaskLinkDialog',
  components: {
    GInput,
    GButton,
    TemplateDialog
  },
  props: {
    goal: {
      type: Object as PropType<GoalData | null>,
      default: null
    }
  },
  emits: ['close', 'tasks-linked'],
  setup(props, { emit }) {
    const $q = useQuasar();
    const goalStore = useGoalStore();
    const dialogRef = ref<InstanceType<typeof QDialog>>();
    const loading = ref(false);
    const linking = ref(false);
    const searchQuery = ref('');
    const selectedTaskIds = ref<number[]>([]);
    const availableTasks = ref<Task[]>([]);

    const filteredTasks = computed(() => {
      if (!searchQuery.value) {
        return availableTasks.value;
      }

      const query = searchQuery.value.toLowerCase();
      return availableTasks.value.filter(task =>
        task.title.toLowerCase().includes(query) ||
        task.description?.toLowerCase().includes(query) ||
        task.assignedTo?.firstName.toLowerCase().includes(query) ||
        task.assignedTo?.lastName.toLowerCase().includes(query) ||
        task.project?.name.toLowerCase().includes(query)
      );
    });

    const loadTasks = async () => {
      loading.value = true;
      selectedTaskIds.value = [];

      try {
        // Fetch all tasks (backend will return tasks with goal info)
        const response = await api.get('/task/all');

        if (response.data && response.data.items) {
          availableTasks.value = response.data.items;
        }
      } catch (error) {
        console.error('Failed to load tasks:', error);
        $q.notify({
          type: 'negative',
          message: 'Failed to load tasks',
          position: 'top'
        });
      } finally {
        loading.value = false;
      }
    };

    const filterTasks = () => {
      // Computed property handles filtering
    };

    const linkTasks = async () => {
      if (!props.goal || selectedTaskIds.value.length === 0) {
        return;
      }

      linking.value = true;

      try {
        // Check if any selected tasks are already linked to goals
        const tasksWithGoals = selectedTaskIds.value.filter(taskId => {
          const task = availableTasks.value.find(t => t.id === taskId);
          return task?.goal;
        });

        if (tasksWithGoals.length > 0) {
          // Confirm override
          const confirmed = await new Promise<boolean>((resolve) => {
            $q.dialog({
              title: 'Warning',
              message: `${tasksWithGoals.length} task(s) are already linked to other goals. Link anyway? This will unlink them from their current goals.`,
              cancel: true,
              persistent: true
            }).onOk(() => resolve(true))
              .onCancel(() => resolve(false));
          });

          if (!confirmed) {
            linking.value = false;
            return;
          }
        }

        // Link tasks to goal
        await goalStore.linkMultipleTasksToGoal(props.goal.id, selectedTaskIds.value);

        // Emit success
        emit('tasks-linked');
        emit('close');

        // Close dialog
        if (dialogRef.value) {
          dialogRef.value.hide();
        }
      } catch (error) {
        console.error('Failed to link tasks:', error);
        // Error notification handled by store
      } finally {
        linking.value = false;
      }
    };

    return {
      dialogRef,
      loading,
      linking,
      searchQuery,
      selectedTaskIds,
      availableTasks,
      filteredTasks,
      loadTasks,
      filterTasks,
      linkTasks
    };
  }
});
</script>

<style lang="scss" scoped>
.goal-info-header {
  .text-subtitle1 {
    font-size: 16px;
  }
}

.tasks-section {
  max-height: 400px;
  overflow-y: auto;

  .section-label {
    font-size: 13px;
    font-weight: 500;
    text-transform: uppercase;
  }

  .tasks-list {
    .task-checkbox-item {
      width: 100%;
      padding: 12px;
      margin-bottom: 8px;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      transition: all 0.2s;

      &:hover {
        background: #fafafa;
      }

      :deep(.q-checkbox__inner) {
        align-self: flex-start;
        margin-top: 2px;
      }

      .task-item-content {
        flex: 1;
        padding-left: 8px;

        .task-title {
          font-weight: 500;
          margin-bottom: 4px;
        }

        .task-meta {
          display: flex;
          gap: 4px;
          flex-wrap: wrap;
        }

        .task-warning {
          display: flex;
          align-items: center;
          gap: 4px;
        }
      }
    }
  }
}

.selected-count {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
}
</style>
