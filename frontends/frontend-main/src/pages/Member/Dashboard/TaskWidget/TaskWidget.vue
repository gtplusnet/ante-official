<template>
  <div>
    <GlobalWidgetCard>
      <!-- Title -->
      <template #title>
        <div class="row items-center no-wrap">
          <span>Task List</span>
        </div>
      </template>

      <!-- Title More Actions -->
      <template #more-actions>
        <q-icon
          flat
          round
          dense
          name="more_vert"
          color="grey-7"
          size="20px"
          class="task-menu-button"
          @click="isMobileMoreActionsDialogOpen = true"
        />
      </template>

      <!-- Actions -->
      <template #actions>
        <div class="task-widget-actions">
          <!-- tabs -->
          <div class="task-tabs-wrapper">
            <global-widget-tab
              :tabs="tabsWithBadges"
              :modelValue="activeTab"
              @update:modelValue="loadTaskTab"
            />
          </div>
          <!-- filter and more actions -->
          <GlobalWidgetMoreActions
            :filter-actions="filterActions"
            :more-actions="moreActionsItems"
            filter-test-id="task-widget-filter-menu"
            more-test-id="task-widget-more-menu"
            @filter-click="handleFilterClick"
            @more-click="handleMoreClick"
          />
        </div>
      </template>

      <!-- Content -->
      <template #content>
        <div class="col-auto q-mb-md" v-if="searchActive">
          <q-input
            outlined
            dense
            v-model="search"
            placeholder="Search Task Name"
            @keyup="loadTaskList"
          />
        </div>
        <!-- task loading -->
        <div class="task-content">
          <template v-if="isTaskListLoading">
            <GlobalLoader />
          </template>
          <template v-else>
            <!-- task loaded -->
            <div class="task-rows">
              <!-- to be updated for actual status (task is read == true) -->
              <template v-if="paginatedTasks.length > 0">
                <TaskCard
                  v-for="task in paginatedTasks"
                  :key="task.id"
                  :task="task"
                  @click="showTaskInformation"
                  @action-completed="handleApprovalAction"
                />
              </template>
              <template v-else>
                <div class="q-pa-xl text-center text-label-medium text-grey">No Task</div>
              </template>
            </div>
          </template>
        </div>
      </template>

      <!-- Footer -->
      <template #footer>
        <GlobalWidgetPagination
          :pagination="{
            currentPage: pagination.page,
            totalItems: taskList.length,
            itemsPerPage: pagination.rowsPerPage,
          }"
          @update:page="handlePageChange"
        />
      </template>
    </GlobalWidgetCard>
    <!-- task information dialog -->
    <TaskInformationDialog
      @updateTaskList="loadTaskList"
      v-if="taskInformation"
      v-model="isTaskInformationDialogOpen"
      :taskInformation="taskInformation"
    />
    <!-- task account summary dialog -->
    <TaskAccountSummaryDialog v-model="isTaskAccountSummaryDialogOpen" />
    <!-- task create dialog -->
    <TaskCreateDialog v-model="isTaskCreateDialogOpen" />
    <!-- Filing approval dialog -->
    <FilingApprovalDialog
      v-model="isFilingApprovalDialogOpen"
      :filing="currentFilingForApproval"
      :task="currentApprovalTask"
      @approved="handleFilingApprovalComplete"
      @rejected="handleFilingApprovalComplete"
      @info-requested="handleFilingApprovalComplete"
    />
    <!-- Payroll approval dialog -->
    <PayrollApprovalDialog
      v-model="isPayrollApprovalDialogOpen"
      :payrollData="currentPayrollForApproval"
      @approved="handlePayrollApprovalComplete"
      @rejected="handlePayrollApprovalComplete"
    />

    <!-- Mobile More Actions Dialog -->
    <GlobalMoreActionMobileDialog
      v-model="isMobileMoreActionsDialogOpen"
      :actions="mobileActionItems"
      title="Task List"
    />
  </div>
</template>
<style scoped src="./TaskWidget.scss"></style>
<script lang="ts">
import { defineComponent, ref, reactive, computed, onMounted, onUnmounted, getCurrentInstance, watchEffect } from 'vue';
import { defineAsyncComponent } from 'vue';
import TaskCard from './Partial/cards/TaskCard.vue';
import { api } from 'src/boot/axios';
import GlobalLoader from '../../../../components/shared/common/GlobalLoader.vue';
import GlobalWidgetCard from '../../../../components/shared/global/GlobalWidgetCard.vue';
import GlobalWidgetPagination from '../../../../components/shared/global/GlobalWidgetPagination.vue';
import GlobalWidgetMoreActions from '../../../../components/shared/global/GlobalWidgetMoreActions.vue';
import { useQuasar } from 'quasar';
// Import shared interfaces from backend
import {
  CombinedTaskResponseInterface,
} from 'src/shared/interfaces/task.interfaces';
import { DateFormat } from '@shared/response';

// Extend TaskCountByStatusResponseInterface to include approvals
interface ExtendedTaskCountByStatusResponseInterface {
  activeTaskCount: number;
  assignedTaskCount: number;
  completedTaskCount: number;
  approvalTaskCount: number;
}
import GlobalWidgetTab from '../../../../components/shared/global/GlobalWidgetTab.vue';
import { useAuthStore } from '../../../../stores/auth';
// Import backend API composable (replaces direct Supabase access)
import { useTaskDashboardAPI } from 'src/composables/api/useTaskAPI';
// Import task references for transforming numeric values
import taskPriorityReference from 'src/references/task-priority.reference';
import taskDifficultyReference from 'src/references/task-difficulty.reference';
import boardLaneReference from 'src/references/board-lane.reference';

// Lazy-loaded dialogs (ALL dialogs must be lazy loaded - CLAUDE.md)
const TaskInformationDialog = defineAsyncComponent(() =>
  import('../../../../components/dialog/TaskInformationDialog/TaskInformationDialog.vue')
);
const TaskAccountSummaryDialog = defineAsyncComponent(() =>
  import('../../../../components/dialog/TaskAccountSummaryDialog/TaskAccountSummaryDialog.vue')
);
const TaskCreateDialog = defineAsyncComponent(() =>
  import('../../../../components/dialog/TaskCreateDialog/TaskCreateDialog.vue')
);
const FilingApprovalDialog = defineAsyncComponent(() =>
  import('../../../../components/dialog/FilingApprovalDialog/FilingApprovalDialog.vue')
);
const PayrollApprovalDialog = defineAsyncComponent(() =>
  import('../../../../pages/Member/Manpower/dialogs/payroll/PayrollApprovalDialog.vue')
);
const GlobalMoreActionMobileDialog = defineAsyncComponent(() =>
  import('../../../../components/shared/global/GlobalMoreActionMobileDialog.vue')
);

// Define tag interface for UI display
interface TagInfo {
  id?: string | number; // Add optional id property that's used in the template
  key?: string; // Add optional key property for consistency
  label: string;
  color: string;
  textColor: string;
}

// Create a UI-specific extension of the backend interface
interface TaskWithUIProps extends CombinedTaskResponseInterface {
  tags: TagInfo[];
}

interface TabItem {
  key: string;
  title: string;
}

interface Pagination {
  page: number;
  rowsPerPage: number;
  pagination?: {
    rowsPerPage: number;
  };
}

// This interface is now used indirectly through the computed columns property
// where we use explicit typing for each row parameter

export default defineComponent({
  name: 'TaskWidget',
  components: {
    GlobalLoader,
    GlobalWidgetCard,
    GlobalWidgetPagination,
    GlobalWidgetTab,
    GlobalWidgetMoreActions,
    GlobalMoreActionMobileDialog,
    TaskInformationDialog,
    TaskAccountSummaryDialog,
    TaskCreateDialog,
    FilingApprovalDialog,
    PayrollApprovalDialog,
    TaskCard,
  },
  setup() {
    const $q = useQuasar();
    const instance = getCurrentInstance();
    const bus = instance?.appContext.config.globalProperties.$bus;
    const authStore = useAuthStore();

    // Get current user ID and company ID from auth store
    const currentUserId = computed(() => authStore.accountInformation?.id || null);
    const currentCompanyId = computed(() => authStore.accountInformation?.company?.id || null);

    const taskCountByStatus = ref<ExtendedTaskCountByStatusResponseInterface | null>({
      activeTaskCount: 0,
      assignedTaskCount: 0,
      completedTaskCount: 0,
      approvalTaskCount: 0,
    });

    // Initialize pagination state
    const pagination = reactive<Pagination>({
      page: 1,
      rowsPerPage: 5,
    });

    // Reactive state (must be defined before API composable uses them)
    const isTaskInformationDialogOpen = ref(false);
    const isTaskAccountSummaryDialogOpen = ref(false);
    const isTaskCreateDialogOpen = ref(false);
    const isFilingApprovalDialogOpen = ref(false);
    const isPayrollApprovalDialogOpen = ref(false);
    const isMobileMoreActionsDialogOpen = ref(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const currentFilingForApproval = ref<any>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const currentPayrollForApproval = ref<any>(null);
    const currentApprovalTask = ref<TaskWithUIProps | null>(null);
    const taskInformation = ref<CombinedTaskResponseInterface | null>(null);
    const activeTab = ref('active');
    const taskList = ref<TaskWithUIProps[]>([]);
    const search = ref('');
    const searchActive = ref(false);
    const sortBy = ref('createdAt');
    const descending = ref(false);
    const currentSortOption = ref<'all' | 'project' | 'priority' | 'dueDate' | null>(null);

    // Initialize backend API composable (replaces Supabase direct access)
    // This single composable handles all three tabs (active, assigned, approvals)
    const {
      tasks: apiTasks,
      counts: apiCounts,
      loading: apiLoading,
      refetch: refetchDashboard
    } = useTaskDashboardAPI({
      tab: activeTab as any, // Will be reactive
      search: search as any, // Will be reactive
      autoFetch: true
    });

    // Tab list
    const tabList = reactive<TabItem[]>([
      {
        key: 'active',
        title: 'My Task',
      },
      {
        key: 'approvals',
        title: 'Approvals',
      },
      {
        key: 'assigned',
        title: 'Assigned',
      },

    ]);

    // Helper function to transform Supabase task data to frontend format
    const transformSupabaseTask = (
      task: any
    ): CombinedTaskResponseInterface => {
      // Map priority level (numeric) to reference object
      let priorityLevel = taskPriorityReference.find(
        (ref) => ref.key === task.priorityLevel
      ) || taskPriorityReference[0];

      // Map difficulty level (numeric) to reference object
      let assignedToDifficultySet = taskDifficultyReference.find(
        (ref) => ref.key === task.assignedToDifficultySet
      ) || taskDifficultyReference[0];

      let assignedByDifficultySet = taskDifficultyReference.find(
        (ref) => ref.key === task.assignedByDifficultySet
      ) || taskDifficultyReference[0];

      // Map board lane to reference object
      let boardLane = null;
      if (task.boardLane) {
        const laneRef = boardLaneReference.find(
          (ref) => ref.key === task.boardLane.key
        );
        if (laneRef) {
          boardLane = {
            ...task.boardLane,
            key: laneRef
          };
        } else {
          boardLane = task.boardLane;
        }
      }

      // Format dates
      const formatDate = (date: string | Date | null) => {
        if (!date) return null;
        // The backend's manilaToUTC shifts dates back 8 hours
        // So we need to add 8 hours to get the correct date
        const dateObj = new Date(date);
        dateObj.setHours(dateObj.getHours() + 8);

        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        const dateStandard = `${year}-${month}-${day}`; // "2025-10-10"

        // Calculate timeAgo
        const now = new Date();
        const diffMs = now.getTime() - dateObj.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        let timeAgo = '';
        if (diffMins < 1) timeAgo = 'just now';
        else if (diffMins < 60) timeAgo = `${diffMins}m ago`;
        else if (diffHours < 24) timeAgo = `${diffHours}h ago`;
        else if (diffDays < 30) timeAgo = `${diffDays}d ago`;
        else timeAgo = dateObj.toLocaleDateString();

        return {
          raw: date,
          formatted: dateObj.toLocaleDateString(),
          date: dateStandard,
          dateStandard: dateStandard,
          timeAgo: timeAgo
        };
      };

      // Process ApprovalMetadata if present
      let approvalMetadata = null;
      if (task.ApprovalMetadata && Array.isArray(task.ApprovalMetadata) && task.ApprovalMetadata.length > 0) {
        // Take the first metadata if it's an array (should be single due to one-to-one relation)
        const metadata = task.ApprovalMetadata[0];
        approvalMetadata = {
          id: metadata.id,
          sourceModule: metadata.sourceModule,
          sourceId: metadata.sourceId,
          actions: typeof metadata.actions === 'string' ? JSON.parse(metadata.actions) : metadata.actions,
          approvalLevel: metadata.approvalLevel,
          maxApprovalLevel: metadata.maxApprovalLevel,
          sourceData: typeof metadata.sourceData === 'string' ? JSON.parse(metadata.sourceData) : metadata.sourceData,
          approvalChain: metadata.approvalChain,
          remarks: metadata.remarks,
          approvedAt: metadata.approvedAt
        };
      } else if (task.ApprovalMetadata && !Array.isArray(task.ApprovalMetadata)) {
        // Handle single object case
        const metadata = task.ApprovalMetadata;
        approvalMetadata = {
          id: metadata.id,
          sourceModule: metadata.sourceModule,
          sourceId: metadata.sourceId,
          actions: typeof metadata.actions === 'string' ? JSON.parse(metadata.actions) : metadata.actions,
          approvalLevel: metadata.approvalLevel,
          maxApprovalLevel: metadata.maxApprovalLevel,
          sourceData: typeof metadata.sourceData === 'string' ? JSON.parse(metadata.sourceData) : metadata.sourceData,
          approvalChain: metadata.approvalChain,
          remarks: metadata.remarks,
          approvedAt: metadata.approvedAt
        };
      }

      // Build the transformed task
      const transformedTask: CombinedTaskResponseInterface = {
        ...task,
        priorityLevel,
        assignedToDifficultySet,
        assignedByDifficultySet,
        boardLane,
        createdAt: formatDate(task.createdAt),
        updatedAt: formatDate(task.updatedAt),
        dueDate: formatDate(task.dueDate),
        taskType: task.taskType || 'NORMAL',
        // Handle relations
        assignedTo: task.assignedTo || null,
        createdBy: task.createdBy || null,
        updatedBy: task.updatedBy || null,
        project: task.project || null,
        // Add processed approval metadata
        approvalMetadata: approvalMetadata
      };

      return transformedTask;
    };

    // Table columns
    const columns = computed(() => [
      {
        name: 'title',
        sortable: true,
        required: true,
        label: 'Task Name',
        align: 'left',
        field: 'title',
      },
      {
        name: 'assignee',
        sortable: true,
        label: 'Assignee',
        align: 'left',
        field: (row: CombinedTaskResponseInterface) => {
          // Define the type for assignedTo
          interface UserDetails {
            id: string;
            firstName: string;
            lastName: string;
            email: string;
          }

          const assignedTo = row.assignedTo as UserDetails | undefined;
          if (!assignedTo) return 'No Assignee Yet';

          // Safe access to properties with defaults
          const firstName = assignedTo.firstName || '';
          const lastName = assignedTo.lastName || '';
          return firstName || lastName ? `${firstName} ${lastName}`.trim() : 'Unknown';
        },
      },
      {
        name: 'priority',
        label: 'Priorities',
        align: 'center',
        field: (row: CombinedTaskResponseInterface) => {
          const priorityLevel = row.priorityLevel as TagInfo | undefined;
          return priorityLevel?.label || '-';
        },
      },
      {
        name: 'difficulty',
        sortable: true,
        label: 'Difficulty',
        align: 'center',
        field: (row: CombinedTaskResponseInterface) => {
          const difficultySet = row.assignedToDifficultySet as TagInfo | undefined;
          return difficultySet?.label || '-';
        },
      },
      {
        name: 'status',
        label: 'Status',
        align: 'center',
        field: (row: CombinedTaskResponseInterface) => {
          // Safe access to boardLane property
          if (row.boardLane?.key?.label) {
            return row.boardLane.key.label;
          }
          return '-';
        },
      },
      {
        name: 'dueDate',
        sortable: true,
        label: 'Due Date',
        align: 'left',
        field: (row: CombinedTaskResponseInterface) => {
          if (row.dueDate) {
            const dueDateObj = row.dueDate as DateFormat | undefined;
            return dueDateObj?.raw || null;
          }
          return null;
        },
      },
    ]);

    // Methods
    const addEventReloadTask = () => {
      if (!bus) {
        console.error('Event bus not available');
        return;
      }

      // Listen for reload event - force refresh
      bus.on('reloadTaskList', async () => {
        await loadTaskList(); // Refresh current tab's data
      });
    };

    const showTaskInformation = (data: TaskWithUIProps) => {
      // Check if this is an approval task
      if (data.taskType === 'APPROVAL') {
        if (data.approvalMetadata?.sourceModule === 'HR_FILING') {
          // For HR filing approvals, we need to fetch the filing data and open the appropriate dialog
          fetchFilingForApproval(data);
        } else if (data.approvalMetadata?.sourceModule === 'PAYROLL') {
          // For payroll approvals, redirect to the payroll approval page
          handlePayrollApproval(data);
        } else {
          // For other approval types, open the normal task dialog for now
          taskInformation.value = data;
          isTaskInformationDialogOpen.value = true;
        }
      } else {
        // For regular tasks, open the normal task dialog
        taskInformation.value = data;
        isTaskInformationDialogOpen.value = true;
      }
    };

    const handlePayrollApproval = async (task: TaskWithUIProps) => {
      // Fetch payroll details and open approval dialog
      try {
        $q.loading.show();

        // Get payroll details
        const response = await api.get(
          `/payroll-approval/cutoff/${task.approvalMetadata?.sourceId}`
        );

        currentPayrollForApproval.value = {
          taskId: task.id.toString(),
          cutoffId: task.approvalMetadata?.sourceId || '',
          ...response.data,
        };

        currentApprovalTask.value = task;
        isPayrollApprovalDialogOpen.value = true;
      } catch (error) {
        console.error('Failed to fetch payroll details:', error);
        $q.notify({
          type: 'negative',
          message: 'Failed to load payroll details',
        });
      } finally {
        $q.loading.hide();
      }
    };

    const fetchFilingForApproval = async (task: TaskWithUIProps) => {
      try {
        // Simply pass the task to the dialog, let it handle loading filing data from metadata
        // This matches how the sidebar notification works
        currentFilingForApproval.value = null; // Don't pass filing data separately
        currentApprovalTask.value = task;
        isFilingApprovalDialogOpen.value = true;
      } catch (error) {
        console.error('Error opening filing approval dialog:', error);
        $q.notify({
          type: 'negative',
          message: 'Failed to open filing approval dialog',
        });
      }
    };

    const handleFilingApprovalComplete = async () => {
      // Force refresh task list after any approval action
      await loadTaskList();

      // Emit reload event for other components
      bus?.emit('reloadTaskList');
    };

    const handlePayrollApprovalComplete = async () => {
      // Close dialog and reload task list
      isPayrollApprovalDialogOpen.value = false;
      await loadTaskList();

      // Emit reload events
      bus?.emit('reloadTaskList');
      bus?.emit('cutoff-date-range-status-updated');
    };

    const handleApprovalAction = async () => {
      // Force refresh task list after approval action
      await loadTaskList();

      // Emit reload event for other components
      bus?.emit('reloadTaskList');
    };

    const loadTaskTab = async (tab: string) => {
      activeTab.value = tab;
      pagination.page = 1; // Reset to first page when switching tabs
      await loadTaskList();
    };

    // Process tasks for display with UI tags
    // Backend already returns fully formatted data, we just need to add UI tags
    const processTasksForDisplay = (tasksArray: any[]) => {
      if (!tasksArray || tasksArray.length === 0) return [];

      return tasksArray.map((task) => {
        const tags: TagInfo[] = [];

        // Backend returns pre-formatted objects, just extract for tags
        // Add priority tag
        if (task.priorityLevel && typeof task.priorityLevel === 'object') {
          tags.push({
            label: task.priorityLevel.label,
            color: task.priorityLevel.color,
            textColor: task.priorityLevel.textColor || 'white',
          } as TagInfo);
        }

        // Add difficulty tag
        if (task.assignedToDifficultySet && typeof task.assignedToDifficultySet === 'object') {
          tags.push({
            label: task.assignedToDifficultySet.label,
            color: task.assignedToDifficultySet.color,
            textColor: task.assignedToDifficultySet.textColor || 'white',
          } as TagInfo);
        }

        // Add board lane status tag
        if (task.boardLane?.key && typeof task.boardLane.key === 'object') {
          tags.push({
            label: task.boardLane.key.label || 'Unknown',
            color: task.boardLane.key.color || 'grey',
            textColor: task.boardLane.key.textColor || 'white',
          } as TagInfo);
        }

        return {
          ...task,
          tags,
        } as TaskWithUIProps;
      });
    };

    // Watch for API data changes and update task list
    // Backend already handles tab filtering and search, so we just process for display
    watchEffect(() => {
      // Backend returns pre-filtered tasks based on tab and search
      // Just need to process for UI tags
      taskList.value = processTasksForDisplay(apiTasks.value || []);
    });

    // Update task counts from API response
    watchEffect(() => {
      if (apiCounts.value) {
        taskCountByStatus.value = {
          activeTaskCount: apiCounts.value.active || 0,
          assignedTaskCount: apiCounts.value.assigned || 0,
          completedTaskCount: 0, // Not used anymore
          approvalTaskCount: apiCounts.value.approvals || 0,
        };
      }
    });

    const loadTaskList = async () => {
      // Refetch dashboard data from backend API
      // The composable watches tab and search, so this will fetch correct data
      await refetchDashboard();
    };

    // Simple client-side pagination
    const handlePageChange = (newPage: number) => {
      pagination.page = newPage;
    };

    // Computed properties
    const tabsWithBadges = computed(() => {
      return tabList.map((tab: TabItem) => ({
        ...tab,
        badge:
          tab.key === 'active' && taskCountByStatus.value?.activeTaskCount
            ? taskCountByStatus.value.activeTaskCount
            : tab.key === 'assigned' && taskCountByStatus.value?.assignedTaskCount
            ? taskCountByStatus.value.assignedTaskCount
            : tab.key === 'approvals' && taskCountByStatus.value?.approvalTaskCount
            ? taskCountByStatus.value.approvalTaskCount
            : undefined,
      }));
    });

    // Calculate max pages based on task list length
    const maxPages = computed(() => {
      return Math.ceil(taskList.value.length / pagination.rowsPerPage) || 1;
    });

    // Simple client-side pagination with urgency-aware sorting
    const paginatedTasks = computed(() => {
      let sortedTasks = [...taskList.value];

      // Priority weight helper (matches task-priority.reference.ts)
      const priorityOrder: { [key: string]: number } = {
        'Urgent': 5,
        'High Priority': 4,
        'Priority': 3,
        'Low Priority': 2,
        'Very Low': 1
      };

      // Helper function to calculate urgency score
      const getUrgencyScore = (task: TaskWithUIProps) => {
        const now = new Date().getTime();
        const dueDate = task.dueDate?.raw ? new Date(task.dueDate.raw).getTime() : null;
        const priority = priorityOrder[(task.priorityLevel as TagInfo)?.label || ''] || 0;

        // If no due date, use priority only (lower score = less urgent)
        if (!dueDate) return priority * 1000;

        // Calculate days until due (negative = overdue)
        const daysUntil = (dueDate - now) / (1000 * 60 * 60 * 24);

        // Urgency formula: closer date + higher priority = higher score
        // Overdue tasks get highest urgency
        const dateUrgency = daysUntil <= 0 ? 10000 : Math.max(0, 100 - daysUntil);
        return dateUrgency * 10 + priority;
      };

      // Apply sorting based on selected option
      if (currentSortOption.value === 'project') {
        // Group by project, then by urgency within each project
        sortedTasks.sort((a, b) => {
          const projectA = a.project?.name || 'zzz_No Project'; // Put no-project items at end
          const projectB = b.project?.name || 'zzz_No Project';
          const projectCompare = projectA.localeCompare(projectB);

          if (projectCompare !== 0) return projectCompare;
          // Within same project, sort by urgency
          return getUrgencyScore(b) - getUrgencyScore(a);
        });
      } else if (currentSortOption.value === 'priority') {
        // Sort purely by priority (High -> Medium -> Low)
        sortedTasks.sort((a, b) => {
          const priorityA = priorityOrder[(a.priorityLevel as TagInfo)?.label || ''] || 0;
          const priorityB = priorityOrder[(b.priorityLevel as TagInfo)?.label || ''] || 0;
          return priorityB - priorityA;
        });
      } else if (currentSortOption.value === 'dueDate') {
        // Sort by due date, then by priority as tie-breaker
        sortedTasks.sort((a, b) => {
          const dateA = a.dueDate?.raw ? new Date(a.dueDate.raw).getTime() : Infinity;
          const dateB = b.dueDate?.raw ? new Date(b.dueDate.raw).getTime() : Infinity;
          const dateCompare = dateA - dateB;

          if (dateCompare !== 0) return dateCompare;
          // Same due date, use priority
          const priorityA = priorityOrder[(a.priorityLevel as TagInfo)?.label || ''] || 0;
          const priorityB = priorityOrder[(b.priorityLevel as TagInfo)?.label || ''] || 0;
          return priorityB - priorityA;
        });
      } else {
        // 'all' or null - pure urgency sort
        sortedTasks.sort((a, b) => {
          return getUrgencyScore(b) - getUrgencyScore(a);
        });
      }

      const start = (pagination.page - 1) * pagination.rowsPerPage;
      const end = start + pagination.rowsPerPage;
      return sortedTasks.slice(start, end);
    });

    // Mobile action items
    const mobileActionItems = computed(() => [
      {
        icon: 'folder_open',
        label: 'Create Task',
        onClick: () => {
          isMobileMoreActionsDialogOpen.value = false;
          isTaskCreateDialogOpen.value = true;
        }
      },
      {
        icon: 'card_travel',
        label: 'Account Summary',
        onClick: () => {
          isMobileMoreActionsDialogOpen.value = false;
          isTaskAccountSummaryDialogOpen.value = true;
        }
      }
    ]);

    // Filter actions for GlobalWidgetMoreActions
    const filterActions = [
      { key: 'all', label: 'All', testId: 'sort-by-all' },
      { key: 'project', label: 'Sort by Project', testId: 'sort-by-project' },
      { key: 'priority', label: 'Sort by Priority', testId: 'sort-by-priority' },
      { key: 'dueDate', label: 'Sort by Due Date', testId: 'sort-by-due-date' },
    ];

    // More actions for GlobalWidgetMoreActions
    const moreActionsItems = [
      { key: 'create', label: 'Create Task', testId: 'task-create-button' },
      { key: 'summary', label: 'Account Summary' },
    ];

    // Sort tasks by selected option
    const sortTasks = (sortOption: 'all' | 'project' | 'priority' | 'dueDate') => {
      currentSortOption.value = sortOption;
      pagination.page = 1; // Reset to first page when sorting
    };

    // Handle filter click from GlobalWidgetMoreActions
    const handleFilterClick = (key: string) => {
      sortTasks(key as 'all' | 'project' | 'priority' | 'dueDate');
    };

    // Handle more click from GlobalWidgetMoreActions
    const handleMoreClick = (key: string) => {
      if (key === 'create') {
        isTaskCreateDialogOpen.value = true;
      } else if (key === 'summary') {
        isTaskAccountSummaryDialogOpen.value = true;
      }
    };

    // Task counts are now calculated from fetched data in watchEffect

    // Lifecycle hooks
    onMounted(async () => {
      try {
        addEventReloadTask();

        // API composable auto-fetches on mount (autoFetch: true)
        // No need to manually fetch here
      } catch (error) {
        console.warn('Error during component initialization:', error);
      }
    });

    onUnmounted(() => {
      // Remove event listeners
      if (bus) {
        bus.off('reloadTaskList');
      }
    });

    return {
      // Reactive state
      isTaskInformationDialogOpen,
      isTaskAccountSummaryDialogOpen,
      isTaskCreateDialogOpen,
      isFilingApprovalDialogOpen,
      isPayrollApprovalDialogOpen,
      isMobileMoreActionsDialogOpen,
      currentFilingForApproval,
      currentPayrollForApproval,
      currentApprovalTask,
      taskInformation,
      activeTab,
      isTaskListLoading: computed(() => {
        // Show loading from API composable
        return apiLoading.value;
      }),
      taskList,
      search,
      searchActive,
      pagination,
      sortBy,
      descending,
      tabList,
      columns,

      // Computed
      tabsWithBadges,
      maxPages,
      paginatedTasks,
      mobileActionItems,

      // Methods
      taskCountByStatus,
      showTaskInformation,
      handleApprovalAction,
      fetchFilingForApproval,
      handleFilingApprovalComplete,
      handlePayrollApprovalComplete,
      loadTaskTab,
      loadTaskList,
      handlePageChange,
      sortTasks,
      handleFilterClick,
      handleMoreClick,

      // Data
      filterActions,
      moreActionsItems,
    };
  },
});
</script>
