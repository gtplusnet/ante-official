<template>
  <!-- Add Phase Dialog -->
  <AddEditTaskPhaseDialog
    v-if="showAddPhaseDialog"
    v-model="showAddPhaseDialog"
    :projectId="projectId"
    @saved="handlePhaseSaved"
  />

  <q-dialog v-model="dialogVisible" maximized persistent transition-show="slide-up" transition-hide="slide-down">
    <q-card class="task-management-fullscreen">
      <!-- Compact Header with integrated controls -->
      <div class="fullscreen-header-compact">
        <div class="header-content">
          <div class="header-left">
            <q-btn
              round
              flat
              dense
              icon="arrow_back"
              size="sm"
              class="back-btn"
              @click="closeDialog"
            >
              <q-tooltip>Back to Project</q-tooltip>
            </q-btn>
            <q-icon name="task_alt" size="18px" class="header-icon" />
            <span class="text-body2 text-weight-medium">{{ projectName }}</span>

            <!-- View switcher integrated into header -->
            <div class="view-switcher">
              <button
                v-for="view in viewOptions"
                :key="view.type"
                class="view-button"
                :class="{ active: currentView === view.type }"
                @click="setView(view.type)"
              >
                <q-icon :name="view.icon" size="16px" />
              </button>
            </div>
          </div>
          <div class="header-right">
            <!-- Conditional button based on grouping mode -->
            <q-btn
              v-if="currentGroupingMode === 'taskPhase'"
              color="primary"
              icon="add"
              label="Add Phase"
              size="sm"
              dense
              unelevated
              @click="openAddPhaseDialog"
            />
            <q-btn
              v-else
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
      </div>

      <!-- Grouping Tabs - Attached directly below header -->
      <div class="grouping-tabs-sticky">
        <button
          v-for="tab in groupingTabs"
          :key="tab.mode"
          class="tab-button"
          :class="{ active: currentGroupingMode === tab.mode }"
          @click="setGroupingMode(tab.mode)"
        >
          <span class="material-icons">{{ tab.icon }}</span>
          <span class="tab-label">{{ tab.label }}</span>
        </button>
      </div>

      <!-- Body - TaskList Component with no header -->
      <div class="fullscreen-body-compact">
        <TaskList
          ref="taskListRef"
          :filter="taskFilter"
          :projectId="projectId"
          :hideProjectGrouping="true"
          :hideHeader="true"
          :compactMode="true"
          :externalGroupingMode="currentGroupingMode"
        />
      </div>
    </q-card>
  </q-dialog>
</template>

<script lang="ts">
import { defineComponent, ref, computed, watch, onMounted } from 'vue';
import TaskList from '../../../pages/Member/Task/TaskList.vue';
import { useTaskSearchStore, type TaskGroupingMode } from '../../../stores/taskSearch';
import { useTaskPhaseStore } from '../../../stores/taskPhase';
import AddEditTaskPhaseDialog from '../TaskPhase/AddEditTaskPhaseDialog.vue';

export default defineComponent({
  name: 'TaskManagementDialog',
  components: {
    TaskList,
    AddEditTaskPhaseDialog
  },
  props: {
    modelValue: {
      type: Boolean,
      default: false
    },
    projectId: {
      type: [Number, String],
      required: true
    },
    projectName: {
      type: String,
      default: 'Project'
    },
    filter: {
      type: String,
      default: 'all' // Can be 'all', 'my', 'due', etc.
    }
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const dialogVisible = ref(props.modelValue);
    const taskListRef = ref(null);
    const currentView = ref('list');
    const showAddPhaseDialog = ref(false);
    const taskSearchStore = useTaskSearchStore();
    const taskPhaseStore = useTaskPhaseStore();
    // Set default grouping mode to taskPhase when opened from project context
    const initialGroupingMode = props.projectId ? 'taskPhase' : taskSearchStore.groupingMode;
    const currentGroupingMode = ref<TaskGroupingMode>(initialGroupingMode as TaskGroupingMode);

    // Set the task search store to match when in project context
    if (props.projectId && initialGroupingMode === 'taskPhase') {
      taskSearchStore.setGroupingMode('taskPhase');
    }

    // Load task phases when dialog opens and projectId is provided
    const loadTaskPhases = async () => {
      if (props.projectId) {
        const projectIdNum = typeof props.projectId === 'string'
          ? parseInt(props.projectId)
          : props.projectId;
        await taskPhaseStore.loadPhasesForProject(projectIdNum);
      }
    };

    // Load phases when component mounts
    onMounted(() => {
      if (dialogVisible.value && props.projectId) {
        loadTaskPhases();
      }
    });

    // View options for the switcher
    const viewOptions = [
      { type: 'list', icon: 'view_list', label: 'List View' },
      { type: 'board', icon: 'view_kanban', label: 'Board View' },
      { type: 'card', icon: 'view_module', label: 'Card View' }
    ];

    // Grouping tabs configuration - filter out project grouping since we're in project context
    const groupingTabs = computed(() => {
      const allTabs = [];

      // Add Task Phases tab first when in project context
      if (props.projectId) {
        allTabs.push({ mode: 'taskPhase' as TaskGroupingMode, label: 'Task Phases', icon: 'view_timeline' });
      }

      // Add standard tabs
      allTabs.push(
        { mode: 'none' as TaskGroupingMode, label: 'No Groups', icon: 'view_stream' },
        { mode: 'priority' as TaskGroupingMode, label: 'Priority', icon: 'flag' },
        { mode: 'deadline' as TaskGroupingMode, label: 'Due Date', icon: 'event' },
        { mode: 'stages' as TaskGroupingMode, label: 'Status', icon: 'category' },
        { mode: 'assignee' as TaskGroupingMode, label: 'Assignee', icon: 'person' },
      );

      // Remove "Group by Assignee" if viewing "My Task"
      let filteredTabs = [...allTabs];
      if (props.filter === 'my') {
        filteredTabs = filteredTabs.filter(tab => tab.mode !== 'assignee');
      }

      return filteredTabs;
    });

    // Handle grouping mode change
    const setGroupingMode = (mode: TaskGroupingMode) => {
      currentGroupingMode.value = mode;
      taskSearchStore.setGroupingMode(mode);
    };

    // Handle view switching
    const setView = (viewType: string) => {
      currentView.value = viewType;
      // Pass the view change to TaskList through ref
      if (taskListRef.value && taskListRef.value.setView) {
        taskListRef.value.setView(viewType);
      }
    };

    // Handle create dialog
    const openCreateDialog = () => {
      if (taskListRef.value && taskListRef.value.openCreateDialog) {
        taskListRef.value.openCreateDialog();
      }
    };

    // Watch for external changes to modelValue
    watch(() => props.modelValue, (newVal) => {
      dialogVisible.value = newVal;
      if (newVal && props.projectId) {
        // Load phases when dialog opens
        loadTaskPhases();
      }
    });

    // Watch for internal changes to dialogVisible
    watch(dialogVisible, (newVal) => {
      emit('update:modelValue', newVal);
    });

    const taskFilter = computed(() => props.filter);

    const closeDialog = () => {
      dialogVisible.value = false;
    };

    // Handle Add Phase dialog
    const openAddPhaseDialog = () => {
      showAddPhaseDialog.value = true;
    };

    const handlePhaseSaved = () => {
      // Refresh the task list to show the new phase
      if (taskListRef.value && taskListRef.value.refetchTasks) {
        taskListRef.value.refetchTasks();
      }
    };

    return {
      dialogVisible,
      taskFilter,
      closeDialog,
      taskListRef,
      currentView,
      viewOptions,
      setView,
      openCreateDialog,
      currentGroupingMode,
      groupingTabs,
      setGroupingMode,
      showAddPhaseDialog,
      openAddPhaseDialog,
      handlePhaseSaved
    };
  }
});
</script>

<style lang="scss" scoped>
// Full-screen container
.task-management-fullscreen {
  width: 100%;
  height: 100vh;
  max-width: 100vw;
  background: var(--md3-surface-container-low, #f5f5f5);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

// Ultra-compact header - minimal height
.fullscreen-header-compact {
  background: white;
  border-bottom: 1px solid var(--md3-outline-variant, #e0e0e0);
  padding: 0;
  flex-shrink: 0;

  .header-content {
    height: 40px; // Minimal height
    padding: 0 8px;
    display: flex;
    justify-content: space-between;
    align-items: center;

    .header-left {
      display: flex;
      align-items: center;
      gap: 8px; // Tighter spacing
      flex: 1;

      .back-btn {
        color: var(--md3-on-surface, #000);
        padding: 4px;
      }

      .header-icon {
        color: var(--md3-primary, #1976d2);
      }

      .text-body2 {
        color: var(--md3-on-surface, #000);
        margin: 0;
        margin-right: 12px;
      }

      // View switcher integrated
      .view-switcher {
        display: flex;
        gap: 2px;
        margin-left: auto;
        margin-right: 12px;

        .view-button {
          background: transparent;
          border: 1px solid var(--md3-outline-variant, #e0e0e0);
          border-radius: 4px;
          padding: 4px 8px;
          cursor: pointer;
          transition: all 0.2s;
          color: var(--md3-on-surface-variant, #666);

          &:hover {
            background: var(--md3-surface-container-highest, #f0f0f0);
          }

          &.active {
            background: var(--md3-primary-container, #e3f2fd);
            color: var(--md3-primary, #1976d2);
            border-color: var(--md3-primary, #1976d2);
          }
        }
      }
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 8px;
    }
  }
}

// Sticky grouping tabs - attached directly to header
.grouping-tabs-sticky {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 8px 8px;
  background: white;
  border-bottom: 1px solid var(--md3-outline-variant, #e0e0e0);
  flex-shrink: 0;
  position: sticky;
  top: 40px; // Stick below the 40px header
  z-index: 100;

  .tab-button {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 3px 8px;
    font-size: 11px;
    min-height: 24px;
    background: transparent;
    border: 1px solid var(--md3-outline-variant, #e0e0e0);
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s;
    color: var(--md3-on-surface-variant, #666);

    .material-icons {
      font-size: 14px;
    }

    .tab-label {
      white-space: nowrap;
    }

    &:hover {
      background: var(--md3-surface-container-highest, #f0f0f0);
    }

    &.active {
      background: var(--md3-primary-container, #e3f2fd);
      color: var(--md3-primary, #1976d2);
      border-color: var(--md3-primary, #1976d2);
      font-weight: 500;
    }
  }
}

// Compact Body - starts immediately after tabs
.fullscreen-body-compact {
  flex: 1;
  overflow: hidden;
  position: relative;

  // Make TaskList take full height with absolutely no wasted space
  :deep(.task-list-container) {
    height: 100%;
    display: flex;
    flex-direction: column;
    padding: 0;

    // Content starts immediately at the top
    .page-content {
      flex: 1;
      overflow-y: auto;
      padding: 0; // No padding - let children handle it
      background: var(--md3-surface-container-low, #f5f5f5);
    }

    // When task header is hidden, no space is wasted
    .task-view-header {
      display: none !important;
    }
  }

  // Ultra-compact list view styles
  :deep(.task-list-view) {
    // Hide grouping tabs in TaskListView since we moved them to dialog
    .grouping-tabs {
      display: none !important;
    }

    .add-task-button,
    .add-section-button {
      padding: 4px 10px;
      font-size: 11px;
      min-height: 24px;
      margin: 4px 8px;

      .material-icons {
        font-size: 14px;
      }
    }
  }
}

// Mobile responsive - even more compact
@media (max-width: 768px) {
  .grouping-tabs-sticky {
    padding: 3px 6px;
    top: 36px; // Adjust for smaller mobile header

    .tab-button {
      padding: 2px 6px;
      font-size: 10px;
      min-height: 22px;

      .material-icons {
        font-size: 12px;
      }

      .tab-label {
        display: none; // Hide labels on mobile to save space
      }
    }
  }

  .fullscreen-header-compact {
    .header-content {
      height: 36px; // Ultra compact on mobile
      padding: 0 6px;

      .header-left {
        gap: 4px;

        .text-body2 {
          display: none; // Hide project name on mobile to save space
        }

        .header-icon {
          display: none; // Hide icon on mobile
        }

        .view-switcher {
          margin-left: 4px;

          .view-button {
            padding: 2px 6px;
            font-size: 10px;
          }
        }
      }

      .header-right {
        .q-btn {
          padding: 2px 6px;
          font-size: 10px;
        }
      }
    }
  }

  .fullscreen-body-compact {
    :deep(.task-list-view) {
      .grouping-tabs {
        padding: 3px 6px;

        .tab-button {
          padding: 2px 6px;
          font-size: 10px;
          min-height: 22px;

          .material-icons {
            font-size: 12px;
          }
        }
      }

      .task-section {
        padding: 0 6px;
        margin-bottom: 4px;

        .task-item {
          padding: 3px 6px;
          font-size: 11px;

          .task-title {
            font-size: 11px;
          }
        }
      }
    }
  }
}
</style>