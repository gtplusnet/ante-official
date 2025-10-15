import { ref, Ref, watch, toValue } from 'vue';
import { api } from 'src/boot/axios';

export interface TaskAPIFilters {
  filter?: 'my' | 'quest' | 'all';
  projectId?: number;
  boardLaneId?: number | number[]; // Support both single value and array for "Ongoing Task" filter
  assignedToId?: string;
  companyId?: number;
  taskType?: string;
  isDeleted?: boolean;
  // New filter parameters for server-side filtering
  priorityLevel?: number;
  goalId?: number;
  specificAssignee?: string;  // For assignee filter (different from assignedToId which is for 'my' view)
  specificProject?: number;   // For project filter
  dueDateRange?: string;      // no_date, overdue, today, tomorrow, this_week, next_week, later
}

export interface TaskAPIOptions {
  filters?: TaskAPIFilters;
  autoFetch?: boolean;
}

/**
 * Composable for fetching tasks from backend API
 * Replaces direct Supabase access (useTaskTable)
 *
 * @param options - Configuration options for fetching tasks
 * @returns Task data, loading state, and refetch function
 */
export function useTaskAPI(options: TaskAPIOptions = {}) {
  const {
    filters = {},
    autoFetch = true
  } = options;

  const data = ref<any[]>([]);
  const loading = ref(false);
  const error = ref<Error | null>(null);

  /**
   * Fetch tasks from backend API
   * Uses GET /task/ordered endpoint with filters
   */
  const fetchTasks = async () => {
    loading.value = true;
    error.value = null;

    try {
      // Extract current filter values (supports reactive refs)
      const currentFilters = toValue(filters);
      console.log('[useTaskAPI] Fetching tasks with filters:', currentFilters);

      // Build query parameters based on filters
      const params: any = {
        viewType: currentFilters.filter || 'all',
        groupingMode: 'none', // Let frontend handle grouping
        groupingValue: undefined
      };

      // Build filter object for backend
      const apiFilters: any = {
        isDeleted: currentFilters.isDeleted ?? false
      };

      // Add company filter (required for multi-tenant)
      if (currentFilters.companyId) {
        apiFilters.companyId = currentFilters.companyId;
      }

      // Add project filter
      if (currentFilters.projectId) {
        apiFilters.projectId = currentFilters.projectId;
      }

      // Add board lane filter
      if (currentFilters.boardLaneId !== undefined) {
        apiFilters.boardLaneId = currentFilters.boardLaneId;
      }

      // Add assignee filter
      if (currentFilters.assignedToId) {
        apiFilters.assignedToId = currentFilters.assignedToId;
      }

      // Add task type filter
      if (currentFilters.taskType) {
        apiFilters.taskType = currentFilters.taskType;
      }

      // Add priority level filter
      if (currentFilters.priorityLevel !== undefined) {
        apiFilters.priorityLevel = currentFilters.priorityLevel;
      }

      // Add goal filter
      if (currentFilters.goalId !== undefined) {
        apiFilters.goalId = currentFilters.goalId;
      }

      // Add specific assignee filter (for assignee dropdown)
      if (currentFilters.specificAssignee) {
        apiFilters.specificAssignee = currentFilters.specificAssignee;
      }

      // Add specific project filter (for project dropdown)
      if (currentFilters.specificProject !== undefined) {
        apiFilters.specificProject = currentFilters.specificProject;
      }

      // Add due date range filter
      if (currentFilters.dueDateRange) {
        apiFilters.dueDateRange = currentFilters.dueDateRange;
      }

      // Convert filters to JSON string for query param
      if (Object.keys(apiFilters).length > 0) {
        params.filter = JSON.stringify(apiFilters);
      }

      console.log('[useTaskAPI] API request params:', params);

      // Call backend API
      const response = await api.get('/task/ordered', { params });

      data.value = response.data || [];

      console.log('[useTaskAPI] Fetched', data.value.length, 'tasks');
    } catch (err: any) {
      console.error('[useTaskAPI] Error fetching tasks:', err);
      error.value = err;
      data.value = [];
    } finally {
      loading.value = false;
    }
  };

  /**
   * Refetch tasks manually
   */
  const refetch = async () => {
    await fetchTasks();
  };

  /**
   * Update task ordering via backend API
   * Used for drag-and-drop reordering (persists to TaskOrderContext and Task tables)
   *
   * @param params - Task ordering parameters
   * @param params.taskOrders - Array of task IDs and their new order indices
   * @param params.viewType - View type ('my' or 'all')
   * @param params.groupingMode - Grouping mode ('none', 'priority', 'assignee', etc.)
   * @param params.groupingValue - Optional grouping value (section key)
   * @returns Promise that resolves when ordering is updated
   */
  const updateTaskOrdering = async (params: {
    taskOrders: Array<{ id: number; order: number }>;
    viewType: string;
    groupingMode: string;
    groupingValue?: string;
  }) => {
    try {
      console.log('[useTaskAPI] Updating task ordering:', params);
      const response = await api.put('/task/update-order', params);
      console.log('[useTaskAPI] Task ordering updated successfully');
      return response.data;
    } catch (err: any) {
      console.error('[useTaskAPI] Error updating task ordering:', err);
      throw err;
    }
  };

  // Auto-fetch on mount if enabled
  if (autoFetch) {
    fetchTasks();
  }

  return {
    data,
    loading,
    error,
    refetch,
    fetchTasks,
    updateTaskOrdering
  };
}

/**
 * Dashboard-specific API response with tasks and counts
 */
export interface TaskDashboardResponse {
  tasks: any[];
  counts: {
    active: number;
    assigned: number;
    approvals: number;
  };
}

/**
 * Options for dashboard API
 */
export interface TaskDashboardOptions {
  tab: 'active' | 'assigned' | 'approvals';
  search?: string;
  autoFetch?: boolean;
}

/**
 * Composable for TaskWidget dashboard
 * Fetches tasks for specific tab with counts for badges
 * Replaces direct Supabase access in TaskWidget.vue
 *
 * @param options - Dashboard configuration options
 * @returns Task data, counts, loading state, and refetch function
 */
export function useTaskDashboardAPI(options: TaskDashboardOptions) {
  const {
    tab,
    search,
    autoFetch = true
  } = options;

  const tasks = ref<any[]>([]);
  const counts = ref<TaskDashboardResponse['counts']>({
    active: 0,
    assigned: 0,
    approvals: 0
  });
  const loading = ref(false);
  const error = ref<Error | null>(null);

  /**
   * Fetch dashboard tasks from backend API
   * Uses GET /task/dashboard endpoint
   */
  const fetchDashboard = async () => {
    loading.value = true;
    error.value = null;

    try {
      // Extract values from refs (if refs are passed)
      const tabValue = toValue(tab);
      const searchValue = toValue(search);

      console.log('[useTaskDashboardAPI] Fetching dashboard for tab:', tabValue, 'search:', searchValue);

      // Build query parameters
      const params: any = { tab: tabValue };
      if (searchValue) {
        params.search = searchValue;
      }

      // Call backend API
      const response = await api.get('/task/dashboard', { params });

      // Extract tasks and counts from response
      tasks.value = response.data.tasks || [];
      counts.value = response.data.counts || { active: 0, assigned: 0, approvals: 0 };

      console.log('[useTaskDashboardAPI] Fetched', tasks.value.length, 'tasks');
      console.log('[useTaskDashboardAPI] Counts:', counts.value);
    } catch (err: any) {
      console.error('[useTaskDashboardAPI] Error fetching dashboard:', err);
      error.value = err;
      tasks.value = [];
      counts.value = { active: 0, assigned: 0, approvals: 0 };
    } finally {
      loading.value = false;
    }
  };

  /**
   * Refetch dashboard data manually
   * Used when tab or search changes
   */
  const refetch = async () => {
    await fetchDashboard();
  };

  // Watch for tab/search changes and refetch
  watch(() => [toValue(tab), toValue(search)], () => {
    fetchDashboard();
  });

  // Auto-fetch on mount if enabled
  if (autoFetch) {
    fetchDashboard();
  }

  return {
    tasks,
    counts,
    loading,
    error,
    refetch,
    fetchDashboard
  };
}
