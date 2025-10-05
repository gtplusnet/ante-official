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
          <!-- more -->
          <div class="task-menu-wrapper q-ml-xs">
            <q-btn
              flat
              round
              dense
              icon="more_vert"
              color="grey-7"
              size="sm"
              class="task-menu-button"
              data-testid="task-widget-more-menu"
            >
              <q-menu auto-close anchor="bottom end" self="top end">
                <q-list class="text-label-medium">
                  <q-item clickable @click="isTaskCreateDialogOpen = true" data-testid="task-create-button">
                    <q-item-section>Create Task</q-item-section>
                  </q-item>
                  <q-item clickable @click="isTaskAccountSummaryDialogOpen = true">
                    <q-item-section>Account Summary</q-item-section>
                  </q-item>
                </q-list>
              </q-menu>
            </q-btn>
          </div>
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
// Import Supabase composable for direct database access
import { useTaskTable } from 'src/composables/supabase/useTaskTable';
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

    // Simple configurations for each tab - separating normal tasks from approval tasks
    // Active tasks - assigned to current user, not done, NORMAL tasks only
    const activeTasksConfig = {
      assignedToId: currentUserId.value,
      companyId: currentCompanyId.value,
      filters: [
        { column: 'boardLaneId', operator: 'neq', value: 3 }, // Not DONE (3 is DONE lane ID)
        { column: 'taskType', operator: 'eq', value: 'NORMAL' } // Normal tasks only
      ],
      orderBy: [
        { column: 'createdAt', ascending: false }
      ],
      pageSize: 1000, // Fetch all tasks (up to 1000), paginate client-side
      autoFetch: true // Auto-load on mount
    };

    // Assigned tasks - created by current user, not self-assigned, still open, NORMAL tasks only
    const assignedTasksConfig = {
      filters: [
        { column: 'createdById', operator: 'eq', value: currentUserId.value },
        { column: 'isSelfAssigned', operator: 'eq', value: false },
        { column: 'isOpen', operator: 'eq', value: true },
        { column: 'taskType', operator: 'eq', value: 'NORMAL' } // Normal tasks only
      ],
      companyId: currentCompanyId.value,
      orderBy: [
        { column: 'createdAt', ascending: false }
      ],
      pageSize: 1000, // Fetch all tasks (up to 1000)
      autoFetch: false // Load only when tab is selected
    };

    // Approval tasks - assigned to current user, APPROVAL type only, not done
    const approvalTasksConfig = {
      assignedToId: currentUserId.value,
      companyId: currentCompanyId.value,
      filters: [
        { column: 'taskType', operator: 'eq', value: 'APPROVAL' }, // Approval tasks only
        { column: 'boardLaneId', operator: 'neq', value: 3 } // Not DONE
      ],
      orderBy: [
        { column: 'createdAt', ascending: false }
      ],
      pageSize: 1000, // Fetch all tasks (up to 1000)
      autoFetch: false // Load only when tab is selected
    };

    // Initialize Supabase table composables - simplified approach
    const {
      data: activeTasks,
      loading: activeLoading,
      refetch: refetchActiveTasks
    } = useTaskTable(activeTasksConfig);

    const {
      data: assignedTasks,
      loading: assignedLoading,
      refetch: refetchAssignedTasks
    } = useTaskTable(assignedTasksConfig);

    const {
      data: approvalTasks,
      loading: approvalLoading,
      refetch: refetchApprovalTasks
    } = useTaskTable(approvalTasksConfig);

    // Reactive state
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
        const dateObj = new Date(date);
        return {
          raw: date,
          formatted: dateObj.toLocaleDateString(),
          date: dateObj.toISOString().split('T')[0]
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
    const processTasksForDisplay = (tasksArray: any[]) => {
      if (!tasksArray || tasksArray.length === 0) return [];

      return tasksArray.map((task) => {
        const transformedTask = transformSupabaseTask(task);
        const tags: TagInfo[] = [];

        // Add priority tag
        if (transformedTask.priorityLevel && typeof transformedTask.priorityLevel === 'object') {
          tags.push({
            label: transformedTask.priorityLevel.label,
            color: transformedTask.priorityLevel.color,
            textColor: transformedTask.priorityLevel.textColor || 'white',
          } as TagInfo);
        }

        // Add difficulty tag
        if (
          transformedTask.assignedToDifficultySet &&
          typeof transformedTask.assignedToDifficultySet === 'object'
        ) {
          tags.push({
            label: transformedTask.assignedToDifficultySet.label,
            color: transformedTask.assignedToDifficultySet.color,
            textColor: transformedTask.assignedToDifficultySet.textColor || 'white',
          } as TagInfo);
        }

        // Add board lane status tag
        if (transformedTask.boardLane?.key && typeof transformedTask.boardLane.key === 'object') {
          tags.push({
            label: transformedTask.boardLane.key.label || 'Unknown',
            color: transformedTask.boardLane.key.color || 'grey',
            textColor: transformedTask.boardLane.key.textColor || 'white',
          } as TagInfo);
        }

        return {
          ...transformedTask,
          tags,
        } as TaskWithUIProps;
      });
    };

    // Watch for data changes and update task list based on active tab
    watchEffect(() => {
      let currentTasks = [];

      // Get the current tab's data
      if (activeTab.value === 'active' && activeTasks.value) {
        currentTasks = activeTasks.value;
      } else if (activeTab.value === 'assigned' && assignedTasks.value) {
        currentTasks = assignedTasks.value;
      } else if (activeTab.value === 'approvals' && approvalTasks.value) {
        currentTasks = approvalTasks.value;
      }

      // Apply client-side search filter if active
      if (search.value && searchActive.value) {
        currentTasks = currentTasks.filter(task =>
          task.title?.toLowerCase().includes(search.value.toLowerCase()) ||
          task.description?.toLowerCase().includes(search.value.toLowerCase())
        );
      }

      // Process for display
      taskList.value = processTasksForDisplay(currentTasks);
    });

    // Calculate task counts from fetched data
    watchEffect(() => {
      taskCountByStatus.value = {
        activeTaskCount: activeTasks.value?.length || 0,
        assignedTaskCount: assignedTasks.value?.length || 0,
        completedTaskCount: 0, // Not used anymore
        approvalTaskCount: approvalTasks.value?.length || 0,
      };
    });

    const loadTaskList = async () => {
      // Refetch data based on active tab
      if (activeTab.value === 'active') {
        await refetchActiveTasks();
      } else if (activeTab.value === 'assigned') {
        await refetchAssignedTasks();
      } else if (activeTab.value === 'approvals') {
        await refetchApprovalTasks();
      }
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

    // Simple client-side pagination
    const paginatedTasks = computed(() => {
      const start = (pagination.page - 1) * pagination.rowsPerPage;
      const end = start + pagination.rowsPerPage;
      return taskList.value.slice(start, end);
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

    // Task counts are now calculated from fetched data in watchEffect

    // Lifecycle hooks
    onMounted(async () => {
      try {
        addEventReloadTask();

        // Load assigned and approvals tabs data
        await Promise.all([
          refetchAssignedTasks(),
          refetchApprovalTasks()
        ]);
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
        // Show loading based on active tab's loading state
        if (activeTab.value === 'active') {
          return activeLoading.value;
        } else if (activeTab.value === 'assigned') {
          return assignedLoading.value;
        } else if (activeTab.value === 'approvals') {
          return approvalLoading.value;
        }
        return false;
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
    };
  },
});
</script>
