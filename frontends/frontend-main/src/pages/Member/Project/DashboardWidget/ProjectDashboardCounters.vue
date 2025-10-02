<template>
  <div class="dashboard-card-container">
    <GlobalWidgetCounter
      icon="folder"
      icon-color="var(--q-primary)"
      :value="totalProjectsDisplay"
      label="Total Projects"
      card-class="dashboard-card-1"
      :loading="loading"
      :clickable="true"
      @click="handleTotalProjectsClick"
    />
    <GlobalWidgetCounter
      icon="pending"
      icon-color="var(--q-secondary)"
      :value="inProgressDisplay"
      label="In Progress"
      card-class="dashboard-card-2"
      :loading="loading"
      :clickable="true"
      @click="handleInProgressClick"
    />
    <GlobalWidgetCounter
      icon="check_circle"
      icon-color="var(--q-positive)"
      :value="completedDisplay"
      label="Completed"
      card-class="dashboard-card-3"
      :loading="loading"
      :clickable="true"
      @click="handleCompletedClick"
    />
    <GlobalWidgetCounter
      icon="account_balance_wallet"
      icon-color="#9333ea"
      :value="totalBudgetDisplay"
      label="Total Budget"
      card-class="budget-card"
      :loading="loading"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted, onUnmounted } from 'vue';
import GlobalWidgetCounter from '../../../../components/shared/global/GlobalWidgetCounter.vue';
import supabaseService from '../../../../services/supabase';

interface ProjectStats {
  totalProjects: number;
  inProgress: number;
  completed: number;
  totalBudget: number;
}

export default defineComponent({
  name: 'ProjectDashboardCounters',
  components: {
    GlobalWidgetCounter,
  },
  setup() {
    const loading = ref(false);
    const error = ref<string | null>(null);
    const projectStats = ref<ProjectStats>({
      totalProjects: 0,
      inProgress: 0,
      completed: 0,
      totalBudget: 0,
    });

    // Display computed properties
    const totalProjectsDisplay = computed(() => {
      const count = projectStats.value.totalProjects;
      if (count === 0) return '0';
      return count.toString();
    });

    const inProgressDisplay = computed(() => {
      const count = projectStats.value.inProgress;
      if (count === 0) return '0';
      return count.toString();
    });

    const completedDisplay = computed(() => {
      const count = projectStats.value.completed;
      if (count === 0) return '0';
      return count.toString();
    });

    const totalBudgetDisplay = computed(() => {
      const budget = projectStats.value.totalBudget;
      if (budget === 0) return '₱0';

      // Format as currency
      if (budget >= 1000000) {
        return `₱${(budget / 1000000).toFixed(1)}M`;
      } else if (budget >= 1000) {
        return `₱${(budget / 1000).toFixed(0)}K`;
      }
      return `₱${budget.toLocaleString()}`;
    });

    const fetchProjectStats = async () => {
      loading.value = true;
      try {
        // Fetch all projects with their status and budget
        const { data: projects, error: fetchError } = await supabaseService.getClient()
          .from('Project')
          .select('id, status, projectBoardStage, budget, isDeleted, isLead')
          .eq('isDeleted', false)
          .eq('isLead', false)
          .eq('status', 'PROJECT');

        if (fetchError) {
          console.error('Error fetching project stats:', fetchError);
          error.value = 'Failed to fetch project statistics';
          return;
        }

        if (projects) {
          // Calculate statistics
          const stats: ProjectStats = {
            totalProjects: projects.length,
            inProgress: 0,
            completed: 0,
            totalBudget: 0,
          };

          projects.forEach(project => {
            // Count by stage/status
            const stage = project.projectBoardStage || '';
            if (stage === 'in_progress' || stage === 'active' || stage === 'ACTIVE') {
              stats.inProgress++;
            } else if (stage === 'completed' || stage === 'COMPLETED' || stage === 'done') {
              stats.completed++;
            }

            // Sum budgets
            if (project.budget) {
              stats.totalBudget += Number(project.budget);
            }
          });

          projectStats.value = stats;
        }

        error.value = null;
      } catch (err: any) {
        error.value = err.message || 'Failed to fetch project statistics';
        console.error('Error in fetchProjectStats:', err);
      } finally {
        loading.value = false;
      }
    };

    // Click handlers
    const handleTotalProjectsClick = () => {
      // Future implementation: Show all projects or navigate to filtered view
      console.log('Total projects clicked');
    };

    const handleInProgressClick = () => {
      // Future implementation: Show in-progress projects
      console.log('In progress clicked');
    };

    const handleCompletedClick = () => {
      // Future implementation: Show completed projects
      console.log('Completed clicked');
    };

    // Lifecycle
    let refreshInterval: NodeJS.Timeout;

    onMounted(() => {
      // Initial fetch
      fetchProjectStats();

      // Refresh data every 5 minutes
      refreshInterval = setInterval(fetchProjectStats, 5 * 60 * 1000);
    });

    onUnmounted(() => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    });

    return {
      loading,
      error,
      totalProjectsDisplay,
      inProgressDisplay,
      completedDisplay,
      totalBudgetDisplay,
      handleTotalProjectsClick,
      handleInProgressClick,
      handleCompletedClick,
    };
  },
});
</script>

<style scoped lang="scss">
.dashboard-card-container {
  display: flex;
  flex-wrap: wrap;
  gap: 25px;
  margin-bottom: 25px;

  @media (max-width: 1200px) {
    gap: 20px;
    margin-bottom: 20px;
  }

  @media (max-width: 768px) {
    gap: 16px;
    margin-bottom: 16px;
  }
}

.budget-card {
  background-image: url('../../../../assets/img/card1.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-color: #F3E5F5;
}
</style>