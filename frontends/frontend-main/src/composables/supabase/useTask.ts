import { ref } from 'vue';
import supabaseService from 'src/services/supabase';
import { nowAsISO } from 'src/utils/timezone';

export interface QuickTaskData {
  name: string;
  description?: string;
  projectId: number;
  taskPhaseId?: number;
  companyId: number;
  assignedTo?: string;
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  status?: 'TODO' | 'IN_PROGRESS' | 'DONE' | 'ARCHIVED';
  dueDate?: string;
  boardLaneId?: number;
  order?: number;
}

export interface TaskInsertData {
  title: string;
  description: string;
  projectId?: number | null;
  taskPhaseId?: number | null;
  companyId: number;
  createdById: string;
  updatedById: string;
  assignedToId?: string | null;
  priorityLevel: number;
  taskType: string;
  dueDate?: string | null;
  boardLaneId: number;
  order: number;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
  isRead: boolean;
  isSelfAssigned: boolean;
  assignMode: string;
  isOpen: boolean;
  isDraft: boolean;
}

export const useTask = () => {
  const supabase = supabaseService.getClient();
  const loading = ref(false);
  const error = ref<string | null>(null);

  /**
   * Create a quick task using direct Supabase insertion
   * This provides immediate UI feedback while backend processing happens async
   * @param taskData - The task data to insert
   * @returns The created task with ID
   */
  const createQuickTask = async (taskData: QuickTaskData) => {
    loading.value = true;
    error.value = null;

    try {
      // Get current user from auth store
      let userId: string;
      try {
        const { useAuthStore } = await import('src/stores/auth');
        const authStore = useAuthStore();
        userId = authStore.accountInformation?.id || '';

        if (!userId) {
          throw new Error('User not authenticated');
        }
      } catch (e) {
        throw new Error('Could not get authenticated user');
      }

      // Get current timestamp in UTC (correct for database storage)
      const now = nowAsISO();

      // Map priority to priority level (0-4)
      let priorityLevel = 2; // Default to NORMAL
      if (taskData.priority) {
        const priority = taskData.priority.toUpperCase();
        if (priority === 'LOW') priorityLevel = 1;
        else if (priority === 'NORMAL') priorityLevel = 2;
        else if (priority === 'HIGH') priorityLevel = 3;
        else if (priority === 'URGENT') priorityLevel = 4;
      }

      // Determine assign mode
      let assignMode = 'OTHER';
      let isSelfAssigned = false;
      if (taskData.assignedTo === userId) {
        assignMode = 'SELF';
        isSelfAssigned = true;
      }

      // Prepare insert data with all required fields matching the actual schema
      const insertData: TaskInsertData = {
        title: taskData.name, // Map name to title
        description: taskData.description || '',
        projectId: taskData.projectId || null,
        taskPhaseId: taskData.taskPhaseId || null,
        companyId: taskData.companyId,
        createdById: userId,
        updatedById: userId,
        assignedToId: taskData.assignedTo || null,
        priorityLevel,
        taskType: 'NORMAL',
        dueDate: taskData.dueDate || null,
        boardLaneId: taskData.boardLaneId || 1,
        order: taskData.order ?? 0,
        createdAt: now,
        updatedAt: now,
        isDeleted: false,
        isRead: false,
        isSelfAssigned,
        assignMode,
        isOpen: true,
        isDraft: false
      };

      // Insert task directly to Supabase
      const { data, error: insertError } = await supabase
        .from('Task')
        .insert(insertData)
        .select()
        .single();

      if (insertError) {
        console.error('Error creating task:', insertError);
        throw insertError;
      }

      // The backend webhook will handle:
      // 1. Creating task watchers (CREATOR, ASSIGNEE)
      // 2. Sending notifications
      // 3. Creating discussion thread
      // 4. Activity logging
      // 5. WebSocket events

      return data;
    } catch (err: any) {
      console.error('Error in createQuickTask:', err);
      error.value = err.message || 'Failed to create task';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * Update task order for drag and drop operations
   * @param taskId - The task ID
   * @param updates - The fields to update (taskPhaseId, order)
   */
  const updateTaskOrder = async (
    taskId: number,
    updates: { taskPhaseId?: number; order: number }
  ) => {
    loading.value = true;
    error.value = null;

    try {
      const now = nowAsISO();

      const { data, error: updateError } = await supabase
        .from('Task')
        .update({
          ...updates,
          updatedAt: now
        })
        .eq('id', taskId)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating task order:', updateError);
        throw updateError;
      }

      return data;
    } catch (err: any) {
      console.error('Error in updateTaskOrder:', err);
      error.value = err.message || 'Failed to update task order';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * Batch update task orders for multiple tasks
   * Used when reordering tasks within or between sections
   * @param updates - Array of task updates
   */
  const batchUpdateTaskOrders = async (
    updates: {
      id: number;
      order: number;
      taskPhaseId?: number;
      priorityLevel?: number;
      assignedToId?: string | null;
      projectId?: number | null;
      status?: string;
    }[]
  ) => {
    loading.value = true;
    error.value = null;

    try {
      const now = nowAsISO();

      // Perform batch updates
      const promises = updates.map(update => {
        const updateData: any = {
          order: update.order,
          updatedAt: now
        };

        // Include all optional fields if provided
        if (update.taskPhaseId !== undefined) {
          updateData.taskPhaseId = update.taskPhaseId;
        }
        if (update.priorityLevel !== undefined) {
          updateData.priorityLevel = update.priorityLevel;
        }
        if (update.assignedToId !== undefined) {
          updateData.assignedToId = update.assignedToId;
        }
        if (update.projectId !== undefined) {
          updateData.projectId = update.projectId;
        }
        if (update.status !== undefined) {
          updateData.status = update.status;
        }

        return supabase
          .from('Task')
          .update(updateData)
          .eq('id', update.id);
      });

      const results = await Promise.all(promises);

      // Check for errors
      const errors = results.filter(r => r.error);
      if (errors.length > 0) {
        console.error('Batch update errors:', errors);
        throw errors[0].error;
      }

      return true;
    } catch (err: any) {
      console.error('Error in batchUpdateTaskOrders:', err);
      error.value = err.message || 'Failed to update task orders';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  return {
    loading,
    error,
    createQuickTask,
    updateTaskOrder,
    batchUpdateTaskOrders
  };
};