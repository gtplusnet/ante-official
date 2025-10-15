import { ref, watch, toValue } from 'vue';
import { api } from 'src/boot/axios';

export interface GoalAPIFilters {
  status?: 'PENDING' | 'COMPLETED';
  search?: string;
}

export interface GoalAPIOptions {
  filters?: GoalAPIFilters;
  autoFetch?: boolean;
}

export interface Goal {
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

/**
 * Composable for fetching goals from backend API
 *
 * @param options - Configuration options for fetching goals
 * @returns Goal data, loading state, and refetch function
 */
export function useGoalAPI(options: GoalAPIOptions = {}) {
  const {
    filters = {},
    autoFetch = true
  } = options;

  const data = ref<Goal[]>([]);
  const loading = ref(false);
  const error = ref<Error | null>(null);

  /**
   * Fetch goals from backend API
   * Uses GET /task/goal endpoint with filters
   */
  const fetchGoals = async () => {
    loading.value = true;
    error.value = null;

    try {
      console.log('[useGoalAPI] Fetching goals with filters:', filters);

      // Build query parameters based on filters
      const params: any = {};

      if (filters.status) {
        params.status = filters.status;
      }

      if (filters.search) {
        params.search = filters.search;
      }

      console.log('[useGoalAPI] API request params:', params);

      // Call backend API
      const response = await api.get('/task/goal', { params });

      data.value = response.data || [];

      console.log('[useGoalAPI] Fetched', data.value.length, 'goals');
    } catch (err: any) {
      console.error('[useGoalAPI] Error fetching goals:', err);
      error.value = err;
      data.value = [];
    } finally {
      loading.value = false;
    }
  };

  /**
   * Refetch goals manually
   */
  const refetch = async () => {
    await fetchGoals();
  };

  /**
   * Get single goal by ID
   */
  const getGoalById = async (id: number): Promise<Goal | null> => {
    try {
      console.log('[useGoalAPI] Fetching goal:', id);
      const response = await api.get(`/task/goal/${id}`);
      return response.data;
    } catch (err: any) {
      console.error('[useGoalAPI] Error fetching goal:', err);
      throw err;
    }
  };

  /**
   * Create a new goal
   */
  const createGoal = async (goalData: {
    name: string;
    description?: string;
    deadline?: string;
  }): Promise<Goal> => {
    try {
      console.log('[useGoalAPI] Creating goal:', goalData);
      const response = await api.post('/task/goal/create', goalData);
      await refetch(); // Refresh list after creation
      return response.data;
    } catch (err: any) {
      console.error('[useGoalAPI] Error creating goal:', err);
      throw err;
    }
  };

  /**
   * Update an existing goal
   */
  const updateGoal = async (id: number, goalData: {
    name?: string;
    description?: string;
    deadline?: string;
    status?: 'PENDING' | 'COMPLETED';
  }): Promise<Goal> => {
    try {
      console.log('[useGoalAPI] Updating goal:', id, goalData);
      const response = await api.put(`/task/goal/${id}`, goalData);
      await refetch(); // Refresh list after update
      return response.data;
    } catch (err: any) {
      console.error('[useGoalAPI] Error updating goal:', err);
      throw err;
    }
  };

  /**
   * Mark goal as completed
   */
  const completeGoal = async (id: number): Promise<Goal> => {
    try {
      console.log('[useGoalAPI] Completing goal:', id);
      const response = await api.put(`/task/goal/${id}/complete`);
      await refetch(); // Refresh list after completion
      return response.data;
    } catch (err: any) {
      console.error('[useGoalAPI] Error completing goal:', err);
      throw err;
    }
  };

  /**
   * Delete a goal (soft delete, unlinks all tasks)
   */
  const deleteGoal = async (id: number): Promise<void> => {
    try {
      console.log('[useGoalAPI] Deleting goal:', id);
      await api.delete(`/task/goal/${id}`);
      await refetch(); // Refresh list after deletion
    } catch (err: any) {
      console.error('[useGoalAPI] Error deleting goal:', err);
      throw err;
    }
  };

  /**
   * Link a task to a goal
   */
  const linkTaskToGoal = async (goalId: number, taskId: number): Promise<void> => {
    try {
      console.log('[useGoalAPI] Linking task to goal:', { goalId, taskId });
      await api.put('/task/goal/link-task', { goalId, taskId });
      await refetch(); // Refresh list after linking
    } catch (err: any) {
      console.error('[useGoalAPI] Error linking task to goal:', err);
      throw err;
    }
  };

  /**
   * Link multiple tasks to a goal
   */
  const linkMultipleTasksToGoal = async (goalId: number, taskIds: number[]): Promise<void> => {
    try {
      console.log('[useGoalAPI] Linking multiple tasks to goal:', { goalId, taskIds });
      await api.put('/task/goal/link-tasks', { goalId, taskIds });
      await refetch(); // Refresh list after linking
    } catch (err: any) {
      console.error('[useGoalAPI] Error linking multiple tasks to goal:', err);
      throw err;
    }
  };

  /**
   * Unlink a task from its goal
   */
  const unlinkTaskFromGoal = async (taskId: number): Promise<void> => {
    try {
      console.log('[useGoalAPI] Unlinking task from goal:', taskId);
      await api.put('/task/goal/unlink-task', { taskId });
      await refetch(); // Refresh list after unlinking
    } catch (err: any) {
      console.error('[useGoalAPI] Error unlinking task from goal:', err);
      throw err;
    }
  };

  // Auto-fetch on mount if enabled
  if (autoFetch) {
    fetchGoals();
  }

  return {
    data,
    loading,
    error,
    refetch,
    fetchGoals,
    getGoalById,
    createGoal,
    updateGoal,
    completeGoal,
    deleteGoal,
    linkTaskToGoal,
    linkMultipleTasksToGoal,
    unlinkTaskFromGoal
  };
}
