<template>
  <div class="goal-list-container">
    <!-- Header -->
    <div class="goal-view-header">
      <div class="header-left">
        <h1>Goals</h1>
      </div>
      <div class="header-actions">
        <q-btn
          color="primary"
          icon="add"
          label="New Goal"
          size="sm"
          dense
          unelevated
          @click="openCreateDialog"
        />
      </div>
    </div>

    <!-- Tabs -->
    <q-tabs
      v-model="activeTab"
      dense
      class="goal-tabs q-mt-md"
      active-color="primary"
      indicator-color="primary"
      align="left"
    >
      <q-tab name="pending" label="Pending" />
      <q-tab name="completed" label="Completed" />
    </q-tabs>

    <q-separator />

    <!-- Tab Panels -->
    <q-tab-panels v-model="activeTab" animated class="goal-tab-panels">
      <!-- Pending Goals -->
      <q-tab-panel name="pending">
        <div v-if="loading && !filteredGoals.length" class="text-center q-pa-lg">
          <q-spinner-dots size="40px" color="primary" />
        </div>

        <div v-else-if="!loading && !filteredGoals.length" class="text-center q-pa-lg text-grey-6">
          <q-icon name="o_flag" size="48px" class="q-mb-md" />
          <div class="text-h6">No pending goals</div>
          <div class="text-body2">Create your first goal to get started</div>
        </div>

        <div v-else class="goal-grid">
          <div
            v-for="goal in filteredGoals"
            :key="goal.id"
            class="goal-card"
            @click="viewGoal(goal)"
          >
            <div class="goal-card-header">
              <div class="goal-name">{{ goal.name }}</div>
              <q-btn
                flat
                round
                dense
                size="sm"
                icon="more_vert"
                @click.stop="openGoalMenu(goal)"
              >
                <q-menu>
                  <q-list dense style="min-width: 150px">
                    <q-item clickable v-close-popup @click="viewGoal(goal)">
                      <q-item-section avatar>
                        <q-icon name="o_visibility" />
                      </q-item-section>
                      <q-item-section>View</q-item-section>
                    </q-item>
                    <q-item clickable v-close-popup @click="editGoal(goal)">
                      <q-item-section avatar>
                        <q-icon name="o_edit" />
                      </q-item-section>
                      <q-item-section>Edit</q-item-section>
                    </q-item>
                    <q-item clickable v-close-popup @click="linkTasksToGoal(goal)">
                      <q-item-section avatar>
                        <q-icon name="o_link" />
                      </q-item-section>
                      <q-item-section>Link Tasks</q-item-section>
                    </q-item>
                    <q-item clickable v-close-popup @click="markAsCompleted(goal)">
                      <q-item-section avatar>
                        <q-icon name="o_check_circle" />
                      </q-item-section>
                      <q-item-section>Mark as Completed</q-item-section>
                    </q-item>
                    <q-separator />
                    <q-item clickable v-close-popup @click="deleteGoal(goal)">
                      <q-item-section avatar>
                        <q-icon name="o_delete" color="negative" />
                      </q-item-section>
                      <q-item-section class="text-negative">Delete</q-item-section>
                    </q-item>
                  </q-list>
                </q-menu>
              </q-btn>
            </div>

            <div v-if="goal.description" class="goal-description">
              {{ goal.description }}
            </div>

            <!-- Creator information -->
            <div class="goal-creator">
              <q-avatar size="20px" class="creator-avatar">
                <img v-if="goal.createdBy?.image" :src="goal.createdBy.image" />
                <span v-else>{{ getCreatorInitials(goal) }}</span>
              </q-avatar>
              <span class="creator-name">
                {{ goal.createdBy ? `${goal.createdBy.firstName} ${goal.createdBy.lastName}` : 'Unknown' }}
              </span>
            </div>

            <div class="goal-stats">
              <div class="stat-item">
                <q-icon name="o_task_alt" size="18px" />
                <span>{{ goal.completedTasks || 0 }} of {{ goal.totalTasks || 0 }}</span>
              </div>
              <div class="stat-item" :class="{ 'overdue': isGoalOverdue(goal) }">
                <q-icon
                  name="o_schedule"
                  size="18px"
                  :color="isGoalOverdue(goal) ? 'negative' : undefined"
                />
                <span :class="{ 'text-negative text-weight-bold': isGoalOverdue(goal) }">
                  {{ goal.deadline ? goal.deadline.dateFull : 'No due date' }}
                </span>
              </div>
            </div>

            <div class="goal-progress">
              <div class="progress-label">
                <span>Progress</span>
                <span class="progress-value">{{ Math.round(goal.progress) }}%</span>
              </div>
              <q-linear-progress
                :value="goal.progress / 100"
                color="primary"
                size="8px"
                rounded
                class="q-mt-xs"
              />
            </div>
          </div>
        </div>
      </q-tab-panel>

      <!-- Completed Goals -->
      <q-tab-panel name="completed">
        <div v-if="loading && !filteredGoals.length" class="text-center q-pa-lg">
          <q-spinner-dots size="40px" color="primary" />
        </div>

        <div v-else-if="!loading && !filteredGoals.length" class="text-center q-pa-lg text-grey-6">
          <q-icon name="o_check_circle" size="48px" class="q-mb-md" />
          <div class="text-h6">No completed goals</div>
          <div class="text-body2">Completed goals will appear here</div>
        </div>

        <div v-else class="goal-grid">
          <div
            v-for="goal in filteredGoals"
            :key="goal.id"
            class="goal-card completed"
            @click="viewGoal(goal)"
          >
            <div class="goal-card-header">
              <div class="goal-name">
                <q-icon name="check_circle" color="positive" size="20px" class="q-mr-xs" />
                {{ goal.name }}
              </div>
              <q-btn
                flat
                round
                dense
                size="sm"
                icon="more_vert"
                @click.stop="openGoalMenu(goal)"
              >
                <q-menu>
                  <q-list dense style="min-width: 150px">
                    <q-item clickable v-close-popup @click="viewGoal(goal)">
                      <q-item-section avatar>
                        <q-icon name="o_visibility" />
                      </q-item-section>
                      <q-item-section>View</q-item-section>
                    </q-item>
                    <q-item clickable v-close-popup @click="linkTasksToGoal(goal)">
                      <q-item-section avatar>
                        <q-icon name="o_link" />
                      </q-item-section>
                      <q-item-section>Link Tasks</q-item-section>
                    </q-item>
                    <q-separator />
                    <q-item clickable v-close-popup @click="deleteGoal(goal)">
                      <q-item-section avatar>
                        <q-icon name="o_delete" color="negative" />
                      </q-item-section>
                      <q-item-section class="text-negative">Delete</q-item-section>
                    </q-item>
                  </q-list>
                </q-menu>
              </q-btn>
            </div>

            <div v-if="goal.description" class="goal-description">
              {{ goal.description }}
            </div>

            <!-- Creator information -->
            <div class="goal-creator">
              <q-avatar size="20px" class="creator-avatar">
                <img v-if="goal.createdBy?.image" :src="goal.createdBy.image" />
                <span v-else>{{ getCreatorInitials(goal) }}</span>
              </q-avatar>
              <span class="creator-name">
                {{ goal.createdBy ? `${goal.createdBy.firstName} ${goal.createdBy.lastName}` : 'Unknown' }}
              </span>
            </div>

            <div class="goal-stats">
              <div class="stat-item">
                <q-icon name="o_task_alt" size="18px" />
                <span>{{ goal.completedTasks || 0 }} of {{ goal.totalTasks || 0 }}</span>
              </div>
              <div class="stat-item">
                <q-icon name="o_schedule" size="18px" />
                <span>{{ goal.deadline ? goal.deadline.dateFull : 'No due date' }}</span>
              </div>
            </div>

            <div class="goal-progress">
              <div class="progress-label">
                <span>Progress</span>
                <span class="progress-value">100%</span>
              </div>
              <q-linear-progress
                :value="1"
                color="positive"
                size="8px"
                rounded
                class="q-mt-xs"
              />
            </div>
          </div>
        </div>
      </q-tab-panel>
    </q-tab-panels>

    <!-- Lazy-loaded dialogs (MANDATORY - CLAUDE.md) -->
    <GoalCreateDialog
      v-model="showCreateDialog"
      @goal-created="handleGoalCreated"
    />

    <GoalEditDialog
      v-model="showEditDialog"
      :goal="selectedGoal"
      @goal-updated="handleGoalUpdated"
    />

    <GoalViewDialog
      v-model="showViewDialog"
      :goal="selectedGoal"
      @edit="editGoal"
      @link-tasks="linkTasksToGoal"
      @complete="markAsCompleted"
      @delete="deleteGoal"
    />

    <GoalTaskLinkDialog
      v-model="showLinkTasksDialog"
      :goal="selectedGoal"
      @tasks-linked="handleTasksLinked"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted, defineAsyncComponent } from 'vue';
import { useGoalStore, type GoalData } from 'src/stores/goal';
import { storeToRefs } from 'pinia';
import { useQuasar } from 'quasar';

export default defineComponent({
  name: 'GoalList',
  components: {
    // Lazy-loaded dialogs (ALL dialogs must be lazy loaded - CLAUDE.md)
    GoalCreateDialog: defineAsyncComponent(() =>
      import('../../../components/dialog/GoalCreateDialog.vue')
    ),
    GoalEditDialog: defineAsyncComponent(() =>
      import('../../../components/dialog/GoalEditDialog.vue')
    ),
    GoalViewDialog: defineAsyncComponent(() =>
      import('../../../components/dialog/GoalViewDialog.vue')
    ),
    GoalTaskLinkDialog: defineAsyncComponent(() =>
      import('../../../components/dialog/GoalTaskLinkDialog.vue')
    )
  },
  setup() {
    const $q = useQuasar();
    const goalStore = useGoalStore();
    const { goals, loading, filteredGoals } = storeToRefs(goalStore);

    // Tab state
    const activeTab = ref('pending');

    // Dialog states
    const showCreateDialog = ref(false);
    const showEditDialog = ref(false);
    const showViewDialog = ref(false);
    const showLinkTasksDialog = ref(false);
    const selectedGoal = ref<GoalData | null>(null);

    // Computed filtered goals based on active tab
    const tabFilteredGoals = computed(() => {
      const status = activeTab.value === 'pending' ? 'PENDING' : 'COMPLETED';
      return goals.value.filter(g => g.status === status);
    });

    // Helper function to check if goal is overdue
    const isGoalOverdue = (goal: GoalData): boolean => {
      if (goal.status !== 'PENDING') return false;
      if (!goal.deadline || !goal.deadline.raw) return false;

      const deadlineDate = new Date(goal.deadline.raw);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      return deadlineDate < today;
    };

    // Helper function to get creator initials
    const getCreatorInitials = (goal: GoalData): string => {
      if (!goal.createdBy) return '?';
      const { firstName, lastName } = goal.createdBy;
      return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
    };

    // Actions
    const openCreateDialog = () => {
      showCreateDialog.value = true;
    };

    const openGoalMenu = (goal: GoalData) => {
      // Menu is handled by q-menu in template
      console.log('Goal menu:', goal);
    };

    const viewGoal = (goal: GoalData) => {
      selectedGoal.value = goal;
      showViewDialog.value = true;
    };

    const editGoal = (goal: GoalData) => {
      selectedGoal.value = goal;
      showEditDialog.value = true;
    };

    const linkTasksToGoal = (goal: GoalData) => {
      selectedGoal.value = goal;
      showLinkTasksDialog.value = true;
    };

    const markAsCompleted = async (goal: GoalData) => {
      $q.dialog({
        title: 'Mark as Completed',
        message: `Are you sure you want to mark "${goal.name}" as completed?`,
        cancel: true,
        persistent: true
      }).onOk(async () => {
        try {
          await goalStore.completeGoal(goal.id);
          // Refresh goals
          await goalStore.fetchGoals();
        } catch (error) {
          console.error('Failed to complete goal:', error);
        }
      });
    };

    const deleteGoal = async (goal: GoalData) => {
      $q.dialog({
        title: 'Delete Goal',
        message: `Are you sure you want to delete "${goal.name}"? This will unlink all associated tasks but will not delete them.`,
        cancel: true,
        persistent: true,
        color: 'negative'
      }).onOk(async () => {
        try {
          await goalStore.deleteGoal(goal.id);
          // Refresh goals
          await goalStore.fetchGoals();
        } catch (error) {
          console.error('Failed to delete goal:', error);
        }
      });
    };

    // Dialog handlers
    const handleGoalCreated = async () => {
      showCreateDialog.value = false;
      // Refresh goals
      await goalStore.fetchGoals();
    };

    const handleGoalUpdated = async () => {
      showEditDialog.value = false;
      selectedGoal.value = null;
      // Refresh goals
      await goalStore.fetchGoals();
    };

    const handleTasksLinked = async () => {
      showLinkTasksDialog.value = false;
      selectedGoal.value = null;
      // Refresh goals
      await goalStore.fetchGoals();
    };

    // Load goals on mount
    onMounted(async () => {
      // Set initial filter to pending
      goalStore.setFilters({ status: 'PENDING' });
      await goalStore.fetchGoals();
    });

    // Watch tab changes to update filter
    const onTabChange = async (tab: string) => {
      const status = tab === 'pending' ? 'PENDING' : 'COMPLETED';
      goalStore.setFilters({ status });
      await goalStore.fetchGoals();
    };

    // Watch activeTab for changes
    const tabWatcher = computed({
      get: () => activeTab.value,
      set: (val) => {
        activeTab.value = val;
        onTabChange(val);
      }
    });

    return {
      // State
      activeTab: tabWatcher,
      loading,
      filteredGoals: tabFilteredGoals,
      showCreateDialog,
      showEditDialog,
      showViewDialog,
      showLinkTasksDialog,
      selectedGoal,

      // Helpers
      isGoalOverdue,
      getCreatorInitials,

      // Actions
      openCreateDialog,
      openGoalMenu,
      viewGoal,
      editGoal,
      linkTasksToGoal,
      markAsCompleted,
      deleteGoal,
      handleGoalCreated,
      handleGoalUpdated,
      handleTasksLinked
    };
  }
});
</script>

<style lang="scss" scoped>
.goal-list-container {
  padding: 16px;

  .goal-view-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;

    .header-left {
      h1 {
        font-size: 24px;
        font-weight: 600;
        margin: 0;
      }
    }
  }

  .goal-tabs {
    :deep(.q-tab) {
      font-weight: 500;
    }
  }

  .goal-tab-panels {
    background: transparent;

    :deep(.q-tab-panel) {
      padding: 16px 0;
    }
  }

  .goal-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 16px;
  }

  .goal-card {
    background: white;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    padding: 16px;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      border-color: var(--q-primary);
      transform: translateY(-2px);
    }

    &.completed {
      opacity: 0.85;
    }

    .goal-card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 12px;

      .goal-name {
        font-size: 16px;
        font-weight: 600;
        flex: 1;
        display: flex;
        align-items: center;
      }
    }

    .goal-description {
      font-size: 14px;
      color: #666;
      margin-bottom: 12px;
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
    }

    .goal-creator {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 12px;
      font-size: 12px;
      color: #757575;

      .creator-avatar {
        font-size: 10px;
        font-weight: 600;
        background: #e0e0e0;
        color: #616161;
      }

      .creator-name {
        font-weight: 500;
      }
    }

    .goal-stats {
      display: flex;
      gap: 16px;
      margin-bottom: 12px;
      font-size: 13px;
      color: #666;

      .stat-item {
        display: flex;
        align-items: center;
        gap: 4px;

        &.overdue {
          background-color: #ffebee;
          padding: 4px 8px;
          border-radius: 4px;
          border: 1px solid #ffcdd2;
        }
      }
    }

    .goal-progress {
      .progress-label {
        display: flex;
        justify-content: space-between;
        font-size: 12px;
        color: #666;
        margin-bottom: 4px;

        .progress-value {
          font-weight: 600;
          color: var(--q-primary);
        }
      }
    }
  }
}

@media (max-width: 768px) {
  .goal-list-container {
    padding: 8px;

    .goal-grid {
      grid-template-columns: 1fr;
    }
  }
}
</style>
