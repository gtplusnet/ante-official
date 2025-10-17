import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { api } from 'src/boot/axios';
import { Notify } from 'quasar';

// Goal data interface matching backend response
export interface GoalData {
  id: number;
  name: string;
  description?: string;
  deadline?: {
    raw: string;
    formatted: string;
  } | null;
  status: 'PENDING' | 'COMPLETED';
  progress: number;
  totalTasks?: number;
  completedTasks?: number;
  createdAt: {
    raw: string;
    formatted: string;
  };
  updatedAt: {
    raw: string;
    formatted: string;
  };
  createdBy: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    image?: string;
  };
  tasks?: any[];
}

// Create goal DTO
export interface CreateGoalData {
  name: string;
  description?: string;
  deadline?: string;
}

// Update goal DTO
export interface UpdateGoalData {
  name?: string;
  description?: string;
  deadline?: string;
  status?: 'PENDING' | 'COMPLETED';
}

// Filter options
export interface GoalFilterOptions {
  status?: 'PENDING' | 'COMPLETED';
  search?: string;
}

export const useGoalStore = defineStore('goal', () => {
  // State
  const goals = ref<GoalData[]>([]);
  const loading = ref(false);
  const error = ref<Error | null>(null);
  const currentGoalId = ref<number | null>(null);
  const filters = ref<GoalFilterOptions>({
    status: 'PENDING' // Default to show pending goals
  });

  // Computed
  const currentGoal = computed(() => {
    if (!currentGoalId.value) return null;
    return goals.value.find(g => g.id === currentGoalId.value) || null;
  });

  const pendingGoals = computed(() => {
    return goals.value.filter(g => g.status === 'PENDING');
  });

  const completedGoals = computed(() => {
    return goals.value.filter(g => g.status === 'COMPLETED');
  });

  const filteredGoals = computed(() => {
    let filtered = [...goals.value];

    // Apply status filter
    if (filters.value.status) {
      filtered = filtered.filter(g => g.status === filters.value.status);
    }

    // Apply search filter
    if (filters.value.search) {
      const searchLower = filters.value.search.toLowerCase();
      filtered = filtered.filter(g =>
        g.name.toLowerCase().includes(searchLower) ||
        g.description?.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  });

  // Actions - State Management
  const setGoals = (newGoals: GoalData[]) => {
    goals.value = [...newGoals];
  };

  const addGoal = (goal: GoalData) => {
    goals.value = [goal, ...goals.value];
  };

  const updateGoal = (goalId: number, updates: Partial<GoalData>) => {
    const index = goals.value.findIndex(g => g.id === goalId);
    if (index !== -1) {
      const updatedGoals = [...goals.value];
      updatedGoals[index] = { ...updatedGoals[index], ...updates };
      goals.value = updatedGoals;
    }
  };

  const removeGoal = (goalId: number) => {
    goals.value = goals.value.filter(g => g.id !== goalId);
  };

  const setCurrentGoal = (goalId: number | null) => {
    currentGoalId.value = goalId;
  };

  const setFilters = (newFilters: Partial<GoalFilterOptions>) => {
    filters.value = { ...filters.value, ...newFilters };
  };

  // Actions - API Operations
  const fetchGoals = async (filterOptions?: GoalFilterOptions) => {
    try {
      loading.value = true;
      error.value = null;

      const params: any = {};
      const appliedFilters = filterOptions || filters.value;

      if (appliedFilters.status) {
        params.status = appliedFilters.status;
      }

      if (appliedFilters.search) {
        params.search = appliedFilters.search;
      }

      console.log('[GoalStore] Fetching goals with params:', params);

      const response = await api.get('/task/goal', { params });

      if (response.data) {
        setGoals(response.data);
        return response.data;
      }

      return [];
    } catch (err) {
      error.value = err as Error;
      console.error('[GoalStore] Failed to fetch goals:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const fetchGoalById = async (goalId: number): Promise<GoalData | null> => {
    try {
      loading.value = true;
      error.value = null;

      console.log('[GoalStore] Fetching goal:', goalId);

      const response = await api.get(`/task/goal/${goalId}`);

      if (response.data) {
        // Update goal in store if it exists
        const index = goals.value.findIndex(g => g.id === goalId);
        if (index !== -1) {
          updateGoal(goalId, response.data);
        }
        return response.data;
      }

      return null;
    } catch (err) {
      error.value = err as Error;
      console.error('[GoalStore] Failed to fetch goal:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const fetchGoalProgress = async (goalId: number) => {
    try {
      loading.value = true;
      error.value = null;

      console.log('[GoalStore] Fetching goal progress:', goalId);

      const response = await api.get(`/task/goal/${goalId}/progress`);

      if (response.data) {
        return response.data;
      }

      return null;
    } catch (err) {
      error.value = err as Error;
      console.error('[GoalStore] Failed to fetch goal progress:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const createGoal = async (goalData: CreateGoalData): Promise<GoalData | null> => {
    try {
      loading.value = true;
      error.value = null;

      console.log('[GoalStore] Creating goal:', goalData);

      const response = await api.post('/task/goal/create', goalData);

      if (response.data) {
        addGoal(response.data);

        Notify.create({
          type: 'positive',
          message: 'Goal created successfully',
          position: 'top',
          timeout: 2000
        });

        return response.data;
      }

      return null;
    } catch (err) {
      error.value = err as Error;
      console.error('[GoalStore] Failed to create goal:', err);

      Notify.create({
        type: 'negative',
        message: 'Failed to create goal',
        position: 'top',
        timeout: 3000
      });

      throw err;
    } finally {
      loading.value = false;
    }
  };

  const updateGoalInDB = async (goalId: number, updates: UpdateGoalData): Promise<GoalData | null> => {
    // Store original goal for rollback
    const originalGoal = goals.value.find(g => g.id === goalId);
    const originalValues: Partial<GoalData> = {};

    if (originalGoal) {
      Object.keys(updates).forEach(key => {
        originalValues[key as keyof GoalData] = originalGoal[key as keyof GoalData];
      });
    }

    // Optimistic update
    updateGoal(goalId, updates as Partial<GoalData>);

    try {
      console.log('[GoalStore] Updating goal:', goalId, updates);

      const response = await api.put(`/task/goal/${goalId}`, updates);

      if (response.data) {
        // Sync with backend response
        updateGoal(goalId, response.data);

        Notify.create({
          type: 'positive',
          message: 'Goal updated successfully',
          position: 'top',
          timeout: 2000
        });

        return response.data;
      }

      return null;
    } catch (err) {
      // Rollback on failure
      updateGoal(goalId, originalValues);

      error.value = err as Error;
      console.error('[GoalStore] Failed to update goal:', err);

      Notify.create({
        type: 'negative',
        message: 'Failed to update goal. Changes reverted.',
        position: 'top',
        timeout: 3000
      });

      throw err;
    } finally {
      loading.value = false;
    }
  };

  const completeGoal = async (goalId: number): Promise<GoalData | null> => {
    // Store original status for rollback
    const originalGoal = goals.value.find(g => g.id === goalId);
    const originalStatus = originalGoal?.status;

    // Optimistic update
    updateGoal(goalId, { status: 'COMPLETED' });

    try {
      console.log('[GoalStore] Completing goal:', goalId);

      const response = await api.put(`/task/goal/${goalId}/complete`);

      if (response.data) {
        // Sync with backend response
        updateGoal(goalId, response.data);

        Notify.create({
          type: 'positive',
          message: 'Goal marked as completed',
          position: 'top',
          timeout: 2000
        });

        return response.data;
      }

      return null;
    } catch (err) {
      // Rollback on failure
      if (originalStatus) {
        updateGoal(goalId, { status: originalStatus });
      }

      error.value = err as Error;
      console.error('[GoalStore] Failed to complete goal:', err);

      Notify.create({
        type: 'negative',
        message: 'Failed to complete goal. Changes reverted.',
        position: 'top',
        timeout: 3000
      });

      throw err;
    } finally {
      loading.value = false;
    }
  };

  const deleteGoal = async (goalId: number): Promise<void> => {
    // Store the goal for potential rollback
    const goalToDelete = goals.value.find(g => g.id === goalId);
    const goalIndex = goals.value.findIndex(g => g.id === goalId);

    if (!goalToDelete) {
      console.error('[GoalStore] Goal not found:', goalId);
      return;
    }

    // Optimistic delete
    removeGoal(goalId);

    try {
      console.log('[GoalStore] Deleting goal:', goalId);

      await api.delete(`/task/goal/${goalId}`);

      Notify.create({
        type: 'positive',
        message: 'Goal deleted successfully',
        position: 'top',
        timeout: 2000
      });
    } catch (err) {
      // Rollback on failure
      if (goalIndex >= 0 && goalIndex < goals.value.length) {
        const newGoals = [...goals.value];
        newGoals.splice(goalIndex, 0, goalToDelete);
        goals.value = newGoals;
      } else {
        goals.value = [...goals.value, goalToDelete];
      }

      error.value = err as Error;
      console.error('[GoalStore] Failed to delete goal:', err);

      Notify.create({
        type: 'negative',
        message: 'Failed to delete goal. Goal restored.',
        position: 'top',
        timeout: 3000
      });

      throw err;
    }
  };

  const linkTaskToGoal = async (goalId: number, taskId: number): Promise<void> => {
    try {
      loading.value = true;
      error.value = null;

      console.log('[GoalStore] Linking task to goal:', { goalId, taskId });

      await api.put('/task/goal/link-task', { goalId, taskId });

      // Refresh the goal to get updated task count and progress
      await fetchGoalById(goalId);

      Notify.create({
        type: 'positive',
        message: 'Task linked to goal successfully',
        position: 'top',
        timeout: 2000
      });
    } catch (err) {
      error.value = err as Error;
      console.error('[GoalStore] Failed to link task to goal:', err);

      Notify.create({
        type: 'negative',
        message: 'Failed to link task to goal',
        position: 'top',
        timeout: 3000
      });

      throw err;
    } finally {
      loading.value = false;
    }
  };

  const linkMultipleTasksToGoal = async (goalId: number, taskIds: number[]): Promise<void> => {
    try {
      loading.value = true;
      error.value = null;

      console.log('[GoalStore] Linking multiple tasks to goal:', { goalId, taskIds });

      await api.put('/task/goal/link-tasks', { goalId, taskIds });

      // Refresh the goal to get updated task count and progress
      await fetchGoalById(goalId);

      Notify.create({
        type: 'positive',
        message: `${taskIds.length} task(s) linked to goal successfully`,
        position: 'top',
        timeout: 2000
      });
    } catch (err) {
      error.value = err as Error;
      console.error('[GoalStore] Failed to link multiple tasks to goal:', err);

      Notify.create({
        type: 'negative',
        message: 'Failed to link tasks to goal',
        position: 'top',
        timeout: 3000
      });

      throw err;
    } finally {
      loading.value = false;
    }
  };

  const unlinkTaskFromGoal = async (taskId: number): Promise<void> => {
    try {
      loading.value = true;
      error.value = null;

      console.log('[GoalStore] Unlinking task from goal:', taskId);

      await api.put('/task/goal/unlink-task', { taskId });

      // Refresh all goals to update task counts
      await fetchGoals();

      Notify.create({
        type: 'positive',
        message: 'Task unlinked from goal successfully',
        position: 'top',
        timeout: 2000
      });
    } catch (err) {
      error.value = err as Error;
      console.error('[GoalStore] Failed to unlink task from goal:', err);

      Notify.create({
        type: 'negative',
        message: 'Failed to unlink task from goal',
        position: 'top',
        timeout: 3000
      });

      throw err;
    } finally {
      loading.value = false;
    }
  };

  return {
    // State
    goals,
    loading,
    error,
    currentGoalId,
    filters,

    // Computed
    currentGoal,
    pendingGoals,
    completedGoals,
    filteredGoals,

    // State Actions
    setGoals,
    addGoal,
    updateGoal,
    removeGoal,
    setCurrentGoal,
    setFilters,

    // API Actions
    fetchGoals,
    fetchGoalById,
    fetchGoalProgress,
    createGoal,
    updateGoalInDB,
    completeGoal,
    deleteGoal,
    linkTaskToGoal,
    linkMultipleTasksToGoal,
    unlinkTaskFromGoal
  };
});
