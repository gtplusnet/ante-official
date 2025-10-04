<template>
  <div class="project-metrics-container">
    <GlobalWidgetCounter
      icon="account_balance_wallet"
      icon-color="var(--q-primary)"
      :value="budgetHealthDisplay"
      label="Budget Health"
      card-class="dashboard-card-1"
      :loading="loading"
    />
    <GlobalWidgetCounter
      icon="schedule"
      icon-color="var(--q-secondary)"
      :value="daysToDeadlineDisplay"
      label="Days to Deadline"
      card-class="dashboard-card-2"
      :loading="loading"
    />
    <GlobalWidgetCounter
      icon="task_alt"
      icon-color="var(--q-accent)"
      :value="taskProgressDisplay"
      label="Task Progress"
      card-class="dashboard-card-3"
      :loading="loading"
    />
    <GlobalWidgetCounter
      icon="groups"
      icon-color="#9333ea"
      :value="teamSizeDisplay"
      label="Team Members"
      card-class="leaves-card"
      :loading="loading"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, ref, PropType, onMounted } from 'vue';
import { ProjectDataResponse } from '@shared/response';
import GlobalWidgetCounter from '../../../../../components/shared/global/GlobalWidgetCounter.vue';
import supabaseService from '../../../../../services/supabase';

export default defineComponent({
  name: 'ProjectMetrics',
  components: {
    GlobalWidgetCounter
  },
  props: {
    projectData: {
      type: Object as PropType<ProjectDataResponse | null>,
      default: null
    }
  },
  setup(props) {
    const loading = ref(false);
    const taskStats = ref({ total: 0, completed: 0 });
    const teamSize = ref(0);

    // Budget Health
    const budgetHealthDisplay = computed(() => {
      if (!props.projectData?.budget) return 'No Budget';

      const budget = props.projectData.budget;
      const collected = props.projectData.totalCollected || 0;
      const remaining = budget - collected;
      const percentage = Math.round((remaining / budget) * 100);

      if (percentage < 0) return 'Over Budget';
      return `${percentage}%`;
    });

    // Days to Deadline
    const daysToDeadlineDisplay = computed(() => {
      if (!props.projectData?.endDate) return 'No Deadline';

      const end = new Date(props.projectData.endDate);
      const now = new Date();
      const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      if (diff < 0) return `${Math.abs(diff)} Overdue`;
      if (diff === 0) return 'Due Today';
      if (diff === 1) return '1 Day';
      return `${diff} Days`;
    });

    // Task Progress
    const taskProgressDisplay = computed(() => {
      if (taskStats.value.total === 0) return 'No Tasks';
      const percentage = Math.round((taskStats.value.completed / taskStats.value.total) * 100);
      return `${percentage}%`;
    });

    // Team Size
    const teamSizeDisplay = computed(() => {
      if (teamSize.value === 0) return 'No Team';
      if (teamSize.value === 1) return '1 Member';
      return `${teamSize.value} Members`;
    });

    // Fetch task statistics
    const fetchTaskStats = async () => {
      if (!props.projectData?.id) return;

      try {
        // Count tasks by status for this project
        const { data, error } = await supabaseService.getClient()
          .from('Task')
          .select(`
            id,
            boardLane:boardLaneId (
              id,
              key
            )
          `)
          .eq('projectId', props.projectData.id)
          .eq('isDeleted', false);

        if (!error && data) {
          taskStats.value = {
            total: data.length,
            completed: data.filter(task => task.boardLane?.key === 'DONE').length
          };
        }
      } catch (err) {
        console.error('Error fetching task stats:', err);
      }
    };

    // Fetch team size
    const fetchTeamSize = async () => {
      if (!props.projectData?.id) return;

      try {
        // Count employees assigned to this project
        const { count, error } = await supabaseService.getClient()
          .from('EmployeeData')
          .select('accountId', { count: 'exact', head: true })
          .eq('branchId', props.projectData.id)
          .eq('isActive', true);

        if (!error && count !== null) {
          teamSize.value = count;
        }
      } catch (err) {
        console.error('Error fetching team size:', err);
      }
    };

    onMounted(async () => {
      if (props.projectData?.id) {
        loading.value = true;
        await Promise.all([
          fetchTaskStats(),
          fetchTeamSize()
        ]);
        loading.value = false;
      }
    });

    return {
      loading,
      budgetHealthDisplay,
      daysToDeadlineDisplay,
      taskProgressDisplay,
      teamSizeDisplay
    };
  }
});
</script>

<style scoped lang="scss">
.project-metrics-container {
  display: flex;
  flex-wrap: wrap;
  gap: 25px;

  @media (max-width: 1200px) {
    gap: 20px;
  }

  @media (max-width: 768px) {
    gap: 16px;
  }

  @media (max-width: 480px) {
    flex-direction: column;
  }
}

// The leaves-card style if not already in GlobalWidgetCounter
.leaves-card {
  background-image: url('../../../../../assets/img/card1.webp');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-color: #DEF0FF;
}
</style>