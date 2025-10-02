import { ref, computed, Ref } from 'vue';
import { useSupabaseTable, clearTableCache as clearSupabaseTableCache } from './useSupabaseTable';
import { FilterConfig, OrderConfig } from './useSupabaseTable';

// Re-export clearTableCache for convenience
export const clearTableCache = clearSupabaseTableCache;

export interface TaskData {
  id: number;
  title: string;
  description: string;
  order: number;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
  boardLaneId: number;
  createdById: string;
  projectId: number | null;
  updatedById: string;
  assignedToId: string | null;
  dueDate: string | null;
  isRead: boolean;
  priorityLevel: number;
  isOpen: boolean;
  taskType: string;
  companyId: number | null;
  taskPhaseId?: number | null;
  assignedByDifficultySet?: number;
  assignedToDifficultySet?: number;
  isSelfAssigned?: boolean;
  // Relations
  assignedTo?: {
    id: string;
    firstName: string;
    lastName: string;
    username: string;
    image?: string;
  };
  createdBy?: {
    id: string;
    firstName: string;
    lastName: string;
    username: string;
  };
  updatedBy?: {
    id: string;
    firstName: string;
    lastName: string;
    username: string;
  };
  project?: {
    id: number;
    name: string;
    description: string;
  };
  boardLane?: {
    id: number;
    name: string;
    key: string;
    order: number;
  };
  ApprovalMetadata?: {
    id: number;
    taskId: number;
    sourceModule: string;
    sourceId: string;
    sourceData: any;
    actions: any;
    approvalLevel: number;
    maxApprovalLevel: number;
    approvalChain: any;
    remarks: string | null;
    approvedAt: string | null;
    createdAt: string;
    updatedAt: string;
  };
}

export interface UseTaskTableOptions {
  filters?: FilterConfig[];
  orderBy?: OrderConfig | OrderConfig[];
  pageSize?: number;
  searchColumn?: string;
  searchValue?: Ref<string> | string;
  assignedToId?: string | null;
  projectId?: number | null;
  boardLaneId?: number | null;
  companyId?: number | null;
  includeDeleted?: boolean;
  autoFetch?: boolean;
}

/**
 * Composable for fetching task data from Supabase
 */
export function useTaskTable(options: UseTaskTableOptions = {}) {
  const {
    filters: additionalFilters = [],
    orderBy = [
      { column: 'createdAt', ascending: false }, // Secondary: newest first
      { column: 'order', ascending: true }        // Primary: by order
    ],
    pageSize = 50,
    searchColumn = 'title',
    searchValue,
    assignedToId,
    projectId,
    boardLaneId,
    companyId,
    includeDeleted = false,
    autoFetch = true
  } = options;

  // Build filters based on options
  const filters = ref<FilterConfig[]>([...additionalFilters]);

  // Add standard filters
  if (!includeDeleted) {
    filters.value.push({ column: 'isDeleted', operator: 'eq', value: false });
  }

  if (assignedToId !== undefined) {
    if (assignedToId === null) {
      filters.value.push({ column: 'assignedToId', operator: 'is', value: null });
    } else {
      filters.value.push({ column: 'assignedToId', operator: 'eq', value: assignedToId });
    }
  }

  if (projectId !== undefined) {
    if (projectId === null) {
      filters.value.push({ column: 'projectId', operator: 'is', value: null });
    } else {
      filters.value.push({ column: 'projectId', operator: 'eq', value: projectId });
    }
  }

  if (boardLaneId !== undefined) {
    filters.value.push({ column: 'boardLaneId', operator: 'eq', value: boardLaneId });
  }

  if (companyId !== undefined) {
    if (companyId === null) {
      filters.value.push({ column: 'companyId', operator: 'is', value: null });
    } else {
      filters.value.push({ column: 'companyId', operator: 'eq', value: companyId });
    }
  }

  // Use the base table composable with Task-specific configuration
  const tableComposable = useSupabaseTable<TaskData>({
    table: 'Task',
    select: `
      *,
      assignedTo:Account!Task_assignedToId_fkey(
        id,
        firstName,
        lastName,
        username,
        image
      ),
      createdBy:Account!Task_createdById_fkey(
        id,
        firstName,
        lastName,
        username
      ),
      updatedBy:Account!Task_updatedById_fkey(
        id,
        firstName,
        lastName,
        username
      ),
      project:Project(
        id,
        name,
        description
      ),
      company:Company(
        id,
        companyName
      ),
      boardLane:BoardLane(
        id,
        name,
        key,
        order
      ),
      ApprovalMetadata(
        id,
        taskId,
        sourceModule,
        sourceId,
        sourceData,
        actions,
        approvalLevel,
        maxApprovalLevel,
        approvalChain,
        remarks,
        approvedAt,
        createdAt,
        updatedAt
      )
    `,
    filters: filters.value,
    orderBy,
    pageSize,
    searchColumn,
    searchValue,
    autoFetch
  });

  // Computed properties for organized task data
  const tasksByStatus = computed(() => {
    const grouped: Record<string, TaskData[]> = {};
    tableComposable.data.value.forEach(task => {
      const status = task.boardLane?.name || 'Unknown';
      if (!grouped[status]) {
        grouped[status] = [];
      }
      grouped[status].push(task);
    });
    return grouped;
  });

  const tasksByPriority = computed(() => {
    const grouped: Record<string, TaskData[]> = {
      'High': [],
      'Medium': [],
      'Low': [],
      'No Priority': []
    };

    tableComposable.data.value.forEach(task => {
      if (task.priorityLevel >= 4) {
        grouped['High'].push(task);
      } else if (task.priorityLevel >= 2) {
        grouped['Medium'].push(task);
      } else if (task.priorityLevel === 1) {
        grouped['Low'].push(task);
      } else {
        grouped['No Priority'].push(task);
      }
    });

    return grouped;
  });

  const overdueTasks = computed(() => {
    const now = new Date();
    return tableComposable.data.value.filter(task => {
      if (!task.dueDate) return false;
      const dueDate = new Date(task.dueDate);
      return dueDate < now && task.boardLane?.key !== 'DONE';
    });
  });

  const upcomingTasks = computed(() => {
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return tableComposable.data.value.filter(task => {
      if (!task.dueDate) return false;
      const dueDate = new Date(task.dueDate);
      return dueDate >= now && dueDate <= nextWeek && task.boardLane?.key !== 'DONE';
    });
  });

  // Helper methods for task operations
  const updateFilters = (newFilters: FilterConfig[]) => {
    filters.value = [...newFilters];
    if (!includeDeleted) {
      filters.value.push({ column: 'isDeleted', operator: 'eq', value: false });
    }
    // Re-apply other static filters
    if (assignedToId !== undefined) {
      if (assignedToId === null) {
        filters.value.push({ column: 'assignedToId', operator: 'is', value: null });
      } else {
        filters.value.push({ column: 'assignedToId', operator: 'eq', value: assignedToId });
      }
    }
    if (projectId !== undefined) {
      if (projectId === null) {
        filters.value.push({ column: 'projectId', operator: 'is', value: null });
      } else {
        filters.value.push({ column: 'projectId', operator: 'eq', value: projectId });
      }
    }
    if (boardLaneId !== undefined) {
      filters.value.push({ column: 'boardLaneId', operator: 'eq', value: boardLaneId });
    }

    // Clear and re-add filters to trigger refetch
    tableComposable.clearFilters();
    filters.value.forEach(filter => {
      tableComposable.addFilter(filter);
    });
  };

  const filterByAssignee = (userId: string | null) => {
    // Remove existing assignedToId filter
    const newFilters = filters.value.filter(f => f.column !== 'assignedToId');

    if (userId === null) {
      newFilters.push({ column: 'assignedToId', operator: 'is', value: null });
    } else if (userId !== undefined) {
      newFilters.push({ column: 'assignedToId', operator: 'eq', value: userId });
    }

    updateFilters(newFilters);
  };

  const filterByProject = (projectId: number | null) => {
    // Remove existing projectId filter
    const newFilters = filters.value.filter(f => f.column !== 'projectId');

    if (projectId === null) {
      newFilters.push({ column: 'projectId', operator: 'is', value: null });
    } else if (projectId !== undefined) {
      newFilters.push({ column: 'projectId', operator: 'eq', value: projectId });
    }

    updateFilters(newFilters);
  };

  const filterByStatus = (boardLaneId: number) => {
    // Remove existing boardLaneId filter
    const newFilters = filters.value.filter(f => f.column !== 'boardLaneId');

    if (boardLaneId !== undefined) {
      newFilters.push({ column: 'boardLaneId', operator: 'eq', value: boardLaneId });
    }

    updateFilters(newFilters);
  };

  return {
    // Expose all base table composable properties
    ...tableComposable,

    // Task-specific computed properties
    tasksByStatus,
    tasksByPriority,
    overdueTasks,
    upcomingTasks,

    // Task-specific methods
    updateFilters,
    filterByAssignee,
    filterByProject,
    filterByStatus
  };
}