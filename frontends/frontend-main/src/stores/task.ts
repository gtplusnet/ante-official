import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { api } from 'src/boot/axios';
import { Notify } from 'quasar';
import type { TaskData } from 'src/composables/supabase/useTaskTable';
import { useTask, type QuickTaskData } from 'src/composables/supabase/useTask';

export type TaskCustomSection = 'do_today' | 'do_later' | 'do_next_week' | null;

export interface TaskWithCustomSection extends TaskData {
  customSection?: TaskCustomSection;
}

export const useTaskStore = defineStore('task', () => {
  // State
  const tasks = ref<TaskWithCustomSection[]>([]);
  const loading = ref(false);
  const error = ref<Error | null>(null);
  const currentTaskId = ref<number | null>(null);

  // Custom section assignments (stored locally for now)
  const customSections = ref<Record<number, TaskCustomSection>>({});

  // Computed
  const currentTask = computed(() => {
    if (!currentTaskId.value) return null;
    return tasks.value.find(t => t.id === currentTaskId.value) || null;
  });

  const tasksWithCustomSections = computed(() => {
    return tasks.value.map(task => ({
      ...task,
      customSection: customSections.value[task.id] || null
    }));
  });

  const tasksByCustomSection = computed(() => {
    const sections = {
      do_today: [] as TaskWithCustomSection[],
      do_later: [] as TaskWithCustomSection[],
      do_next_week: [] as TaskWithCustomSection[],
      uncategorized: [] as TaskWithCustomSection[]
    };

    tasksWithCustomSections.value.forEach(task => {
      const section = task.customSection;
      if (section && sections[section]) {
        sections[section].push(task);
      } else {
        sections.uncategorized.push(task);
      }
    });

    return sections;
  });

  // Actions
  const setTasks = (newTasks: TaskData[]) => {
    // Always create a new array to avoid readonly proxy issues
    tasks.value = [...newTasks];
  };

  const addTask = (task: TaskData) => {
    // Create a new array with the new task at the beginning to avoid mutating readonly proxy
    tasks.value = [task, ...tasks.value];
  };

  const updateTask = (taskId: number, updates: Partial<TaskData>) => {
    const index = tasks.value.findIndex(t => t.id === taskId);
    if (index !== -1) {
      // Create a new array with the updated task to maintain reactivity
      const updatedTasks = [...tasks.value];
      updatedTasks[index] = { ...updatedTasks[index], ...updates };
      tasks.value = updatedTasks;
    }
  };

  const removeTask = (taskId: number) => {
    tasks.value = tasks.value.filter(t => t.id !== taskId);
  };

  const setCurrentTask = (taskId: number | null) => {
    currentTaskId.value = taskId;
  };

  const setCustomSection = (taskId: number, section: TaskCustomSection) => {
    if (section === null) {
      delete customSections.value[taskId];
    } else {
      customSections.value[taskId] = section;
    }
    // Persist to localStorage
    localStorage.setItem('taskCustomSections', JSON.stringify(customSections.value));
  };

  const loadCustomSections = () => {
    const saved = localStorage.getItem('taskCustomSections');
    if (saved) {
      try {
        customSections.value = JSON.parse(saved);
      } catch (e) {
        console.error('Failed to load custom sections:', e);
      }
    }
  };

  // Backend API operations
  const createTask = async (taskData: Partial<TaskData>) => {
    try {
      loading.value = true;
      error.value = null;

      const response = await api.post('/task/create', taskData);

      if (response.data) {
        addTask(response.data);
        return response.data;
      }
    } catch (err) {
      error.value = err as Error;
      console.error('Failed to create task:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Quick task creation using direct Supabase insertion
  const createQuickTask = async (taskData: QuickTaskData) => {
    try {
      loading.value = true;
      error.value = null;

      // Use the useTask composable for direct Supabase insertion
      const taskComposable = useTask();
      const createdTask = await taskComposable.createQuickTask(taskData);

      if (createdTask) {
        // Add to local store for immediate UI update
        addTask(createdTask);

        // Show success notification
        Notify.create({
          type: 'positive',
          message: 'Task created successfully',
          position: 'top',
          timeout: 2000
        });

        return createdTask;
      }
    } catch (err) {
      error.value = err as Error;
      console.error('Failed to create quick task:', err);

      Notify.create({
        type: 'negative',
        message: 'Failed to create task',
        position: 'top',
        timeout: 3000
      });

      throw err;
    } finally {
      loading.value = false;
    }
  };

  const updateTaskInDB = async (taskId: number, updates: Partial<TaskData>) => {
    // Store original task for rollback
    const originalTask = tasks.value.find(t => t.id === taskId);
    const originalValues: Partial<TaskData> = {};

    // Store original values for changed fields
    if (originalTask) {
      Object.keys(updates).forEach(key => {
        originalValues[key as keyof TaskData] = originalTask[key as keyof TaskData];
      });
    }

    // Note: Optimistic update is now done in the component before calling this
    // This prevents double updates and makes the UI more responsive
    // Only update here if not already updated optimistically

    try {
      const response = await api.put('/task/update', {
        id: taskId,
        ...updates
      });

      if (response.data) {
        // Only update if the response differs from what we have
        // This prevents unnecessary re-renders and flickering
        const currentTask = tasks.value.find(t => t.id === taskId);
        const hasChanges = currentTask && Object.keys(response.data).some(key =>
          JSON.stringify(currentTask[key as keyof TaskData]) !== JSON.stringify(response.data[key])
        );

        if (hasChanges) {
          // Sync with backend response only if there are actual changes
          updateTask(taskId, response.data);
        }
        return response.data;
      }
    } catch (err) {
      // Rollback on failure
      updateTask(taskId, originalValues);

      Notify.create({
        type: 'negative',
        message: 'Failed to update task. Changes reverted.',
        position: 'top'
      });

      error.value = err as Error;
      console.error('Failed to update task:', err);
      throw err;
    }
  };

  const deleteTask = async (taskId: number) => {
    // Store the task for potential rollback
    const taskToDelete = tasks.value.find(t => t.id === taskId);
    const taskIndex = tasks.value.findIndex(t => t.id === taskId);

    if (!taskToDelete) {
      console.error('Task not found:', taskId);
      return;
    }

    // Optimistic delete - remove immediately from UI
    removeTask(taskId);

    try {
      // Make API call in background
      await api.delete(`/task/${taskId}`);
    } catch (err) {
      // Rollback on failure - restore the task at its original position
      if (taskIndex >= 0 && taskIndex < tasks.value.length) {
        // Create new array with task inserted at original position
        const newTasks = [...tasks.value];
        newTasks.splice(taskIndex, 0, taskToDelete);
        tasks.value = newTasks;
      } else {
        // Add task at the end
        tasks.value = [...tasks.value, taskToDelete];
      }

      // Error notification
      Notify.create({
        type: 'negative',
        message: 'Failed to delete task. Task restored.',
        position: 'top',
        timeout: 3000
      });

      error.value = err as Error;
      console.error('Failed to delete task:', err);
      throw err;
    }
  };

  const restoreTask = async (taskId: number) => {
    // For restore, we need to get the task data first or have it passed in
    // Since deleted tasks are shown in the deleted view, they should still be available
    
    try {
      // Make API call to restore
      const response = await api.put(`/task/restore/${taskId}`);
      
      if (response.data) {
        // Add the restored task back to the tasks array
        const restoredTask = response.data;
        
        // Check if task already exists (shouldn't happen, but be safe)
        const existingIndex = tasks.value.findIndex(t => t.id === taskId);
        if (existingIndex === -1) {
          // Add the restored task - create new array
          tasks.value = [...tasks.value, restoredTask];
        } else {
          // Update existing task - create new array with updated task
          const newTasks = [...tasks.value];
          newTasks[existingIndex] = restoredTask;
          tasks.value = newTasks;
        }

        // Success notification
        Notify.create({
          type: 'positive',
          message: 'Task restored successfully',
          position: 'top',
          timeout: 2000
        });

        return restoredTask;
      }
    } catch (err) {
      // Error notification
      Notify.create({
        type: 'negative',
        message: 'Failed to restore task',
        position: 'top',
        timeout: 3000
      });

      error.value = err as Error;
      console.error('Failed to restore task:', err);
      throw err;
    }
  };

  const moveTask = async (taskId: number, newBoardLaneId: number, newOrder?: number) => {
    // Store original values for rollback
    const originalTask = tasks.value.find(t => t.id === taskId);
    const originalBoardLaneId = originalTask?.boardLaneId;
    const originalOrder = originalTask?.order;

    try {
      loading.value = true;
      error.value = null;

      const response = await api.put('/task/move', {
        taskId: taskId,
        boardLaneId: newBoardLaneId,
        order: newOrder
      });

      if (response.data) {
        // Only update if there are actual changes from the server
        const currentTask = tasks.value.find(t => t.id === taskId);
        if (currentTask &&
            (currentTask.boardLaneId !== response.data.boardLaneId ||
             currentTask.order !== response.data.order)) {
          updateTask(taskId, response.data);
        }
        return response.data;
      }
    } catch (err) {
      // Rollback on failure
      if (originalTask) {
        updateTask(taskId, {
          boardLaneId: originalBoardLaneId,
          order: originalOrder
        });
      }

      Notify.create({
        type: 'negative',
        message: 'Failed to move task. Changes reverted.',
        position: 'top'
      });

      error.value = err as Error;
      console.error('Failed to move task:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const assignTask = async (taskId: number, assigneeId: string | null, _assigneeName?: string) => {
    // Store original values for rollback
    const originalTask = tasks.value.find(t => t.id === taskId);
    const originalAssignee = originalTask?.assignee;
    const originalAssigneeId = originalTask?.assignedToId;

    // Note: Optimistic update is now done in the component before calling this
    // This prevents double updates and makes the UI more responsive

    try {
      const response = await api.put('/task/assign', {
        taskId: taskId,
        assignedToId: assigneeId
      });

      if (response.data) {
        // Extract assignee name from the response
        const responseAssigneeName = response.data.assignedTo
          ? `${response.data.assignedTo.firstName || ''} ${response.data.assignedTo.lastName || ''}`.trim() || response.data.assignedTo.username
          : null;

        // Only update if there are actual changes from the server
        const currentTask = tasks.value.find(t => t.id === taskId);
        if (currentTask &&
            (currentTask.assignedToId !== response.data.assignedToId ||
             currentTask.assignee !== responseAssigneeName)) {
          // Update with actual backend response
          updateTask(taskId, {
            ...response.data,
            assignee: responseAssigneeName,
            assignedToId: response.data.assignedToId
          });
        }

        return response.data;
      }
    } catch (err) {
      // Rollback on failure
      updateTask(taskId, {
        assignee: originalAssignee,
        assignedToId: originalAssigneeId
      });

      Notify.create({
        type: 'negative',
        message: 'Failed to update assignee. Changes reverted.',
        position: 'top'
      });

      error.value = err as Error;
      console.error('Failed to assign task:', err);
      throw err;
    }
  };

  const updateTaskPriority = async (taskId: number, priorityLevel: number) => {
    // Store original values for rollback
    const originalTask = tasks.value.find(t => t.id === taskId);
    const originalPriorityLevel = originalTask?.priorityLevel;
    const originalPriority = originalTask?.priority;

    // Optimistic update - update immediately
    const priority = priorityLevel === 0 ? 'verylow' :
                     priorityLevel === 1 ? 'low' :
                     priorityLevel === 2 ? 'medium' :
                     priorityLevel === 3 ? 'high' : 'urgent';
    updateTask(taskId, {
      priorityLevel: priorityLevel,
      priority: priority
    });

    try {
      const response = await api.put('/task/update', {
        id: taskId,
        priorityLevel: priorityLevel
      });

      if (response.data) {
        // Sync with backend response
        updateTask(taskId, response.data);
        return response.data;
      }
    } catch (err) {
      // Rollback on failure
      updateTask(taskId, {
        priorityLevel: originalPriorityLevel,
        priority: originalPriority
      });

      Notify.create({
        type: 'negative',
        message: 'Failed to update priority. Changes reverted.',
        position: 'top'
      });

      error.value = err as Error;
      console.error('Failed to update task priority:', err);
      throw err;
    }
  };

  const updateTaskDueDate = async (taskId: number, dueDate: string | null) => {
    // Store original value for rollback
    const originalTask = tasks.value.find(t => t.id === taskId);
    const originalDueDate = originalTask?.dueDate;

    // Optimistic update - update immediately
    updateTask(taskId, { dueDate: dueDate });

    try {
      const response = await api.put('/task/update', {
        id: taskId,
        dueDate: dueDate
      });

      if (response.data) {
        // Sync with backend response
        updateTask(taskId, response.data);
        return response.data;
      }
    } catch (err) {
      // Rollback on failure
      updateTask(taskId, { dueDate: originalDueDate });

      Notify.create({
        type: 'negative',
        message: 'Failed to update due date. Changes reverted.',
        position: 'top'
      });

      error.value = err as Error;
      console.error('Failed to update task due date:', err);
      throw err;
    }
  };

  const updateTaskProject = async (taskId: number, projectId: number | null) => {
    // Store original values for rollback
    const originalTask = tasks.value.find(t => t.id === taskId);
    const originalProjectId = originalTask?.projectId;
    const originalProjectName = originalTask?.projectName;

    // Optimistic update - update immediately
    updateTask(taskId, {
      projectId: projectId,
      projectName: projectId ? 'Updating...' : null
    });

    try {
      const response = await api.put('/task/update', {
        id: taskId,
        projectId: projectId
      });

      if (response.data) {
        // Sync with backend response
        updateTask(taskId, {
          ...response.data,
          projectId: projectId
        });
        return response.data;
      }
    } catch (err) {
      // Rollback on failure
      updateTask(taskId, {
        projectId: originalProjectId,
        projectName: originalProjectName
      });

      Notify.create({
        type: 'negative',
        message: 'Failed to update project. Changes reverted.',
        position: 'top'
      });

      error.value = err as Error;
      console.error('Failed to update task project:', err);
      throw err;
    }
  };

  // Batch update task orders for drag-and-drop reordering
  const updateTaskOrders = (updates: Array<{ id: number; order: number; taskPhaseId?: number }>) => {
    // Update multiple tasks at once for better performance
    const updatedTasks = [...tasks.value];
    updates.forEach(update => {
      const index = updatedTasks.findIndex(t => t.id === update.id);
      if (index !== -1) {
        updatedTasks[index] = {
          ...updatedTasks[index],
          order: update.order,
          ...(update.taskPhaseId !== undefined && { taskPhaseId: update.taskPhaseId })
        };
      }
    });
    tasks.value = updatedTasks;
  };

  const fetchTasks = async () => {
    try {
      loading.value = true;
      error.value = null;

      const response = await api.get('/task/own-task');

      if (response.data && response.data.items) {
        // Map backend task data to match TaskData interface
        const mappedTasks = response.data.items.map((task: any) => ({
          id: task.id,
          title: task.title || task.taskName,
          description: task.description || task.taskDescription,
          statusId: task.statusId,
          status: task.status || 'To do',
          priorityLevel: typeof task.priorityLevel === 'object' ? task.priorityLevel.key : task.priorityLevel || 0,
          priority: task.priority || (
            typeof task.priorityLevel === 'object' ?
              (task.priorityLevel.key === 0 ? 'verylow' :
               task.priorityLevel.key === 1 ? 'low' :
               task.priorityLevel.key === 2 ? 'medium' :
               task.priorityLevel.key === 3 ? 'high' : 'urgent') :
              (task.priorityLevel === 0 ? 'verylow' :
               task.priorityLevel === 1 ? 'low' :
               task.priorityLevel === 2 ? 'medium' :
               task.priorityLevel === 3 ? 'high' : 'urgent')
          ),
          dueDate: task.dueDate?.raw || task.dueDate,
          assignedToId: task.assignedTo?.id || task.assignedToId,
          assignee: task.assignedTo ?
            `${task.assignedTo.firstName || ''} ${task.assignedTo.lastName || ''}`.trim() || task.assignedTo.username :
            task.assignee || null,
          projectId: task.project?.id || task.projectId,
          projectName: task.project?.name || task.projectName,
          tags: task.tags || [],
          boardLane: task.boardLane,
          boardLaneId: task.boardLane?.id || task.boardLaneId || 1,
          order: task.order || 0,
          createdAt: task.createdAt?.raw || task.createdAt,
          updatedAt: task.updatedAt?.raw || task.updatedAt
        }));

        setTasks(mappedTasks);
        return mappedTasks;
      }

      return [];
    } catch (err) {
      error.value = err as Error;
      console.error('Failed to fetch tasks:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Initialize
  loadCustomSections();

  return {
    // State
    tasks,
    loading,
    error,
    currentTaskId,
    customSections,

    // Computed
    currentTask,
    tasksWithCustomSections,
    tasksByCustomSection,

    // Actions
    setTasks,
    addTask,
    updateTask,
    removeTask,
    setCurrentTask,
    setCustomSection,
    loadCustomSections,
    updateTaskOrders,

    // API operations
    fetchTasks,
    createTask,
    createQuickTask,
    updateTaskInDB,
    deleteTask,
    restoreTask,
    moveTask,
    assignTask,
    updateTaskPriority,
    updateTaskDueDate,
    updateTaskProject
  };
});