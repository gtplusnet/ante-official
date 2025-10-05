<template>
  <div class="project-overview-container">
    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <q-spinner-dots size="50px" color="primary" />
      <div class="text-body1 text-grey-7 q-mt-md">Loading project details...</div>
    </div>

    <!-- Content -->
    <div v-else>
      <!-- Dashboard Counters (Metrics) - Top Priority -->
      <div class="metrics-row">
        <ProjectMetrics :projectData="projectData" />
      </div>


      <!-- Row 2: Timeline, Budget, Financial -->
      <div class="cards-row">
        <div class="card-item flex-2">
          <GlobalWidgetCard>
            <template #title>Timeline</template>
            <template #content>
              <ProjectTimelineCard :projectData="projectData" />
            </template>
          </GlobalWidgetCard>
        </div>
        <div class="card-item flex-2">
          <GlobalWidgetCard>
            <template #title>Budget</template>
            <template #content>
              <ProjectBudgetCard :projectData="projectData" />
            </template>
          </GlobalWidgetCard>
        </div>
        <div class="card-item flex-3">
          <GlobalWidgetCard>
            <template #title>Financial Standing</template>
            <template #content>
              <FinancialStandingPartial :hideWrapper="true" />
            </template>
          </GlobalWidgetCard>
        </div>
      </div>

      <!-- Row 3: Tasks and Schedule -->
      <div class="cards-row">
        <!-- Combined Task Statistics and Recent Tasks -->
        <div class="card-item" style="flex: 2;">
          <GlobalWidgetCard>
            <template #title>
              <div class="row items-center no-wrap">
                <span>Task Statistics</span>
              </div>
            </template>
            <template #actions>
              <div class="row items-center gap-xs">
                <q-btn
                  flat
                  dense
                  no-caps
                  label="Task Management"
                  icon="task_alt"
                  size="sm"
                  color="primary"
                  @click="showTaskManagementDialog = true"
                >
                  <q-tooltip>Open Task Management</q-tooltip>
                </q-btn>
                <q-btn
                  flat
                  dense
                  no-caps
                  label="Recent Tasks"
                  icon="list"
                  size="sm"
                  @click="navigateToTasks"
                >
                  <q-badge v-if="recentTasks.length > 0" color="primary" floating>{{ recentTasks.length }}</q-badge>
                </q-btn>
                <q-btn
                  flat
                  dense
                  no-caps
                  label="View All"
                  size="sm"
                  @click="navigateToTasks"
                />
                <q-btn
                  flat
                  dense
                  round
                  icon="refresh"
                  size="sm"
                  @click="fetchTasks"
                  :loading="tasksLoading"
                >
                  <q-tooltip>Refresh tasks</q-tooltip>
                </q-btn>
              </div>
            </template>
            <template #content>
              <div class="task-statistics-combined">
                <TaskStatsCard
                  :taskCounts="taskCounts"
                  :loading="tasksLoading"
                  @refresh="fetchTasks"
                  @add-task="handleAddTask"
                />
                <div class="recent-tasks-section">
                  <RecentTasksCard
                    :tasks="recentTasks"
                    :loading="tasksLoading"
                    @view-all="navigateToTasks"
                    @task-click="handleTaskClick"
                    @add-task="handleAddTask"
                  />
                </div>
              </div>
            </template>
          </GlobalWidgetCard>
        </div>
        <!-- Progress Schedule -->
        <div class="card-item" style="flex: 3;">
          <GlobalWidgetCard>
            <template #title>Progress Schedule</template>
            <template #content>
              <ProjectScheduleWidget :chartHeight="280" :hideWrapper="true" />
            </template>
          </GlobalWidgetCard>
        </div>
      </div>

      <!-- Row 4: Team, Activity and Files -->
      <div class="cards-row bottom-widgets-row">
        <!-- Team Overview -->
        <div class="card-item">
          <GlobalWidgetCard>
            <template #title>Team Overview</template>
            <template #content>
              <div class="team-widget-content">
                <div v-if="projectData?.personInCharge" class="team-lead">
                  <q-avatar size="36px" color="primary" text-color="white">
                    {{ getInitials(projectData.personInCharge) }}
                  </q-avatar>
                  <div class="team-lead-info">
                    <div class="text-body2 text-weight-medium">
                      {{ getFullName(projectData.personInCharge) }}
                    </div>
                    <div class="text-caption text-grey-6">Project Lead</div>
                  </div>
                </div>
                <div class="team-stats">
                  <q-icon name="groups" size="48px" color="grey-4" />
                  <div class="text-h5 text-weight-bold q-mt-sm">{{ teamMemberCount || 0 }}</div>
                  <div class="text-caption text-grey-6">team members</div>
                </div>
              </div>
            </template>
          </GlobalWidgetCard>
        </div>

        <!-- Activity Feed -->
        <div class="card-item">
          <GlobalWidgetCard>
            <template #title>Recent Activity</template>
            <template #content>
              <div class="activity-widget-content">
                <q-icon name="history" size="48px" color="grey-4" />
                <div class="text-body1 text-grey-6 q-mt-md">Activity feed coming soon</div>
                <div class="text-caption text-grey-5">Track project updates and changes</div>
              </div>
            </template>
          </GlobalWidgetCard>
        </div>

        <!-- Files Widget -->
        <div class="card-item">
          <GlobalWidgetCard>
            <template #title>Project Files</template>
            <template #content>
              <div class="files-widget-content">
                <q-icon name="folder_open" size="48px" color="grey-4" />
                <div class="text-body2 text-grey-6 q-mt-md">No files uploaded</div>
                <q-btn
                  unelevated
                  color="primary"
                  icon="upload"
                  label="Upload"
                  no-caps
                  size="sm"
                  class="q-mt-md upload-btn"
                />
              </div>
            </template>
          </GlobalWidgetCard>
        </div>
      </div>
    </div>

    <!-- Task Management Dialog -->
    <TaskManagementDialog
      v-if="projectData?.id"
      v-model="showTaskManagementDialog"
      :projectId="projectData.id"
      :projectName="projectData.name || 'Project'"
      filter="all"
    />
  </div>
</template>

<script>
import { defineComponent, ref, onMounted, computed, defineAsyncComponent } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useProjectDetails } from '../../../../composables/useProjectDetails';
import supabaseService from '../../../../services/supabase';

// Global Widget Components
import GlobalWidgetCard from '../../../../components/shared/global/GlobalWidgetCard.vue';

// Card Widgets
import ProjectTimelineCard from './Widgets/ProjectTimelineCard.vue';
import ProjectBudgetCard from './Widgets/ProjectBudgetCard.vue';
import TaskStatsCard from './Widgets/TaskStatsCard.vue';
import RecentTasksCard from './Widgets/RecentTasksCard.vue';

// Original Widgets
import ProjectMetrics from './Widgets/ProjectMetrics.vue';
import FinancialStandingPartial from './Partials/FinancialStanding/FinancialStandingPartial.vue';
import ProjectScheduleWidget from '../../Dashboard/ProjectScheduleWidget/ProjectScheduleWidget.vue';

// Lazy-loaded dialogs (ALL dialogs must be lazy loaded - CLAUDE.md)
const TaskManagementDialog = defineAsyncComponent(() =>
  import('../../../../components/dialog/TaskManagementDialog/TaskManagementDialog.vue')
);

export default defineComponent({
  name: 'ProjectOverview',
  components: {
    // Global Widget Components
    GlobalWidgetCard,
    // Card Widgets
    ProjectTimelineCard,
    ProjectBudgetCard,
    TaskStatsCard,
    RecentTasksCard,
    // Original Widgets
    ProjectMetrics,
    FinancialStandingPartial,
    ProjectScheduleWidget,
    TaskManagementDialog
  },

  setup() {
    const route = useRoute();
    const router = useRouter();
    const { projectData, loading, fetchProjectDetails } = useProjectDetails();

    // Dialog state
    const showTaskManagementDialog = ref(false);

    const tasksLoading = ref(false);
    const tasks = ref([]);
    const teamMemberCount = ref(0);

    const taskCounts = computed(() => {
      const todo = tasks.value.filter(t => !t.isDone && !t.isInProgress).length;
      const inProgress = tasks.value.filter(t => t.isInProgress && !t.isDone).length;
      const done = tasks.value.filter(t => t.isDone).length;
      return { todo, inProgress, done };
    });

    const recentTasks = computed(() => {
      return tasks.value
        .slice(0, 5)
        .map(task => ({
          ...task,
          assignee: task.Account ?
            `${task.Account.firstName} ${task.Account.lastName}` :
            null
        }));
    });

    const fetchTasks = async () => {
      if (!projectData.value?.id) return;

      tasksLoading.value = true;
      try {
        const { data, error } = await supabaseService.getClient()
          .from('Task')
          .select(`
            id,
            title,
            priorityLevel,
            createdAt,
            projectId,
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
          .eq('projectId', projectData.value.id)
          .eq('isDeleted', false)
          .order('createdAt', { ascending: false })
          .limit(20);

        if (!error && data) {
          // Map data to include isDone and isInProgress for compatibility
          tasks.value = data.map(task => ({
            ...task,
            isDone: task.boardLane?.key === 'DONE',
            isInProgress: task.boardLane?.key === 'IN_PROGRESS',
            priority: task.priorityLevel === 3 ? 'high' : task.priorityLevel === 2 ? 'medium' : 'low'
          }));
        }
      } catch (err) {
        console.error('Error fetching tasks:', err);
      } finally {
        tasksLoading.value = false;
      }
    };

    const fetchTeamSize = async () => {
      if (!projectData.value?.id) return;

      try {
        const { count, error } = await supabaseService.getClient()
          .from('EmployeeData')
          .select('accountId', { count: 'exact', head: true })
          .eq('branchId', projectData.value.id)
          .eq('isActive', true);

        if (!error && count !== null) {
          teamMemberCount.value = count;
        }
      } catch (err) {
        console.error('Error fetching team size:', err);
      }
    };

    const handleAddTask = () => {
      router.push(`/member/tasks/create?projectId=${route.params.id}`);
    };

    const navigateToTasks = () => {
      router.push(`/member/tasks?projectId=${route.params.id}`);
    };

    const handleTaskClick = (task) => {
      router.push(`/member/tasks/${task.id}`);
    };

    const getInitials = (person) => {
      if (!person) return '';
      const first = person.firstName?.[0] || '';
      const last = person.lastName?.[0] || '';
      return (first + last).toUpperCase();
    };

    const getFullName = (person) => {
      if (!person) return 'Unknown';
      return `${person.firstName || ''} ${person.lastName || ''}`.trim();
    };

    onMounted(async () => {
      const projectId = route.params.id;
      if (projectId) {
        await fetchProjectDetails(projectId);
        await Promise.all([
          fetchTasks(),
          fetchTeamSize()
        ]);
      }
    });

    return {
      projectData,
      loading,
      tasksLoading,
      taskCounts,
      recentTasks,
      teamMemberCount,
      fetchTasks,
      handleAddTask,
      navigateToTasks,
      handleTaskClick,
      getInitials,
      getFullName,
      showTaskManagementDialog
    };
  }
});
</script>

<style lang="scss" scoped>
.project-overview-container {
  width: 100%;

  .loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 400px;
  }

  .cards-row {
    display: flex;
    gap: 20px;
    margin-bottom: 20px;

    @media (max-width: 1200px) {
      flex-wrap: wrap;
      gap: 16px;
      margin-bottom: 16px;
    }

    @media (max-width: 768px) {
      flex-direction: column;
      gap: 16px;
    }

    .card-item {
      min-width: 0;
      display: flex;

      &.flex-1 { flex: 1; }
      &.flex-2 { flex: 2; }
      &.flex-3 { flex: 3; }

      @media (max-width: 1200px) {
        &.flex-1,
        &.flex-2,
        &.flex-3 {
          flex: 1 1 calc(50% - 8px);
        }
      }

      @media (max-width: 768px) {
        &.flex-1,
        &.flex-2,
        &.flex-3 {
          flex: 1 1 100%;
        }
      }

      // Ensure GlobalWidgetCard takes full width
      :deep(.global-widget-card) {
        width: 100%;
      }
    }
  }

  // Combined task statistics and recent tasks layout
  .task-statistics-combined {
    display: flex;
    gap: 16px;
    height: 100%;

    > div:first-child {
      flex: 1;
      min-width: 0;
    }

    .recent-tasks-section {
      flex: 1.5;
      min-width: 0;
      display: flex;
      flex-direction: column;
    }

    @media (max-width: 1200px) {
      flex-direction: column;
      gap: 12px;

      > div:first-child,
      .recent-tasks-section {
        flex: 1;
      }
    }
  }

  // Metrics row styling
  .metrics-row {
    margin-bottom: 20px;

    @media (max-width: 1200px) {
      margin-bottom: 16px;
    }
  }

  // Bottom widgets row - even distribution
  .bottom-widgets-row {
    .card-item {
      flex: 1 !important;

      @media (max-width: 1200px) {
        flex: 1 1 calc(33.333% - 14px) !important;
      }

      @media (max-width: 768px) {
        flex: 1 1 100% !important;
      }
    }
  }

  // Bottom row widget styling
  .team-widget-content {
    min-height: 140px;
    display: flex;
    flex-direction: column;
    gap: 16px;

    .team-lead {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px;
      background: linear-gradient(135deg, #F5F5F5 0%, #EEEEEE 100%);
      border-radius: 8px;

      .team-lead-info {
        flex: 1;
      }
    }

    .team-stats {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 16px;
      text-align: center;
    }
  }

  .activity-widget-content {
    min-height: 140px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 20px;
    text-align: center;
  }

  .files-widget-content {
    min-height: 140px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 20px;
    text-align: center;

    .upload-btn {
      padding: 6px 20px;
    }
  }
}

// Apply MD3 dense styling to all cards
:deep(.q-card) {
  box-shadow: none !important;
  border: 1px solid var(--md-sys-color-outline-variant);
  border-radius: 8px;
}

:deep(.q-card-section) {
  padding: 12px !important;
}
</style>