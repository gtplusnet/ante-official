<template>
  <div class="task-list-container" :class="{ 'compact-mode': compactMode }">
    <div v-if="!hideHeader" class="task-view-header">
      <div class="header-left">
        <h1>{{ pageTitle }}</h1>
        <div class="view-switcher">
          <button
            v-for="view in viewOptions"
            :key="view.type"
            class="view-button"
            :class="{ active: currentView === view.type }"
            @click="setView(view.type)"
          >
            <q-icon :name="view.icon" />
          </button>
        </div>
      </div>
      <div class="header-actions">
        <q-btn
          color="primary"
          icon="add"
          label="New Task"
          size="sm"
          dense
          unelevated
          @click="openCreateDialog"
        />
      </div>
    </div>

    <div class="page-content" :class="{ 'q-mt-sm': !hideHeader }">
      <component
        :is="currentViewComponent"
        :tasks="filteredTasks"
        :filter="filter"
        :loading="loading"
        :creatingTask="creatingInlineTask"
        :projectId="projectId"
        :hideProjectGrouping="hideProjectGrouping"
        :compactMode="compactMode"
        :externalGroupingMode="externalGroupingMode"
        @toggle-status="toggleTaskStatus"
        @update-status="updateTaskStatus"
        @update-task="updateTaskField"
        @select-task="viewTask"
        @edit-task="editTask"
        @view-task="viewTask"
        @delete-task="deleteTask"
        @restore-task="restoreTask"
        @open-menu="openTaskMenu"
        @add-task="addTaskToSection"
        @reorder-tasks="handleReorderTasks"
      />

      <div v-if="loading && !filteredTasks.length" class="text-center q-pa-lg">
        <q-spinner-dots size="40px" color="primary" />
      </div>
    </div>

    <!-- Task Create Dialog -->
    <TaskCreateDialog
      v-model="showCreateDialog"
      @task-created="handleTaskCreated"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted, onActivated, watch } from 'vue';
import { defineAsyncComponent } from 'vue';
import { useRoute } from 'vue-router';
import { storeToRefs } from 'pinia';
import { Notify } from 'quasar';
import { useTaskSearchStore, TaskViewType } from '../../../stores/taskSearch';
import { useTaskAPI } from 'src/composables/api/useTaskAPI';
import { useTaskRealtime } from 'src/composables/realtime/useTaskRealtime';
import { useTaskStore } from 'src/stores/task';
// TODO: Migrate to backend API - useTask composable deleted
// import { useTask } from 'src/composables/supabase/useTask';
import { useAuthStore } from 'src/stores/auth';
import { useAssigneeStore } from 'src/stores/assignee';
import bus from 'src/bus';
import TaskListView from './TaskListView.vue';
import TaskBoardView from './TaskBoardView.vue';
import TaskCardView from './TaskCardView.vue';

// Lazy-loaded dialogs (ALL dialogs must be lazy loaded - CLAUDE.md)
const TaskCreateDialog = defineAsyncComponent(() =>
  import('../../../components/dialog/TaskCreateDialog/TaskCreateDialog.vue')
);

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  priority?: 'verylow' | 'low' | 'medium' | 'high' | 'urgent';
  priorityLevel?: number;
  assignee: string;
  assignedToId?: string | null;
  creator: string;
  createdById?: string;
  dueDate?: string;
  endDate?: string;
  createdAt: string;
  completedAt?: string;
  subtaskCount?: number;
  tags?: string[];
  project?: string;
  projectName?: string | null;
  projectId?: number | null;
  boardLaneId?: number;
  order?: number;
  taskPhaseId?: number | null;
  isDraft?: boolean;
}

interface ViewOption {
  type: TaskViewType;
  icon: string;
  label: string;
}

export default defineComponent({
  name: 'TaskList',
  components: {
    TaskListView,
    TaskBoardView,
    TaskCardView,
    TaskCreateDialog,
  },
  props: {
    filter: {
      type: String,
      required: true,
    },
    projectId: {
      type: [Number, String],
      default: null,
    },
    hideProjectGrouping: {
      type: Boolean,
      default: false,
    },
    hideHeader: {
      type: Boolean,
      default: false,
    },
    compactMode: {
      type: Boolean,
      default: false,
    },
    externalGroupingMode: {
      type: String,
      default: null,
    },
  },
  setup(props) {
    const route = useRoute();
    const taskSearchStore = useTaskSearchStore();
    const taskStore = useTaskStore();
    const authStore = useAuthStore();
    const assigneeStore = useAssigneeStore();
    const loading = ref(false);
    const creatingInlineTask = ref(false); // Loading state for inline task creation

    // Get available users for assignee lookups (from global store - initialized in MainLayout)
    const availableUsers = computed(() => assigneeStore.formattedAssignees);

    // Get tasks from store using storeToRefs for reactivity
    const { tasks: storeTasks } = storeToRefs(taskStore);

    // Create dialog state and handler early since it's used in multiple places
    const showCreateDialog = ref(false);
    const openCreateDialog = () => {
      showCreateDialog.value = true;
    };

    // Define refetchTasks as an empty function initially - will be reassigned later
    let refetchTasks = async () => {
      console.log('refetchTasks not yet initialized');
    };

    // Convert Supabase data to component format (defined early for use in computed properties)
    const convertTaskData = (task: any): Task => {
      // Handle missing task data
      if (!task) return null;

      // Map priority level to string
      let priority: 'verylow' | 'low' | 'medium' | 'high' | 'urgent' | undefined;
      // Handle both priorityLevel as number and as object
      const priorityValue = typeof task.priorityLevel === 'object' ?
        task.priorityLevel?.key :
        task.priorityLevel;

      if (priorityValue !== undefined && priorityValue !== null) {
        if (priorityValue === 0) {
          priority = 'verylow';
        } else if (priorityValue === 1) {
          priority = 'low';
        } else if (priorityValue === 2) {
          priority = 'medium';
        } else if (priorityValue === 3) {
          priority = 'high';
        } else if (priorityValue >= 4) {
          priority = 'urgent';
        }
      }

      // Map status from boardLane or use boardLaneId fallback
      let status = 'todo';
      if (task.boardLane) {
        // Handle both boardLane.key (string) and boardLane.key.key (object) formats
        const laneKey = typeof task.boardLane.key === 'string' ?
          task.boardLane.key :
          task.boardLane.key?.key;

        if (laneKey === 'DONE') {
          status = 'done';
        } else if (laneKey === 'IN_PROGRESS') {
          status = 'in_progress';
        } else if (laneKey === 'PENDING_APPROVAL') {
          status = 'pending_approval';
        } else if (laneKey === 'BACKLOG' || laneKey === 'TODO') {
          status = 'todo';
        }
      } else if (task.boardLaneId) {
        // Fallback mapping based on boardLaneId if boardLane relation is missing
        // These IDs should match your database
        if (task.boardLaneId === 3) status = 'done';
        else if (task.boardLaneId === 2) status = 'in_progress';
        else if (task.boardLaneId === 4) status = 'pending_approval';
        else if (task.boardLaneId === 1) status = 'todo';
      }

      // Handle assignee name - prioritize direct assignee field for optimistic updates
      let assigneeName = '';
      // First check the direct assignee field (used for optimistic updates)
      if (task.assignee) {
        assigneeName = task.assignee;
      }
      // Then fall back to assignedTo relation from Supabase
      else if (task.assignedTo) {
        if (typeof task.assignedTo === 'object') {
          assigneeName = `${task.assignedTo.firstName || ''} ${task.assignedTo.lastName || ''}`.trim() || task.assignedTo.username || '';
        } else if (typeof task.assignedTo === 'string') {
          assigneeName = task.assignedTo;
        }
      }

      return {
        id: String(task.id),
        title: task.title || '',
        description: task.description || '',
        status,
        priority,
        priorityLevel: task.priorityLevel || 0,
        assignee: assigneeName,
        assignedToId: task.assignedToId,
        creator: task.createdBy ?
          (typeof task.createdBy === 'object' ?
            `${task.createdBy.firstName || ''} ${task.createdBy.lastName || ''}`.trim() :
            task.createdBy) : '',
        createdById: task.createdById,
        dueDate: task.dueDate,
        endDate: task.endDate || task.dueDate,
        createdAt: task.createdAt,
        completedAt: status === 'done' ? task.updatedAt : undefined,
        subtaskCount: 0, // Will be implemented later
        tags: [], // Will be implemented later
        project: task.project?.name,
        projectId: task.projectId,
        taskPhaseId: task.taskPhaseId,
        boardLaneId: task.boardLaneId,
        order: task.order || 0
      };
    };

    // Get current user ID and company ID
    const currentUserId = computed(() => authStore.accountInformation?.id || null);
    const currentCompanyId = computed(() => authStore.accountInformation?.company?.id || null);

    const viewOptions: ViewOption[] = [
      { type: 'list', icon: 'view_list', label: 'List' },
      { type: 'board', icon: 'view_week', label: 'Board' },
      { type: 'card', icon: 'dashboard', label: 'Card' },
    ];

    const currentView = computed(() => taskSearchStore.viewType);

    const currentViewComponent = computed(() => {
      switch (currentView.value) {
        case 'board':
          return TaskBoardView;
        case 'card':
          return TaskCardView;
        case 'list':
        default:
          return TaskListView;
      }
    });

    const setView = (view: TaskViewType) => {
      taskSearchStore.setViewType(view);
    };

    const pageTitle = computed(() => {
      switch (props.filter) {
        case 'my':
          return 'My Tasks';
        case 'all':
          return 'All Tasks';
        case 'approval':
          return 'Approval Tasks';
        case 'due':
          return 'Due Tasks';
        case 'done':
          return 'Done Tasks';
        case 'assigned':
          return 'Assigned Tasks';
        case 'complete':
          return 'Complete Tasks';
        case 'deleted':
          return 'Deleted Tasks';
        default:
          return 'Tasks';
      }
    });

    const pageDescription = computed(() => {
      switch (props.filter) {
        case 'my':
          return 'Tasks assigned to you';
        case 'all':
          return 'View all tasks in the system';
        case 'approval':
          return 'Tasks pending your approval';
        case 'due':
          return 'Tasks approaching their deadline';
        case 'done':
          return 'Recently completed tasks';
        case 'assigned':
          return 'Tasks you have assigned to others';
        case 'complete':
          return 'All completed tasks archive';
        case 'deleted':
          return 'Tasks that have been deleted';
        default:
          return 'Manage your tasks';
      }
    });

    const filteredTasks = computed(() => {
      // Convert store tasks to Task array, filtering out null values
      const convertedTasks = storeTasks.value
        .map(convertTaskData)
        .filter(task => task !== null)
        .sort((a, b) => {
          // Treat null/undefined as very high number so they appear at bottom
          const aOrder = a.order ?? 999999;
          const bOrder = b.order ?? 999999;
          return aOrder - bOrder;
        }); // Always sort by order for consistent display

      // Tasks are already filtered by Supabase based on the filter prop
      // Just return the converted tasks without additional filtering
      // The taskTableConfig handles all filtering at the database level
      return convertedTasks;
    });

    const toggleTaskStatus = (task: Task) => {
      const newStatus = task.status === 'done' ? 'todo' : 'done';
      updateTaskStatus(task, newStatus);
    };

    const updateTaskStatus = async (task: Task, newStatus: string) => {
      // Map status to boardLaneId
      let boardLaneId = 1; // Default to BACKLOG
      switch (newStatus) {
        case 'done':
          boardLaneId = 3; // DONE
          break;
        case 'in_progress':
          boardLaneId = 2; // IN_PROGRESS
          break;
        case 'pending_approval':
          boardLaneId = 4; // Assuming 4 is PENDING_APPROVAL
          break;
      }

      const taskId = Number(task.id);

      // Optimistic update - immediately update the store for instant UI feedback
      taskStore.updateTask(taskId, {
        boardLaneId,
        status: newStatus,
        updatedAt: new Date().toISOString(),
        completedAt: newStatus === 'done' ? new Date().toISOString() : null
      });


      // Then sync with backend
      try {
        await taskStore.moveTask(taskId, boardLaneId);
      } catch (error) {
        // Error handling is done in the store with rollback
        console.error('Failed to update task status:', error);
      }
    };

    const openTaskMenu = (task: Task) => {
      // Open task action menu
      console.log('Open menu for task:', task);
    };

    // Helper function to get tasks for a specific section based on grouping mode
    const getTasksForSection = (sectionKey: string, allTasks: Task[]) => {
      const groupingMode = taskSearchStore.groupingMode;

      switch (groupingMode) {
        case 'none':
          return allTasks; // All tasks in one section

        case 'priority':
          // Filter by priority level
          if (sectionKey === 'urgent') return allTasks.filter(t => t.priority === 'urgent');
          if (sectionKey === 'high') return allTasks.filter(t => t.priority === 'high');
          if (sectionKey === 'medium') return allTasks.filter(t => t.priority === 'medium');
          if (sectionKey === 'low') return allTasks.filter(t => t.priority === 'low');
          if (sectionKey === 'verylow') return allTasks.filter(t => t.priority === 'verylow' || !t.priority);
          break;

        case 'assignee':
          // Filter by assignee ID - treat empty strings, null, and undefined as unassigned
          if (sectionKey === 'unassigned') {
            return allTasks.filter(t => {
              // Task is unassigned if it has no assignedToId
              return !t.assignedToId || t.assignedToId === '';
            });
          }
          // For assignee sections, extract the user ID from the key
          // Section key format: 'assignee-{userId}'
          const userId = sectionKey.replace('assignee-', '');
          return allTasks.filter(t => t.assignedToId === userId);

        case 'project':
          // Filter by project
          if (sectionKey === 'no-project') return allTasks.filter(t => !t.projectId && !t.project);
          // Extract project ID from section key
          const projectId = sectionKey.replace('project-', '');
          return allTasks.filter(t =>
            String(t.projectId) === projectId || String(t.project) === projectId
          );

        case 'taskPhase':
          // Group by task phases (milestones)
          // Extract phase ID from section key (format: "phase-123")
          if (sectionKey.startsWith('phase-')) {
            const phaseId = parseInt(sectionKey.replace('phase-', ''));
            return allTasks.filter(t => t.taskPhaseId === phaseId);
          }
          break;

        case 'stages':
          // Group by status stages
          if (sectionKey === 'todo') return allTasks.filter(t => t.status === 'todo' || t.status === 'backlog');
          if (sectionKey === 'in-progress') return allTasks.filter(t => t.status === 'in_progress' || t.status === 'active');
          if (sectionKey === 'done') return allTasks.filter(t => t.status === 'done' || t.status === 'completed' || t.status === 'finished');
          break;

        case 'deadline':
          // Group by deadline periods
          const now = new Date();
          now.setHours(0, 0, 0, 0);
          if (sectionKey === 'overdue') {
            return allTasks.filter(t => {
              if (t.dueDate) {
                const dueDate = new Date(t.dueDate);
                return dueDate < now;
              }
              return false;
            });
          }
          // Add other deadline sections as needed
          break;

        default:
          return allTasks;
      }

      return allTasks;
    };

    const addTaskToSection = async (section: string, title?: string, metadata?: any) => {
      // If title is provided, create task directly (inline creation)
      if (title) {
        // Set loading state at the start of inline creation
        creatingInlineTask.value = true;

        try {
        // Simple approach: Use -1 for all new tasks to ensure they appear at top
        // Existing tasks typically have positive order values (1000, 2000, etc)
        const newTaskOrder = -1;

        // Debug logging
        console.log('[DEBUG] Creating new task with order:', newTaskOrder);
        const allCurrentTasks = filteredTasks.value || [];
        const sectionTasks = getTasksForSection(section, allCurrentTasks);
        console.log('[DEBUG] Current task orders in section:',
          sectionTasks.map(t => ({ title: t.title, order: t.order })).slice(0, 5));

        // Prepare task data with section context
        const taskData: any = {
          title: title,
          description: '',
          status: 'todo',
          boardLaneId: 1, // TODO lane
          difficulty: 1, // Default difficulty (1 = easy)
          order: newTaskOrder, // Place at top of list
          // Default to OTHER mode for unassigned tasks (backend requires assignedMode)
          assignedMode: 'OTHER',
        };

        // Apply section-specific defaults based on grouping mode
        const groupingMode = taskSearchStore.groupingMode;

        // Handle assignment logic based on view and grouping
        // In "My Tasks" view: Always assign to current user
        if (props.filter === 'my' && currentUserId.value) {
          taskData.assignedToId = currentUserId.value;
          taskData.assignedMode = 'SELF';
        }
        // In "All Tasks" view: Tasks are unassigned by default (assignedMode: 'OTHER' with no assignedToId)
        // Exception: When grouped by assignee and adding to a specific assignee's section

        if (groupingMode === 'priority') {
          // Set priority based on section
          if (section === 'high') {
            taskData.priorityLevel = 4;
            taskData.priority = 'high';
          } else if (section === 'medium') {
            taskData.priorityLevel = 2;
            taskData.priority = 'medium';
          } else if (section === 'low') {
            taskData.priorityLevel = 1;
            taskData.priority = 'low';
          }
        } else if (groupingMode === 'assignee') {
          // Set assignee based on section (only in All Tasks view or when explicitly grouped)
          if (section !== 'unassigned') {
            // Use the userId from metadata if available
            if (metadata && metadata.userId) {
              taskData.assignedToId = metadata.userId;
            } else if (section.startsWith('assignee-')) {
              // Fallback: try to extract from section key (less reliable)
              console.warn('No metadata.userId provided for assignee section:', section);
              taskData.assignedToId = null; // Can't determine user ID without metadata
            } else {
              // Direct user ID (backward compatibility)
              taskData.assignedToId = section;
            }
            // Keep assignedMode as 'OTHER' (already set as default)
          }
          // If section is 'unassigned', leave task unassigned (assignedMode: 'OTHER' with no assignedToId)
        } else if (groupingMode === 'project') {
          // Set project based on section
          if (section !== 'no-project') {
            // Extract project ID from section key
            // Section format: project-{projectId}
            if (section.startsWith('project-')) {
              const projectId = section.replace('project-', '');
              taskData.projectId = parseInt(projectId);
            } else {
              taskData.projectId = parseInt(section);
            }
          }
        } else if (groupingMode === 'taskPhase') {
          // Set task phase based on section metadata
          if (metadata && metadata.phaseId) {
            taskData.taskPhaseId = metadata.phaseId;
          }
        } else if (groupingMode === 'stages') {
          // Set status based on section
          if (section === 'todo') {
            taskData.status = 'todo';
            taskData.boardLaneId = 1;
          } else if (section === 'in-progress') {
            taskData.status = 'in_progress';
            taskData.boardLaneId = 2;
          } else if (section === 'done') {
            taskData.status = 'done';
            taskData.boardLaneId = 3;
          }
        }

        // Always use Supabase for quick task creation (all grouping modes)
        // This provides immediate UI feedback for better UX
        let createdTask;

        // Ensure we have a company ID
        if (!currentCompanyId.value) {
          console.error('Cannot create task: No company ID found');
          return;
        }

        // Map priority string to uppercase for backend compatibility
        const mapPriorityToString = (priority?: string) => {
          if (!priority) return 'NORMAL';
          const map: Record<string, string> = {
            'verylow': 'LOW',
            'low': 'LOW',
            'medium': 'NORMAL',
            'high': 'HIGH',
            'urgent': 'URGENT'
          };
          return map[priority.toLowerCase()] || 'NORMAL';
        };

        // Map status to backend format
        const mapStatusToString = (status?: string) => {
          if (!status) return 'TODO';
          const map: Record<string, string> = {
            'todo': 'TODO',
            'in_progress': 'IN_PROGRESS',
            'doing': 'IN_PROGRESS',
            'done': 'DONE',
            'completed': 'DONE'
          };
          return map[status.toLowerCase()] || 'TODO';
        };

        // Prepare data for Supabase quick creation
        const quickTaskData = {
          name: taskData.title, // Map title to name for backend compatibility
          description: taskData.description || '',
          projectId: taskData.projectId || props.projectId || null,
          taskPhaseId: taskData.taskPhaseId || null, // Include task phase ID
          companyId: currentCompanyId.value,
          assignedTo: taskData.assignedToId || null,
          priority: mapPriorityToString(taskData.priority),
          status: mapStatusToString(taskData.status),
          dueDate: taskData.dueDate || null,
          boardLaneId: taskData.boardLaneId || 1,
          order: taskData.order || newTaskOrder
        };

        console.log('[DEBUG] Creating task with Supabase (all groups):', quickTaskData);
        createdTask = await taskStore.createQuickTask(quickTaskData);

        console.log('[DEBUG] Created task response:', createdTask);

        // Refetch to get the new task
        await refetchTasks();

        // Debug: Check task order after refetch
        setTimeout(() => {
          const updatedTasks = filteredTasks.value || [];
          const newTask = updatedTasks.find(t => t.title === title);
          console.log('[DEBUG] New task after refetch:', newTask);
          console.log('[DEBUG] First 3 tasks after refetch:',
            updatedTasks.slice(0, 3).map(t => ({ title: t.title, order: t.order })));
        }, 500);
        } catch (error) {
          console.error('[ERROR] Failed to create inline task:', error);
          Notify.create({
            type: 'negative',
            message: 'Failed to create task. Please try again.',
            position: 'top'
          });
        } finally {
          // Reset loading state after task creation completes (success or error)
          creatingInlineTask.value = false;
        }
      } else {
        // No title provided, open dialog (fallback)
        console.log('Add task to section:', section);
        openCreateDialog();
      }
    };

    // Flag to prevent watcher from overwriting during drag operations
    const isDraggingTask = ref(false);


    const handleReorderTasks = async (data: {
      fromSectionKey?: string;
      toSectionKey?: string;
      sectionKey: string;
      fromIndex: number;
      toIndex: number;
      task: Task;
      isMovingBetweenSections?: boolean;
      targetSectionMetadata?: any;
    }) => {
      const { toIndex, task, sectionKey, fromSectionKey, toSectionKey, isMovingBetweenSections, targetSectionMetadata } = data;

      // Use new section keys if available, otherwise fall back to sectionKey
      const sourceSectionKey = fromSectionKey || sectionKey;
      const targetSectionKey = toSectionKey || sectionKey;

      // Set flag to prevent watcher overwrite
      isDraggingTask.value = true;

      // Store the current grouping value for the persist function
      taskSearchStore.currentGroupingValue = targetSectionKey;

      // Note: taskPhaseId updates are now handled in the batch update below

      // Create a deep copy of all tasks to preserve original state
      const allTasks = (filteredTasks.value || []).map(t => ({ ...t }));

      // Handle moving between sections differently
      if (isMovingBetweenSections) {
        console.log('[DEBUG] Moving task between sections:', {
          from: sourceSectionKey,
          to: targetSectionKey,
          taskId: task.id,
          currentPriority: task.priority,
          currentAssignee: task.assignee
        });

        // Get tasks from both sections using the copied tasks array
        const sourceSectionTasks = getTasksForSection(sourceSectionKey, allTasks);
        const targetSectionTasks = getTasksForSection(targetSectionKey, allTasks);

        console.log('[DEBUG] Source section tasks:', sourceSectionTasks.length, 'IDs:', sourceSectionTasks.map(t => t.id));
        console.log('[DEBUG] Target section tasks:', targetSectionTasks.length, 'IDs:', targetSectionTasks.map(t => t.id));
        console.log('[DEBUG] Looking for task ID:', task.id, 'Type:', typeof task.id);

        // Find the task in the source section
        const taskIndexInSource = sourceSectionTasks.findIndex(t => t.id === task.id);
        if (taskIndexInSource === -1) {
          console.warn('[DEBUG] Task not found in source section. Checking target section...');
          // Sometimes the task might already be in the target section due to optimistic updates
          const taskIndexInTarget = targetSectionTasks.findIndex(t => t.id === task.id);
          if (taskIndexInTarget !== -1) {
            console.log('[DEBUG] Task already in target section at index:', taskIndexInTarget);
            // Task is already in target, just update its order if needed
            isDraggingTask.value = false;
            return;
          }
          console.error('[DEBUG] Task not found in either section! Task details:', {
            taskId: task.id,
            taskTitle: task.title,
            taskAssignee: task.assignee,
            sourceSectionKey,
            targetSectionKey
          });
          isDraggingTask.value = false;
          return;
        }

        // Remove from source section
        const [movedTask] = sourceSectionTasks.splice(taskIndexInSource, 1);

        // Add to target section at the specified position
        targetSectionTasks.splice(toIndex, 0, movedTask);

        console.log('[DEBUG] After move - source tasks:', sourceSectionTasks.length, 'target tasks:', targetSectionTasks.length);

        // (This code is now handled in the conditional block above)

        // Update order values for both sections
        const updates: Array<{
          id: number;
          order: number;
          taskPhaseId?: number;
          priorityLevel?: number;
          assignedToId?: string | null;
          projectId?: number | null;
          status?: string;
        }> = [];

        // Update source section orders
        sourceSectionTasks.forEach((t, index) => {
          const newOrder = 1000 + (index * 1000);
          if (t.order !== newOrder) {
            updates.push({ id: parseInt(t.id), order: newOrder });
            t.order = newOrder;
          }
        });

        // Update target section orders
        targetSectionTasks.forEach((t, index) => {
          const newOrder = 1000 + (index * 1000);
          const updateItem: {
            id: number;
            order: number;
            taskPhaseId?: number;
            priorityLevel?: number;
            assignedToId?: string | null;
            projectId?: number | null;
            status?: string;
          } = {
            id: parseInt(t.id),
            order: newOrder
          };

          // Update fields based on grouping mode when moving between sections
          if (t.id === task.id) {
            // Handle taskPhase grouping
            if (taskSearchStore.groupingMode === 'taskPhase') {
              const targetPhaseId = targetSectionKey.startsWith('phase-')
                ? parseInt(targetSectionKey.replace('phase-', ''))
                : null;
              if (targetPhaseId && t.taskPhaseId !== targetPhaseId) {
                updateItem.taskPhaseId = targetPhaseId;
                t.taskPhaseId = targetPhaseId;
              }
            }

            // Handle priority grouping
            if (taskSearchStore.groupingMode === 'priority') {
              const priorityMap: Record<string, number> = {
                'urgent': 4,
                'high': 3,
                'medium': 2,
                'low': 1,
                'verylow': 0
              };
              if (priorityMap[targetSectionKey] !== undefined) {
                updateItem.priorityLevel = priorityMap[targetSectionKey];
                t.priorityLevel = priorityMap[targetSectionKey];
                // Update priority string as well
                t.priority = targetSectionKey as 'verylow' | 'low' | 'medium' | 'high' | 'urgent';
              }
            }

            // Handle assignee grouping
            if (taskSearchStore.groupingMode === 'assignee') {
              if (targetSectionKey === 'unassigned') {
                updateItem.assignedToId = null;
                t.assignedToId = null;
                t.assignee = null;
              } else if (targetSectionMetadata?.userId) {
                // Use the actual user ID from section metadata
                const userId = targetSectionMetadata.userId;
                updateItem.assignedToId = userId;
                t.assignedToId = userId;

                // Look up the user's name from availableUsers for UI display
                const user = availableUsers.value.find(u => u.id === userId);
                if (user) {
                  t.assignee = user.name;
                  console.log('[DEBUG] Assigning task to user:', userId, '(' + user.name + ')');
                } else {
                  // Fallback if user not found in list
                  t.assignee = 'User ' + userId;
                  console.warn('[DEBUG] User not found in availableUsers:', userId);
                }
              } else {
                console.error('[DEBUG] No metadata.userId available for assignee section:', targetSectionKey);
                // This should not happen with the new ID-based system
              }
            }

            // Handle project grouping
            if (taskSearchStore.groupingMode === 'project') {
              if (targetSectionKey === 'no-project') {
                updateItem.projectId = null;
                t.projectId = null;
                t.projectName = null as string | null;
              } else {
                const projectId = parseInt(targetSectionKey.replace('project-', ''));
                if (!isNaN(projectId)) {
                  updateItem.projectId = projectId;
                  t.projectId = projectId;
                  // Note: projectName would need to be looked up or passed from the section
                }
              }
            }

            // Handle stages grouping
            if (taskSearchStore.groupingMode === 'stages') {
              const statusMap: Record<string, string> = {
                'todo': 'todo',
                'in-progress': 'in_progress',
                'done': 'done'
              };
              if (statusMap[targetSectionKey]) {
                updateItem.status = statusMap[targetSectionKey];
                t.status = statusMap[targetSectionKey];
              }
            }
          }

          if (t.order !== newOrder ||
              updateItem.taskPhaseId !== undefined ||
              updateItem.priorityLevel !== undefined ||
              updateItem.assignedToId !== undefined ||
              updateItem.projectId !== undefined ||
              updateItem.status !== undefined) {
            updates.push(updateItem);
            t.order = newOrder;
          }
        });

        // Update the complete task list
        const finalTasks = allTasks.map(t => {
          const updatedInSource = sourceSectionTasks.find(st => st.id === t.id);
          const updatedInTarget = targetSectionTasks.find(st => st.id === t.id);
          if (updatedInSource) return updatedInSource;
          if (updatedInTarget) return updatedInTarget;
          return t;
        });

        // Update store
        const storeFormatTasks = storeTasks.value.map(storeTask => {
          const updatedTask = finalTasks.find(t => t.id === String(storeTask.id));
          if (updatedTask) {
            return {
              ...storeTask,
              order: updatedTask.order,
              taskPhaseId: updatedTask.taskPhaseId,
              priority: updatedTask.priority,
              priorityLevel: updatedTask.priorityLevel,
              assignedToId: updatedTask.assignedToId,
              assignee: updatedTask.assignee,
              projectId: updatedTask.projectId,
              projectName: updatedTask.projectName,
              status: updatedTask.status
            };
          }
          return storeTask;
        });

        taskStore.setTasks(storeFormatTasks);

        // Batch update orders via backend API
        if (updates.length > 0) {
          console.log('[DEBUG] Sending batch updates to backend API:', updates);
          // TODO: Migrate to backend API - useTask composable deleted
          // const taskComposable = useTask();
          // await taskComposable.batchUpdateTaskOrders(updates);
          await persistTaskOrder(updates);
          console.log('[DEBUG] Batch update completed');
        }
      } else {
        // Reordering within the same section - complete redesign
        // Use the copied tasks array to avoid mutation issues
        const sectionTasks = getTasksForSection(targetSectionKey, allTasks);

        // Find the actual position of the dragged task
        const actualFromIndex = sectionTasks.findIndex(t => t.id === task.id);

        // Validate that the task exists in the section
        if (actualFromIndex === -1) {
          console.warn('Task not found in section, refreshing...');
          isDraggingTask.value = false;
          return;
        }

        // The toIndex is the visual position where user dropped
        // We need to determine if we're dragging up or down based on actual positions

        // For direction, we compare the actual position with the visual drop position
        // But toIndex might be out of bounds if the visual and actual differ
        const maxIndex = sectionTasks.length - 1;
        const safeToIndex = Math.min(toIndex, maxIndex);

        // Determine drag direction
        const isDraggingDown = actualFromIndex < safeToIndex;
        const isDraggingUp = actualFromIndex > safeToIndex;

        // Remove the task from its current position
        const [movedTask] = sectionTasks.splice(actualFromIndex, 1);

        // Calculate insertion index based on direction
        let insertIndex = safeToIndex;

        if (isDraggingDown) {
          // When dragging down, we want to insert AFTER the target
          // After removal, the target has shifted up by 1 position
          // So we use the original toIndex - 1 to get after the target
          insertIndex = Math.min(safeToIndex, sectionTasks.length);
        } else if (isDraggingUp) {
          // When dragging up, we want to insert BEFORE the target
          // The target hasn't moved, so we insert at its position
          insertIndex = safeToIndex;
        }

        // Insert at the calculated position
        sectionTasks.splice(insertIndex, 0, movedTask);

        // Calculate new order values ONLY for tasks in this section
        const updates: Array<{ id: number; order: number }> = [];

      // For grouped views, maintain section-specific ordering
      if (taskSearchStore.groupingMode !== 'none') {
        // Get min and max order values in the section for proper spacing
        let minOrder = Math.min(...sectionTasks.map(t => t.order || 0));
        let maxOrder = Math.max(...sectionTasks.map(t => t.order || 0));

        // If no valid orders, start from a base value
        if (minOrder === 0 && maxOrder === 0) {
          minOrder = 1000;
          maxOrder = sectionTasks.length * 1000;
        }

        // Assign new order values with gaps for the section
        sectionTasks.forEach((t, index) => {
          const newOrder = minOrder + (index * 1000); // Maintain gaps for future insertions
          if (t.order !== newOrder) {
            updates.push({ id: parseInt(t.id), order: newOrder });
            t.order = newOrder; // Update the task object
          }
        });

        // Update only the affected section tasks in the complete list
        const finalTasks = allTasks.map(t => {
          const updatedTask = sectionTasks.find(st => st.id === t.id);
          if (updatedTask) {
            return updatedTask; // Use the reordered task with new order
          }
          return t; // Keep other tasks unchanged
        });

        // Update store with the modified tasks
        const storeFormatTasks = storeTasks.value.map(storeTask => {
          const updatedTask = finalTasks.find(t => t.id === String(storeTask.id));
          if (updatedTask) {
            return {
              ...storeTask,
              order: updatedTask.order,
              priority: updatedTask.priority,
              priorityLevel: updatedTask.priorityLevel,
              assignedToId: updatedTask.assignedToId,
              assignee: updatedTask.assignee,
              projectId: updatedTask.projectId,
              projectName: updatedTask.projectName,
              status: updatedTask.status
            };
          }
          return storeTask;
        });

        taskStore.setTasks(storeFormatTasks);
      } else {
        // For 'none' grouping mode, reorder all tasks globally
        const reorderedAllTasks = allTasks.map(t => {
          const indexInSection = sectionTasks.findIndex(st => st.id === t.id);
          if (indexInSection !== -1) {
            return sectionTasks[indexInSection];
          }
          return t;
        });

        // Calculate new order values for all tasks
        const finalTasks = reorderedAllTasks.map((t, index) => {
          const newOrder = (index + 1) * 1000;
          if (t.order !== newOrder) {
            updates.push({ id: parseInt(t.id), order: newOrder });
            return { ...t, order: newOrder };
          }
          return t;
        });

        // Update store
        const storeFormatTasks = storeTasks.value.map(storeTask => {
          const updatedTask = finalTasks.find(t => t.id === String(storeTask.id));
          if (updatedTask) {
            return {
              ...storeTask,
              order: updatedTask.order,
              priority: updatedTask.priority,
              priorityLevel: updatedTask.priorityLevel,
              assignedToId: updatedTask.assignedToId,
              assignee: updatedTask.assignee,
              projectId: updatedTask.projectId,
              projectName: updatedTask.projectName,
              status: updatedTask.status
            };
          }
          return storeTask;
        });

        const sortedTasks = storeFormatTasks.sort((a, b) => (a.order || 0) - (b.order || 0));
        taskStore.setTasks(sortedTasks);
      }

        // Persist to API in the background (don't await)
        persistTaskOrder(updates).then(() => {
          // Successfully saved, allow watcher updates again
          isDraggingTask.value = false;
        }).catch(async (error) => {
          console.error('Failed to save task order:', error);
          Notify.create({
            type: 'negative',
            message: 'Failed to save task order. Reverting changes...',
            position: 'top'
          });
          // Reset flag and rollback by refreshing data
          isDraggingTask.value = false;
          await refetchTasks();
        });
      } // End of else block for reordering within same section
    };

    // Persist task order using backend API (TASK-BACKEND-API-MIGRATION)
    // Replaces Supabase direct updates to fix RLS blocking issue
    const persistTaskOrder = async (updates: Array<{ id: number; order: number }>) => {
      // Map filter prop to viewType for backend API
      const viewType = props.filter === 'my' ? 'my' : 'all';

      // Call backend API instead of Supabase direct
      await updateTaskOrderingAPI({
        taskOrders: updates,
        viewType,
        groupingMode: taskSearchStore.groupingMode,
        groupingValue: taskSearchStore.currentGroupingValue
      });
    };

    // Initialize backend API composable for task fetching
    const taskAPIFilters = computed(() => {
      const filters: any = {
        filter: props.filter, // Pass the view type to useTaskAPI (CRITICAL - determines viewType)
        isDeleted: props.filter === 'deleted', // Include deleted only for deleted view
      };

      // Add company filter (required for multi-tenant)
      if (currentCompanyId.value) {
        filters.companyId = currentCompanyId.value;
      }

      // Add project filter when provided
      if (props.projectId) {
        filters.projectId = Number(props.projectId);
      }

      // Apply filter based on route - build filters for backend API
      switch (props.filter) {
        case 'my':
          // My tasks - assigned to current user, exclude completed
          if (currentUserId.value) {
            filters.assignedToId = currentUserId.value;
          }
          // Backend will filter out DONE lane and APPROVAL tasks
          break;

        case 'all':
          // All tasks - backend will handle filtering
          break;

        case 'approval':
          // Approval tasks only
          filters.taskType = 'APPROVAL';
          break;

        case 'due':
          // Due tasks - backend should handle date filtering
          // For now, fetch all and filter client-side
          break;

        case 'done':
          // Recently done tasks
          filters.boardLaneId = 3; // DONE lane
          break;

        case 'assigned':
          // Tasks created by current user
          if (currentUserId.value) {
            filters.createdById = currentUserId.value;
          }
          break;

        case 'complete':
          // All completed tasks
          filters.boardLaneId = 3; // DONE lane
          break;

        case 'deleted':
          // Deleted tasks
          filters.isDeleted = true;
          break;
      }

      return filters;
    });

    const {
      data: apiTasks,
      loading: apiLoading,
      refetch: refetchTasksFromAPI,
      updateTaskOrdering: updateTaskOrderingAPI
    } = useTaskAPI({
      filters: taskAPIFilters.value,
      autoFetch: true
    });

    // Assign the actual refetch function
    refetchTasks = refetchTasksFromAPI;

    // Set up realtime subscription
    const { isConnected: realtimeConnected } = useTaskRealtime({
      immediate: true
    });
    console.log('Realtime connection status:', realtimeConnected.value);

    // convertTaskData function is already defined earlier

    // Watch for API data changes
    watch(apiTasks, (newTasks) => {
      if (newTasks && !isDraggingTask.value) {
        // Only update store if not currently dragging
        // This prevents overwriting our optimistic updates
        taskStore.setTasks(newTasks);
      }
    }, { immediate: true });

    // Watch loading state
    watch(apiLoading, (newLoading) => {
      loading.value = newLoading;
    }, { immediate: true });

    // loadTasks is now handled automatically by useTaskAPI
    // Keeping mock data for reference (can be removed later)
    [
          {
            id: '1',
            title: 'Task 1',
            description: 'Review and provide feedback on the Q1 project proposal',
            status: 'todo',
            priority: 'low',
            trackingStatus: 'on_track',
            assignee: 'Guillermo Tabligan',
            creator: 'admin',
            project: 'proj1',
            dueDate: new Date(Date.now()).toISOString(), // Today
            endDate: new Date(Date.now() + 16 * 24 * 60 * 60 * 1000).toISOString(), // Sep 16
            createdAt: new Date().toISOString(),
            subtaskCount: 3,
            tags: ['project', 'q1'],
          },
          {
            id: '2',
            title: 'Task 2',
            description: 'Update API documentation with new endpoints',
            status: 'todo',
            priority: 'medium',
            trackingStatus: 'at_risk',
            assignee: 'Guillermo Tabligan',
            creator: 'current_user',
            project: 'proj2',
            dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(), // Sep 15
            endDate: new Date(Date.now() + 17 * 24 * 60 * 60 * 1000).toISOString(), // Sep 17
            createdAt: new Date().toISOString(),
            subtaskCount: 0,
            tags: ['docs'],
          },
          {
            id: '3',
            title: 'Task 3',
            description: 'Review pull request #123',
            status: 'todo',
            priority: 'high',
            trackingStatus: 'off_track',
            assignee: 'current_user',
            creator: 'developer',
            project: 'proj5',
            dueDate: new Date(Date.now() + 16 * 24 * 60 * 60 * 1000).toISOString(), // Sep 16
            endDate: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000).toISOString(), // Sep 18
            createdAt: new Date().toISOString(),
            subtaskCount: 2,
            tags: ['review', 'urgent'],
          },
          {
            id: '4',
            title: 'Deploy to staging',
            description: 'Deploy latest changes to staging environment',
            status: 'in_progress',
            priority: 'medium',
            trackingStatus: 'on_track',
            assignee: 'John Doe',
            creator: 'current_user',
            project: 'proj4',
            dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
            createdAt: new Date().toISOString(),
            subtaskCount: 0,
            tags: ['deployment'],
          },
          {
            id: '5',
            title: 'Write unit tests',
            description: 'Add unit tests for new features',
            status: 'done',
            priority: 'low',
            trackingStatus: 'on_track',
            assignee: 'Jane Smith',
            creator: 'current_user',
            project: 'proj2',
            dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            createdAt: new Date().toISOString(),
            subtaskCount: 5,
            tags: ['testing'],
          },
        ];

    // Mock data section removed - now using store data with realtime updates
    // if (supabaseError.value && storeTasks.value.length === 0) {
    //   console.warn('Using mock data due to Supabase error:', supabaseError.value);
    //   // Could set mock data in store if needed: taskStore.setTasks(mockTasks);
    // }

    const handleTaskCreated = async (taskData: any) => {
      // Create task via store which will update Supabase
      await taskStore.createTask(taskData);
      showCreateDialog.value = false;
      // Refetch to get the new task
      await refetchTasks();
    };

    const editTask = (task: Task) => {
      // TODO: Implement edit task
      console.log('Edit task:', task);
    };

    const viewTask = (task: Task) => {
      // Emit event to show task information dialog via global event bus
      bus.emit('showTaskDialog', { task, fromDiscussion: false });
    };

    const deleteTask = async (task: Task) => {
      // Delete via store with optimistic update (immediate UI feedback)
      try {
        await taskStore.deleteTask(Number(task.id));
        // No need to refetch - optimistic update handles UI immediately
        // The store will handle rollback if the API call fails
      } catch (error) {
        // Error is already handled in the store with rollback
        console.error('Delete task failed:', error);
      }
    };

    const restoreTask = async (task: Task) => {
      // Restore via store
      try {
        await taskStore.restoreTask(Number(task.id));
        // Refetch to update the list
        await refetchTasks();
      } catch (error) {
        // Error is already handled in the store
        console.error('Restore task failed:', error);
      }
    };

    // Handler for inline field updates with optimistic updates
    const updateTaskField = async (task: Task, field: string, value: any, extraData?: any) => {
      const taskId = Number(task.id);

      // First, apply optimistic update immediately to the store for instant UI feedback
      // This makes the change appear instantly in the UI

      switch (field) {
        case 'title':
        case 'description': {
          // Update store immediately for instant UI feedback
          taskStore.updateTask(taskId, { [field]: value });
          // Then sync with backend
          await taskStore.updateTaskInDB(taskId, { [field]: value });
          break;
        }

        case 'assignee':
        case 'assignedToId': {
          // Update store immediately with assignee info
          if (value) {
            taskStore.updateTask(taskId, {
              assignedToId: value,
              assignee: extraData || 'Updating...',
              assignedTo: null  // Clear the relation object to ensure assignee field is used
            });
          } else {
            taskStore.updateTask(taskId, {
              assignedToId: null,
              assignee: 'Unassigned',
              assignedTo: null  // Clear the relation object
            });
          }
          // Then sync with backend
          await taskStore.assignTask(taskId, value, extraData);
          break;
        }

        case 'priority': {
          // Convert priority string to level
          let priorityLevel = 0;
          if (value === 'urgent') priorityLevel = 4;
          else if (value === 'high') priorityLevel = 3;
          else if (value === 'medium') priorityLevel = 2;
          else if (value === 'low') priorityLevel = 1;
          else if (value === 'verylow') priorityLevel = 0;

          // Update store immediately
          taskStore.updateTask(taskId, { priorityLevel, priority: value });
          // Then sync with backend
          await taskStore.updateTaskPriority(taskId, priorityLevel);
          break;
        }

        case 'dueDate': {
          // Update store immediately
          taskStore.updateTask(taskId, { dueDate: value });
          // Then sync with backend
          await taskStore.updateTaskDueDate(taskId, value);
          break;
        }

        case 'projectId': {
          // Update store immediately
          taskStore.updateTask(taskId, { projectId: value });
          // Then sync with backend
          await taskStore.updateTaskInDB(taskId, { projectId: value });
          break;
        }

        default: {
          // Update store immediately
          taskStore.updateTask(taskId, { [field]: value });
          // Then sync with backend
          await taskStore.updateTaskInDB(taskId, { [field]: value });
          break;
        }
      }
    };

    // Clear search when component unmounts or route changes
    watch(() => route.name, () => {
      taskSearchStore.clearSearch();
    });

    onMounted(async () => {
      // Tasks are loaded via backend API through useTaskAPI
      // Just ensure store has custom sections loaded
      taskStore.loadCustomSections();
    });

    // Refetch data when component is re-activated (returning from navigation)
    onActivated(async () => {
      console.log('[DEBUG] TaskList: Component activated, refetching from backend API');
      // Trigger refetch of tasks from backend API
      await refetchTasks();
    });

    return {
      loading,
      creatingInlineTask,
      pageTitle,
      pageDescription,
      filteredTasks,
      viewOptions,
      currentView,
      currentViewComponent,
      setView,
      openCreateDialog,
      showCreateDialog,
      handleTaskCreated,
      editTask,
      viewTask,
      deleteTask,
      restoreTask,
      toggleTaskStatus,
      updateTaskStatus,
      updateTaskField,
      openTaskMenu,
      addTaskToSection,
      handleReorderTasks,
    };
  },
});
</script>

<style lang="scss" scoped src="./Task.scss"></style>

<style lang="scss" scoped>
.task-list-container {

  .page-content {
    min-height: calc(100vh - 160px);
  }

  // Compact mode styles for fullscreen task management
  &.compact-mode {
    .page-content {
      min-height: unset;
      padding: 0;
      margin: 0;
    }
  }

}

@media (max-width: 768px) {
  .task-list-container {
    padding: 8px;

    .task-view-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 8px;

      .header-left {
        width: 100%;

        h1 {
          font-size: 18px;
        }
      }
    }
  }
}
</style>