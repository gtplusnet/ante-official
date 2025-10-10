import { ref, onMounted, onUnmounted } from 'vue';
import { useRealtimeSubscription } from './useRealtimeSubscription';
import { useTaskStore, type TaskData } from 'src/stores/task';

export interface UseTaskRealtimeOptions {
  /**
   * Whether to subscribe immediately on mount
   */
  immediate?: boolean;

  /**
   * Filter by project ID
   */
  projectId?: number | null;

  /**
   * Filter by assignee ID
   */
  assigneeId?: string | null;

  /**
   * Custom filter string
   */
  filter?: string;
}

/**
 * Composable for real-time task updates
 */
export function useTaskRealtime(options: UseTaskRealtimeOptions = {}) {
  const { immediate = true, projectId, assigneeId, filter } = options;

  const taskStore = useTaskStore();
  const lastEventTimestamp = ref<string | null>(null);

  // Build filter string based on options
  const buildFilter = () => {
    const filters: string[] = [];

    if (projectId !== undefined) {
      if (projectId === null) {
        filters.push('projectId=is.null');
      } else {
        filters.push(`projectId=eq.${projectId}`);
      }
    }

    if (assigneeId !== undefined) {
      if (assigneeId === null) {
        filters.push('assignedToId=is.null');
      } else {
        filters.push(`assignedToId=eq.${assigneeId}`);
      }
    }

    if (filter) {
      filters.push(filter);
    }

    return filters.length > 0 ? filters.join(',') : undefined;
  };

  // Use the generic realtime subscription composable
  const {
    isConnected,
    isLoading,
    error,
    subscribe,
    unsubscribe,
    reconnect,
    getStats
  } = useRealtimeSubscription('Task', {
    immediate: false, // We'll handle subscription timing ourselves
    filter: buildFilter(),
    callbacks: {
      onInsert: (payload) => {
        console.log('📥 Task inserted:', payload);
        const newTask = payload.new as TaskData;

        // Add to store
        taskStore.addTask(newTask);
        lastEventTimestamp.value = new Date().toISOString();
      },
      onUpdate: (payload) => {
        console.log('📝 Task updated:', payload);
        const updatedTask = payload.new as TaskData;

        // Update in store
        taskStore.updateTask(updatedTask.id, updatedTask);
        lastEventTimestamp.value = new Date().toISOString();
      },
      onDelete: (payload) => {
        console.log('🗑️ Task deleted:', payload);
        const deletedTask = payload.old as TaskData;

        // Remove from store
        taskStore.removeTask(deletedTask.id);
        lastEventTimestamp.value = new Date().toISOString();
      },
      onConnect: () => {
        console.log('✅ Connected to Task realtime');
      },
      onDisconnect: () => {
        console.log('❌ Disconnected from Task realtime');
      },
      onError: (err) => {
        console.error('❌ Task realtime error:', err);
      }
    }
  });

  // Handle task movement between board lanes
  const handleTaskMove = (payload: any) => {
    const task = payload.new as TaskData;
    const oldTask = payload.old as TaskData;

    if (oldTask.boardLaneId !== task.boardLaneId) {
      console.log(`📦 Task moved from lane ${oldTask.boardLaneId} to ${task.boardLaneId}`);
      // You can emit custom events or trigger notifications here
    }
  };

  // Handle task assignment changes
  const handleAssignmentChange = (payload: any) => {
    const task = payload.new as TaskData;
    const oldTask = payload.old as TaskData;

    if (oldTask.assignedToId !== task.assignedToId) {
      console.log(`👤 Task reassigned from ${oldTask.assignedToId} to ${task.assignedToId}`);
      // You can emit custom events or trigger notifications here
    }
  };

  // Enhanced update handler that detects specific changes
  // Currently not used but kept for future enhancement
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const enhancedUpdateHandler = (payload: any) => {
    const task = payload.new as TaskData;
    const oldTask = payload.old as TaskData;

    // Handle board lane changes
    if (oldTask.boardLaneId !== task.boardLaneId) {
      handleTaskMove(payload);
    }

    // Handle assignment changes
    if (oldTask.assignedToId !== task.assignedToId) {
      handleAssignmentChange(payload);
    }

    // Handle priority changes
    if (oldTask.priorityLevel !== task.priorityLevel) {
      console.log(`🎯 Task priority changed from ${oldTask.priorityLevel} to ${task.priorityLevel}`);
    }

    // Handle due date changes
    if (oldTask.dueDate !== task.dueDate) {
      console.log(`📅 Task due date changed from ${oldTask.dueDate} to ${task.dueDate}`);
    }

    // Update the task in store
    taskStore.updateTask(task.id, task);
    lastEventTimestamp.value = new Date().toISOString();
  };

  // Subscribe to board lane changes for task count updates
  const subscribeToBoardLaneUpdates = async () => {
    // This could be used to track task counts per lane
    // For now, we rely on the task updates to keep counts accurate
  };

  // Auto-subscribe on mount if immediate is true
  onMounted(async () => {
    if (immediate) {
      try {
        await subscribe();
        await subscribeToBoardLaneUpdates();
      } catch (err) {
        console.error('Failed to subscribe to task realtime:', err);
      }
    }
  });

  // Clean up on unmount
  onUnmounted(async () => {
    await unsubscribe();
  });

  return {
    isConnected,
    isLoading,
    error,
    lastEventTimestamp,
    subscribe,
    unsubscribe,
    reconnect,
    getStats
  };
}