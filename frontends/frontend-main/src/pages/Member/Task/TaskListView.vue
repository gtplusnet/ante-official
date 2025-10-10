<template>
  <!-- Edit Phase Dialog -->
  <AddEditTaskPhaseDialog
    v-if="showEditPhaseDialog"
    v-model="showEditPhaseDialog"
    :projectId="projectId"
    :phase="editingPhase"
    @saved="handlePhaseSaved"
  />

  <div class="task-list-view" :class="{ 'compact-mode': compactMode }" @click="closeAllDropdowns">
    <!-- Grouping Tabs -->
    <div class="grouping-tabs">
      <button
        v-for="tab in groupingTabs"
        :key="tab.mode"
        class="tab-button"
        :class="{ active: currentGroupingMode === tab.mode }"
        @click="taskSearchStore.setGroupingMode(tab.mode)"
      >
        <span class="tab-icon material-icons">{{ tab.icon }}</span>
        <span class="tab-label">{{ tab.label }}</span>
      </button>
    </div>

    <!-- Column Headers -->
    <div class="list-header" :class="{
      'hide-assignee': filter === 'my',
      'hide-project': projectId || hideProjectGrouping
    }">
      <div class="header-name">Name</div>
      <div v-if="filter !== 'my'" class="header-assignee">Assignee</div>
      <div class="header-due-date">Due date</div>
      <div class="header-priority">Priority</div>
      <div v-if="!projectId && !hideProjectGrouping" class="header-project">Project</div>
      <div class="header-tags">Tags</div>
      <div class="header-add"></div>
    </div>

    <!-- Dynamic Task Sections -->
    <div
      v-for="(section, sectionIndex) in taskSections"
      :key="section.key"
      class="task-section"
      :class="{ 'dragging-phase': draggingSectionIndex === sectionIndex }"
      @dragover="currentGroupingMode === 'taskPhase' && handleSectionDragOver($event, sectionIndex)"
      @drop="currentGroupingMode === 'taskPhase' && handleSectionDrop($event, sectionIndex)"
    >
      <div class="section-header" @click="toggleSection(section.key)">
        <!-- Drag handle for task phases -->
        <div
          v-if="currentGroupingMode === 'taskPhase' && section.metadata?.phaseId"
          class="phase-drag-handle"
          draggable="true"
          @dragstart="handleSectionDragStart($event, sectionIndex)"
          @dragend="handleSectionDragEnd()"
          @click.stop
          title="Drag to reorder"
        >
          <q-icon name="drag_indicator" size="18px" />
        </div>
        <span
          class="section-toggle material-icons"
          :class="{ collapsed: collapsedSections[section.key] }"
        >
          keyboard_arrow_down
        </span>
        <span v-if="section.icon" class="section-icon material-icons" :style="{ color: section.color }">{{ section.icon }}</span>
        <span class="section-title">{{ section.title }}</span>
        <span class="section-count">({{ section.tasks.length }})</span>
        <!-- Edit button for task phases -->
        <button
          v-if="currentGroupingMode === 'taskPhase' && section.metadata?.phaseId"
          class="section-edit-btn"
          @click.stop="openEditPhaseDialog(section)"
          title="Edit phase"
        >
          <span class="material-icons">edit</span>
        </button>
      </div>
      <div class="section-content" :class="{ collapsed: collapsedSections[section.key] }">
        <!-- Drop placeholder for top of section (disabled to reduce flickering) -->
        <!-- <div
          v-if="isDragOver && dropTargetSection === section.key && dropTargetIndex === -1"
          class="drop-placeholder"
        >
          <div class="placeholder-line"></div>
        </div> -->
        <!-- Add task row at the top -->
        <div class="add-task-row" v-if="!collapsedSections[section.key]">
          <div v-if="addingTaskInSection !== section.key" class="add-task-placeholder" @click="startInlineAdd(section.key)">
            <span class="material-icons add-icon">add</span>
            <span>Add task...</span>
          </div>
          <div v-else class="inline-task-input-row">
            <div class="task-name">
              <!-- Checkbox removed to match main task rows -->
              <!-- Add drag handle space and spacing to match regular rows -->
              <div style="width: 18px; margin-right: 8px;"></div>
              <div style="width: 8px;"></div>
              <input
                v-model="newTaskTitle"
                class="inline-task-input"
                :class="{ 'is-creating': props.creatingTask }"
                placeholder="Task name"
                :disabled="props.creatingTask"
                @keydown.enter="saveInlineTask(section)"
                @keydown.escape="cancelInlineAdd"
                @blur="cancelInlineAdd"
                ref="inlineTaskInput"
                autofocus
              />
            </div>
            <div v-if="filter !== 'my'" class="task-assignee">
              <!-- Empty for now, will inherit from section context -->
            </div>
            <div class="task-due-date"></div>
            <div class="task-priority"></div>
            <div v-if="!projectId && !hideProjectGrouping" class="task-project"></div>
            <div class="task-tags"></div>
            <div class="task-add-section">
              <button class="save-btn" :disabled="props.creatingTask" @mousedown.prevent @click="saveInlineTask(section)">
                <span class="material-icons">check</span>
              </button>
              <button class="cancel-btn" :disabled="props.creatingTask" @mousedown.prevent @click="cancelInlineAdd">
                <span class="material-icons">close</span>
              </button>
              <!-- Loading spinner -->
              <q-spinner-dots v-if="props.creatingTask" color="primary" size="20px" class="inline-task-spinner" />
            </div>
          </div>
        </div>

        <div
          v-for="(task, index) in section.tasks"
          :key="task.id"
          class="task-row"
          :class="{
            'hide-assignee': filter === 'my',
            'hide-project': projectId || hideProjectGrouping,
            'dragging': draggedTask?.id === task.id,
            'completed': task.status === 'done' || task.boardLaneId === 3
          }"
          :draggable="true"
          @dragstart="handleDragStart($event, task, section.key, index)"
          @dragover="handleDragOver($event, task, section.key, index)"
          @dragleave="handleDragLeave($event)"
          @drop="handleDrop($event, section.key, index)"
          @dragend="handleDragEnd"
        >
          <div class="task-name">
            <div class="drag-handle">
              <q-icon name="drag_indicator" size="18px" />
            </div>
            <!-- Task checkbox removed - no longer marking tasks as done from list view -->
            <!-- <div
              class="task-checkbox"
              :class="{ checked: task.status === 'completed' }"
              @click.stop="toggleTaskStatus(task)"
            ></div> -->
            <!-- Add spacing to compensate for removed checkbox -->
            <div style="width: 8px;"></div>
            <span
              v-if="editingTaskId !== task.id"
              class="task-title editable"
              :class="{ completed: task.status === 'completed' }"
              @click.stop="startEditTitle(task)"
            >
              {{ task.title }}
            </span>
            <input
              v-else
              v-model="editingTitle"
              class="task-title-input"
              @keydown.enter="saveTitle(task)"
              @keydown.escape="cancelEditTitle"
              @blur="saveTitle(task)"
              ref="titleInput"
            />
          </div>

          <div v-if="filter !== 'my'" class="task-assignee editable">
            <div class="assignee-button" @click.stop="openAssigneeDropdown(task.id, $event)">
              <div class="assignee-avatar" :style="{ backgroundColor: getAvatarColorFromName(task.assignee) }">
                {{ getInitialsFromName(task.assignee) }}
              </div>
              <span class="assignee-name">{{ formatAssignee(task.assignee) }}</span>
              <span
                v-if="task.assignee"
                class="clear-assignee material-icons"
                @click.stop="clearAssignee(task)"
              >close</span>
            </div>
            <div v-if="activeDropdown === `assignee-${task.id}`" class="custom-dropdown assignee-dropdown" :class="getDropdownPositionClass(task.id, 'assignee')">
              <div class="dropdown-search">
                <input
                  v-model="assigneeSearchQuery"
                  class="search-input"
                  placeholder="Search users..."
                  @click.stop
                  @keydown.escape="closeAllDropdowns"
                />
              </div>
              <div
                class="dropdown-item unassigned-item"
                @click.stop="clearAssignee(task)"
              >
                <div class="assignee-avatar empty">
                  <span class="material-icons">person_off</span>
                </div>
                <span>Unassigned</span>
              </div>
              <div v-if="filteredUsers.length === 0" class="no-results">
                No users found
              </div>
              <div
                v-for="user in filteredUsers"
                :key="user.id || user"
                class="dropdown-item"
                @click.stop="updateAssignee(task, user); closeAllDropdowns()"
              >
                <div class="assignee-avatar small" :style="{ backgroundColor: user.avatarColor || getAvatarColorFromName(user.name) }">
                  {{ user.initials || getInitialsFromName(user.name) }}
                </div>
                <span>{{ formatAssignee(user.name) }}</span>
              </div>
            </div>
          </div>

          <div class="task-due-date editable">
            <span
              class="date-button"
              :class="getDateStatusClass(task.dueDate, task.endDate)"
              @click.stop="openDatePicker(task.id, $event)"
            >
              {{ formatTaskDueDate(task.dueDate, task.endDate) || '-' }}
            </span>
            <div v-if="activeDropdown === `date-${task.id}`" class="custom-dropdown date-dropdown" :class="getDropdownPositionClass(task.id, 'date')" @click.stop>
              <div class="date-picker-header">Select date</div>
              <input
                type="date"
                class="date-input"
                :value="task.dueDate && typeof task.dueDate === 'string' ? task.dueDate.split('T')[0] : ''"
                @change="updateDueDate(task, $event.target.value)"
                @click.stop
              />
            </div>
          </div>

          <div class="task-priority editable">
            <div class="priority-button" @click.stop="openPriorityDropdown(task.id, $event)">
              <span v-if="task.priority" class="priority-badge" :class="`priority-${task.priority}`">
                {{ capitalizeFirst(task.priority) }}
              </span>
              <span v-else class="priority-placeholder">-</span>
            </div>
            <div v-if="activeDropdown === `priority-${task.id}`" class="custom-dropdown priority-dropdown" :class="getDropdownPositionClass(task.id, 'priority')">
              <div class="dropdown-item" @click.stop="updatePriority(task, 'verylow'); closeAllDropdowns()">
                <span class="priority-badge priority-verylow">Very Low</span>
              </div>
              <div class="dropdown-item" @click.stop="updatePriority(task, 'low'); closeAllDropdowns()">
                <span class="priority-badge priority-low">Low</span>
              </div>
              <div class="dropdown-item" @click.stop="updatePriority(task, 'medium'); closeAllDropdowns()">
                <span class="priority-badge priority-medium">Medium</span>
              </div>
              <div class="dropdown-item" @click.stop="updatePriority(task, 'high'); closeAllDropdowns()">
                <span class="priority-badge priority-high">High</span>
              </div>
              <div class="dropdown-item" @click.stop="updatePriority(task, 'urgent'); closeAllDropdowns()">
                <span class="priority-badge priority-urgent">Urgent</span>
              </div>
            </div>
          </div>

          <div v-if="!projectId && !hideProjectGrouping" class="task-project editable">
            <div class="project-button" @click.stop="openProjectDropdown(task.id, $event)">
              <span class="project-indicator" :style="{ backgroundColor: getProjectColor(task.projectId || task.project) }"></span>
              <span class="project-name">{{ formatProjectName(task.projectId || task.project) }}</span>
            </div>
            <div v-if="activeDropdown === `project-${task.id}`" class="custom-dropdown project-dropdown" :class="getDropdownPositionClass(task.id, 'project')">
              <div
                v-for="project in availableProjects"
                :key="project.id"
                class="dropdown-item"
                @click.stop="updateProject(task, project.id); closeAllDropdowns()"
              >
                <span class="project-indicator" :style="{ backgroundColor: project.color }"></span>
                <span>{{ project.name }}</span>
              </div>
            </div>
          </div>

          <div class="task-tags">
            <div class="tags-container">
              <span v-for="tag in task.tags" :key="tag" class="task-tag">
                {{ tag }}
                <span class="material-icons tag-close" @click.stop="removeTag(task, tag)">close</span>
              </span>
              <span
                v-if="editingTagTaskId !== task.id && (!task.tags || task.tags.length < 3)"
                class="add-tag-btn"
                @click.stop="startEditTag(task)"
              >
                <span class="material-icons">add</span>
              </span>
              <input
                v-if="editingTagTaskId === task.id"
                v-model="newTag"
                class="tag-input"
                placeholder="Add tag"
                @keydown.enter="addTag(task, newTag); cancelEditTag()"
                @keydown.escape="cancelEditTag"
                @blur="cancelEditTag"
                ref="tagInput"
              />
            </div>
          </div>

          <div class="task-add">
            <span class="material-icons add-icon">add</span>
          </div>

          <!-- Context Menu for this task (Simplified) -->
          <q-menu
            touch-position
            context-menu
            auto-close
            class="md3-context-menu"
          >
            <q-list style="min-width: 180px; padding: 0;">
              <q-item
                clickable
                v-close-popup
                @click="handleViewTask(task)"
                class="md3-menu-item"
                dense
              >
                <q-item-section avatar>
                  <q-icon name="visibility" size="16px" color="grey-7" />
                </q-item-section>
                <q-item-section class="md3-menu-text">View Task</q-item-section>
              </q-item>

              <q-item
                v-if="filter !== 'deleted'"
                clickable
                v-close-popup
                @click="handleSetAsDone(task)"
                class="md3-menu-item"
                dense
              >
                <q-item-section avatar>
                  <q-icon name="check_circle" size="16px" color="grey-7" />
                </q-item-section>
                <q-item-section class="md3-menu-text">Set as Done</q-item-section>
              </q-item>

              <q-item
                v-if="filter === 'deleted'"
                clickable
                v-close-popup
                @click="handleRestoreTask(task)"
                class="md3-menu-item"
                dense
              >
                <q-item-section avatar>
                  <q-icon name="restore" size="16px" color="grey-7" />
                </q-item-section>
                <q-item-section class="md3-menu-text">Restore Task</q-item-section>
              </q-item>

              <q-item
                v-if="filter !== 'deleted'"
                clickable
                v-close-popup
                @click="handleDeleteTask(task)"
                class="md3-menu-item"
                dense
              >
                <q-item-section avatar>
                  <q-icon name="delete" size="16px" color="grey-7" />
                </q-item-section>
                <q-item-section class="md3-menu-text">Delete Task</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </div>
      </div>
    </div>
  </div>

</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch } from 'vue';
import { defineAsyncComponent } from 'vue';
import { onMounted } from 'vue';
import { Notify } from 'quasar';
import { useTaskSearchStore, type TaskGroupingMode } from '../../../stores/taskSearch';
import { useTaskPhaseStore } from '../../../stores/taskPhase';
import { useAssigneeStore } from 'src/stores/assignee';
import { useProjectStore } from 'src/stores/project';
import draggable from 'vuedraggable';

// Lazy-loaded dialogs (ALL dialogs must be lazy loaded - CLAUDE.md)
const AddEditTaskPhaseDialog = defineAsyncComponent(() =>
  import('src/components/dialog/TaskPhase/AddEditTaskPhaseDialog.vue')
);

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  priority?: 'verylow' | 'low' | 'medium' | 'high' | 'urgent';
  assignee: string;
  creator: string;
  project?: string | number;
  projectId?: number;
  taskPhaseId?: number;
  isDraft?: boolean;
  dueDate?: string;
  endDate?: string;
  createdAt: string;
  completedAt?: string;
  subtaskCount?: number;
  tags?: string[];
  order?: number;
}

const props = defineProps<{
  tasks: Task[];
  filter: string;
  loading?: boolean;
  creatingTask?: boolean; // Loading state for inline task creation
  projectId?: number | string | null;
  hideProjectGrouping?: boolean;
  compactMode?: boolean;
  externalGroupingMode?: string | null;
}>();

const emit = defineEmits<{
  'toggle-status': [task: Task];
  'update-status': [task: Task, status: string];
  'update-task': [task: Task, field: string, value: any, extraData?: any];
  'select-task': [task: Task];
  'edit-task': [task: Task];
  'open-menu': [task: Task, event: MouseEvent];
  'add-task': [section: string, title?: string, metadata?: any];
  'reorder-tasks': [data: { sectionKey: string; fromIndex: number; toIndex: number; task: Task }];
  'view-task': [task: Task];
  'delete-task': [task: Task];
  'restore-task': [task: Task];
}>();

const taskSearchStore = useTaskSearchStore();

// Use external grouping mode if provided, otherwise use store
const currentGroupingMode = computed(() => {
  return props.externalGroupingMode || taskSearchStore.groupingMode;
});

// Grouping tabs configuration - computed to filter based on context
const groupingTabs = computed(() => {
  const allTabs = [
    { mode: 'none' as TaskGroupingMode, label: 'No Groups', icon: 'view_stream' },
    { mode: 'priority' as TaskGroupingMode, label: 'Priority', icon: 'flag' },
    { mode: 'deadline' as TaskGroupingMode, label: 'Due Date', icon: 'event' },
    { mode: 'stages' as TaskGroupingMode, label: 'Status', icon: 'category' },
    { mode: 'assignee' as TaskGroupingMode, label: 'Assignee', icon: 'person' },
    { mode: 'project' as TaskGroupingMode, label: 'Project', icon: 'folder' },
    { mode: 'taskPhase' as TaskGroupingMode, label: 'Task Phases', icon: 'timeline' },
  ];

  // Remove "Group by Assignee" tab when viewing "My Task" since all tasks are already assigned to the same person
  let filteredTabs = [...allTabs];

  if (props.filter === 'my') {
    filteredTabs = filteredTabs.filter(tab => tab.mode !== 'assignee');
  }

  // Remove "Group by Project" tab when viewing tasks within a specific project
  if (props.hideProjectGrouping || props.projectId) {
    filteredTabs = filteredTabs.filter(tab => tab.mode !== 'project');
  }

  // Only show "Task Phases" tab when viewing tasks within a specific project
  if (!props.projectId) {
    filteredTabs = filteredTabs.filter(tab => tab.mode !== 'taskPhase');
  }

  return filteredTabs;
});

// Dynamic collapsed sections (key is section id)
const collapsedSections = ref<Record<string, boolean>>({});

// Inline task creation state
const addingTaskInSection = ref<string | null>(null);
const newTaskTitle = ref('');

// Watch for filter changes to handle incompatible grouping modes
watch(() => props.filter, (newFilter) => {
  // If switching to "My Task" view and currently grouped by assignee, switch to default grouping
  if (newFilter === 'my' && currentGroupingMode.value === 'assignee') {
    taskSearchStore.setGroupingMode('stages'); // Default to stages grouping
  }
});

// Task phase loading logic
const taskPhaseStore = useTaskPhaseStore();

// Load phases when projectId changes or when grouping mode is taskPhase
const loadPhases = async () => {
  if (!props.projectId || currentGroupingMode.value !== 'taskPhase') {
    return;
  }

  const projectIdNum = typeof props.projectId === 'string'
    ? parseInt(props.projectId)
    : props.projectId;

  // Check if phases are already loaded for this project
  const existingPhases = taskPhaseStore.getPhasesForProject(projectIdNum);
  if (!existingPhases || existingPhases.length === 0) {
    await taskPhaseStore.loadPhasesForProject(projectIdNum);
  }
};

// Watch for projectId changes
watch(() => props.projectId, async (newProjectId) => {
  if (newProjectId) {
    await loadPhases();
  }
}, { immediate: true });

// Watch for grouping mode changes to taskPhase
watch(() => currentGroupingMode.value, async (newMode) => {
  if (newMode === 'taskPhase') {
    await loadPhases();
  }
});

// Load phases on component mount if needed
onMounted(async () => {
  await loadPhases();
});

// Inline editing state
const editingTaskId = ref<string | null>(null);
const editingTitle = ref('');
const newTag = ref('');
const editingTagTaskId = ref<string | null>(null);
const activeDropdown = ref<string | null>(null);
const assigneeSearchQuery = ref('');

// Edit phase dialog state
const showEditPhaseDialog = ref(false);
const editingPhase = ref<any>(null);

// Phase drag-and-drop state
const isDraggingPhase = ref(false);

// Simplified drag and drop state
const draggedTask = ref<Task | null>(null);
const draggedIndex = ref<number | null>(null);
const draggedSection = ref<string | null>(null);


// Get stores
const assigneeStore = useAssigneeStore();
const projectStore = useProjectStore();

// Get available users from centralized assignee store
const availableUsers = computed(() => assigneeStore.formattedAssignees);

// Filter users based on search query
const filteredUsers = computed(() => {
  if (!assigneeSearchQuery.value) {
    return availableUsers.value;
  }
  const query = assigneeSearchQuery.value.toLowerCase();
  return availableUsers.value.filter(user => {
    const displayName = typeof user === 'object' ? (user.name || user.username) : user;
    return displayName.toLowerCase().includes(query);
  });
});

// Get dynamic projects from centralized project store
const availableProjects = computed(() => projectStore.projectsWithNone);

// Filter tasks by search query
const filteredTasks = computed(() => {
  if (!taskSearchStore.searchQuery) {
    return props.tasks;
  }
  const query = taskSearchStore.searchQuery.toLowerCase();
  return props.tasks.filter((task: Task) =>
    task.title.toLowerCase().includes(query) ||
    task.description.toLowerCase().includes(query)
  );
});

// Define section interface for dynamic grouping
interface TaskSection {
  key: string;
  title: string;
  tasks: Task[];
  icon?: string;
  color?: string;
  metadata?: any; // Additional metadata for task creation context
}

// Dynamic task sections based on grouping mode
const taskSections = computed<TaskSection[]>(() => {
  const allTasks = filteredTasks.value;

  switch (currentGroupingMode.value) {
    case 'none':
      // No grouping - show all tasks in one section
      return [{
        key: 'all',
        title: 'All Tasks',
        tasks: allTasks,
        icon: 'list'
      }];

    case 'priority':
      // Group by priority level
      return [
        {
          key: 'urgent',
          title: 'Urgent',
          tasks: allTasks.filter(task => task.priority === 'urgent'),
          icon: 'error',
          color: '#fc636b'
        },
        {
          key: 'high',
          title: 'High Priority',
          tasks: allTasks.filter(task => task.priority === 'high'),
          icon: 'priority_high',
          color: '#F06A6A'
        },
        {
          key: 'medium',
          title: 'Medium Priority',
          tasks: allTasks.filter(task => task.priority === 'medium'),
          icon: 'flag',
          color: '#F9A826'
        },
        {
          key: 'low',
          title: 'Low Priority',
          tasks: allTasks.filter(task => task.priority === 'low'),
          icon: 'flag',
          color: '#4ECBC4'
        },
        {
          key: 'verylow',
          title: 'Very Low',
          tasks: allTasks.filter(task => task.priority === 'verylow' || !task.priority),
          icon: 'outlined_flag',
          color: '#9CA6AF'
        }
      ];

    case 'deadline':
      // Group by time periods
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const thisWeek = new Date(now);
      thisWeek.setDate(thisWeek.getDate() + 7);
      const nextWeek = new Date(now);
      nextWeek.setDate(nextWeek.getDate() + 14);

      return [
        {
          key: 'overdue',
          title: 'Overdue',
          tasks: allTasks.filter(task => {
            if (!task.dueDate) return false;
            const dueDate = new Date(task.dueDate);
            return dueDate < now && task.status !== 'done' && task.status !== 'completed';
          }),
          icon: 'error',
          color: '#F06A6A'
        },
        {
          key: 'today',
          title: 'Today',
          tasks: allTasks.filter(task => {
            if (!task.dueDate) return false;
            const dueDate = new Date(task.dueDate);
            return dueDate >= now && dueDate < tomorrow;
          }),
          icon: 'today',
          color: '#F9A826'
        },
        {
          key: 'tomorrow',
          title: 'Tomorrow',
          tasks: allTasks.filter(task => {
            if (!task.dueDate) return false;
            const dueDate = new Date(task.dueDate);
            const dayAfter = new Date(tomorrow);
            dayAfter.setDate(dayAfter.getDate() + 1);
            return dueDate >= tomorrow && dueDate < dayAfter;
          }),
          icon: 'event',
          color: '#4ECBC4'
        },
        {
          key: 'this-week',
          title: 'This Week',
          tasks: allTasks.filter(task => {
            if (!task.dueDate) return false;
            const dueDate = new Date(task.dueDate);
            const dayAfter = new Date(tomorrow);
            dayAfter.setDate(dayAfter.getDate() + 1);
            return dueDate >= dayAfter && dueDate <= thisWeek;
          }),
          icon: 'date_range',
          color: '#008CE3'
        },
        {
          key: 'next-week',
          title: 'Next Week',
          tasks: allTasks.filter(task => {
            if (!task.dueDate) return false;
            const dueDate = new Date(task.dueDate);
            return dueDate > thisWeek && dueDate <= nextWeek;
          }),
          icon: 'event_upcoming',
          color: '#9CA6AF'
        },
        {
          key: 'later',
          title: 'Later',
          tasks: allTasks.filter(task => {
            if (!task.dueDate) return false;
            const dueDate = new Date(task.dueDate);
            return dueDate > nextWeek;
          }),
          icon: 'event_available',
          color: '#6D6E78'
        },
        {
          key: 'no-date',
          title: 'No Date',
          tasks: allTasks.filter(task => !task.dueDate),
          icon: 'event_busy',
          color: '#9CA6AF'
        }
      ];

    case 'assignee':
      // Group by assignee ID (not name) for consistency
      const assigneeGroups = new Map<string, Task[]>();

      // Group tasks by assignee ID
      allTasks.forEach(task => {
        const assigneeKey = task.assignedToId || 'unassigned';
        if (!assigneeGroups.has(assigneeKey)) {
          assigneeGroups.set(assigneeKey, []);
        }
        assigneeGroups.get(assigneeKey)!.push(task);
      });

      // Convert to sections array
      const sections = [];

      // Add unassigned section first if it exists
      if (assigneeGroups.has('unassigned')) {
        sections.push({
          key: 'unassigned',
          title: 'Unassigned',
          tasks: assigneeGroups.get('unassigned')!,
          icon: 'person_off',
          color: '#9CA6AF',
          metadata: { userId: null } // No user ID for unassigned
        });
      }

      // Add sections for each assignee (sorted by name)
      const assignedUserIds = Array.from(assigneeGroups.keys())
        .filter(key => key !== 'unassigned');

      // Sort by user name for display
      const sortedUserSections = assignedUserIds.map(userId => {
        // Find the user object to get display name
        const user = availableUsers.value.find(u => u.id === userId);
        const displayName = user ? user.name : 'Unknown User';

        return {
          userId,
          displayName,
          tasks: assigneeGroups.get(userId)!
        };
      }).sort((a, b) => a.displayName.localeCompare(b.displayName));

      sortedUserSections.forEach((section) => {
        sections.push({
          key: `assignee-${section.userId}`,  // Use ID as the key
          title: formatAssignee(section.displayName),
          tasks: section.tasks,
          icon: 'person',
          color: getAvatarColorFromName(section.displayName),
          metadata: { userId: section.userId } // Store the actual user ID
        });
      });

      return sections;

    case 'project':
      // Group by project
      const projectGroups = new Map<string | number, Task[]>();

      // Group tasks by project
      allTasks.forEach(task => {
        const projectKey = task.projectId || task.project || 'no-project';
        if (!projectGroups.has(projectKey)) {
          projectGroups.set(projectKey, []);
        }
        projectGroups.get(projectKey)!.push(task);
      });

      // Convert to sections array
      const projectSections = [];

      // Add "No Project" section first if it exists
      if (projectGroups.has('no-project')) {
        projectSections.push({
          key: 'no-project',
          title: 'No Project',
          tasks: projectGroups.get('no-project')!,
          icon: 'folder_off',
          color: '#9CA6AF'
        });
      }

      // Get all project keys (excluding 'no-project') and sort by project name
      const projectKeys = Array.from(projectGroups.keys())
        .filter(key => key !== 'no-project')
        .sort((a, b) => {
          const projectA = getProjectById(a);
          const projectB = getProjectById(b);
          const nameA = projectA ? projectA.name : '';
          const nameB = projectB ? projectB.name : '';
          return nameA.localeCompare(nameB);
        });

      // Add sections for each project
      projectKeys.forEach(projectKey => {
        const projectName = formatProjectName(projectKey);
        const projectColor = getProjectColor(projectKey);

        projectSections.push({
          key: `project-${projectKey}`,
          title: projectName,
          tasks: projectGroups.get(projectKey)!,
          icon: 'folder',
          color: projectColor
        });
      });

      return projectSections;

    case 'taskPhase':
      // Group by task phases
      const projectIdNum = typeof props.projectId === 'string'
        ? parseInt(props.projectId)
        : props.projectId;
      const projectPhases = taskPhaseStore.getPhasesForProject(projectIdNum) || [];

      // Note: Phases are loaded via watcher, not in computed property to avoid infinite loops

      return projectPhases.map(phase => ({
        key: `phase-${phase.id}`,
        title: phase.name,
        description: phase.description,
        tasks: allTasks.filter(task => task.taskPhaseId === phase.id),
        icon: phase.status === 'DRAFT' ? 'edit_note' : phase.status === 'COMPLETED' ? 'check_circle' : 'play_circle',
        color: phase.status === 'DRAFT' ? '#9CA6AF' : phase.status === 'COMPLETED' ? '#4ECBC4' : '#008CE3',
        metadata: {
          phaseId: phase.id,
          status: phase.status,
          isDraft: phase.status === 'DRAFT',
          startDate: phase.startDate,
          endDate: phase.endDate
        }
      }));

    case 'stages':
    default:
      // Group by status/stages (default behavior)
      return [
        {
          key: 'todo',
          title: 'To do',
          tasks: allTasks.filter(task =>
            task.status === 'todo' || task.status === 'pending' || task.status === 'not_started'
          ),
          icon: 'radio_button_unchecked',
          color: '#9CA6AF'
        },
        {
          key: 'doing',
          title: 'Doing',
          tasks: allTasks.filter(task =>
            task.status === 'in_progress' || task.status === 'doing' || task.status === 'active'
          ),
          icon: 'timelapse',
          color: '#008CE3'
        },
        {
          key: 'done',
          title: 'Done',
          tasks: allTasks.filter(task =>
            task.status === 'done' || task.status === 'completed' || task.status === 'finished'
          ),
          icon: 'check_circle',
          color: '#4ECBC4'
        }
      ];
  }
});

// Toggle section collapse state
const toggleSection = (sectionKey: string) => {
  collapsedSections.value[sectionKey] = !collapsedSections.value[sectionKey];
};

// Context Menu functions
const handleViewTask = (task: Task) => {
  emit('view-task', task);
};

const handleDeleteTask = (task: Task) => {
  // Direct deletion without confirmation
  emit('delete-task', task);
};

const handleRestoreTask = (task: Task) => {
  // Restore deleted task
  emit('restore-task', task);
};

const handleSetAsDone = (task: Task) => {
  emit('update-status', task, 'done');
};

// Edit Phase Dialog functions
const openEditPhaseDialog = (section: TaskSection) => {
  if (!section.metadata?.phaseId) return;

  const projectIdNum = typeof props.projectId === 'string'
    ? parseInt(props.projectId)
    : props.projectId;

  if (!projectIdNum) return;

  const phases = taskPhaseStore.getPhasesForProject(projectIdNum);
  const phase = phases.find(p => p.id === section.metadata.phaseId);

  if (phase) {
    editingPhase.value = phase;
    showEditPhaseDialog.value = true;
  }
};

const handlePhaseSaved = () => {
  showEditPhaseDialog.value = false;
  editingPhase.value = null;
};

// Phase drag-and-drop handlers
const draggingSectionIndex = ref<number | null>(null);
const dropTargetSectionIndex = ref<number | null>(null);

const handleSectionDragStart = (event: DragEvent, index: number) => {
  isDraggingPhase.value = true;
  draggingSectionIndex.value = index;
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', index.toString());
  }
};

const handleSectionDragOver = (event: DragEvent, index: number) => {
  event.preventDefault();
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move';
  }
  dropTargetSectionIndex.value = index;
};

const handleSectionDrop = async (event: DragEvent, dropIndex: number) => {
  event.preventDefault();
  event.stopPropagation();

  if (draggingSectionIndex.value === null || draggingSectionIndex.value === dropIndex) {
    return;
  }

  try {
    // Create a copy of the sections array to reorder
    const sections = [...taskSections.value];
    const draggedSection = sections[draggingSectionIndex.value];

    // Remove from original position
    sections.splice(draggingSectionIndex.value, 1);
    // Insert at new position
    sections.splice(dropIndex, 0, draggedSection);

    // Calculate new order values for all phases
    const reorderedPhases = sections.map((section, index) => ({
      id: section.metadata.phaseId,
      order: (index + 1) * 1000
    }));

    // Get project ID
    const projectIdNum = typeof props.projectId === 'string'
      ? parseInt(props.projectId)
      : props.projectId;

    if (!projectIdNum) {
      throw new Error('Project ID is required');
    }

    // Save to database
    await taskPhaseStore.reorderPhases(projectIdNum, reorderedPhases);

    Notify.create({
      type: 'positive',
      message: 'Phase order updated successfully',
      position: 'top'
    });
  } catch (error) {
    console.error('Failed to reorder phases:', error);

    Notify.create({
      type: 'negative',
      message: 'Failed to update phase order',
      position: 'top'
    });
  }
};

const handleSectionDragEnd = () => {
  isDraggingPhase.value = false;
  draggingSectionIndex.value = null;
  dropTargetSectionIndex.value = null;
};

// Removed as checkbox functionality has been disabled
// const toggleTaskStatus = (task: Task) => {
//   emit('toggle-status', task);
// };

// Title editing functions
const startEditTitle = (task: Task) => {
  editingTaskId.value = task.id;
  editingTitle.value = task.title;
  nextTick(() => {
    const input = document.querySelector('.task-title-input') as HTMLInputElement;
    if (input) {
      input.focus();
      input.select();
    }
  });
};

const saveTitle = (task: Task) => {
  if (editingTitle.value.trim() && editingTitle.value !== task.title) {
    emit('update-task', task, 'title', editingTitle.value.trim());
  }
  cancelEditTitle();
};

const cancelEditTitle = () => {
  editingTaskId.value = null;
  editingTitle.value = '';
};

// Update functions for inline editing
const updateAssignee = (task: Task, assignee: any) => {
  // Pass both the user ID and name for optimistic update
  const userId = typeof assignee === 'object' ? assignee.id : assignee;
  const userName = typeof assignee === 'object' ? assignee.name : null;
  emit('update-task', task, 'assignedToId', userId, userName);
};

const clearAssignee = (task: Task) => {
  emit('update-task', task, 'assignedToId', null);
  closeAllDropdowns();
};

const updateDueDate = (task: Task, dateValue: any) => {
  if (dateValue) {
    if (typeof dateValue === 'object' && dateValue.from && dateValue.to) {
      emit('update-task', task, 'dueDate', dateValue.from);
      emit('update-task', task, 'endDate', dateValue.to);
    } else if (typeof dateValue === 'string') {
      // Convert date string to ISO format
      const date = new Date(dateValue);
      emit('update-task', task, 'dueDate', date.toISOString());
    }
    // Close the dropdown after successful update
    closeAllDropdowns();
  }
};

const updatePriority = (task: Task, priority: 'verylow' | 'low' | 'medium' | 'high' | 'urgent') => {
  emit('update-task', task, 'priority', priority);
};

const updateProject = (task: Task, projectId: string | number) => {
  emit('update-task', task, 'projectId', projectId === 'none' ? null : Number(projectId));
};

const getProjectById = (projectId?: string | number) => {
  return projectStore.getProjectById(projectId);
};

const formatProjectName = (projectId?: string | number) => {
  return projectStore.getProjectName(projectId);
};

const getProjectColor = (projectId?: string | number) => {
  const project = projectStore.getProjectById(projectId);
  return project ? project.color : '#6d6e78';
};

const addTag = (task: Task, tag: string) => {
  if (tag && tag.trim()) {
    const updatedTags = [...(task.tags || []), tag.trim()];
    emit('update-task', task, 'tags', updatedTags);
  }
};

const removeTag = (task: Task, tag: string) => {
  const updatedTags = (task.tags || []).filter(t => t !== tag);
  emit('update-task', task, 'tags', updatedTags);
};

// Inline task creation methods
const startInlineAdd = (sectionKey: string) => {
  addingTaskInSection.value = sectionKey;
  newTaskTitle.value = '';
  nextTick(() => {
    const input = document.querySelector('.inline-task-input') as HTMLInputElement;
    if (input) {
      input.focus();
    }
  });
};

const saveInlineTask = (section: any) => {
  // Don't allow submission if already creating
  if (props.creatingTask) {
    return;
  }

  if (!newTaskTitle.value.trim()) {
    cancelInlineAdd();
    return;
  }

  // Emit the add-task event with the title and section metadata
  // Don't call cancelInlineAdd() here - let the parent manage state via creatingTask prop
  // Input will auto-hide when creatingTask becomes false after successful creation
  emit('add-task', section.key, newTaskTitle.value.trim(), section.metadata);
};

const cancelInlineAdd = () => {
  // Don't allow canceling while task is being created
  if (props.creatingTask) {
    return;
  }

  addingTaskInSection.value = null;
  newTaskTitle.value = '';
};

// Auto-hide inline input when task creation completes successfully
// When creatingTask changes from true to false, the task was successfully created
watch(() => props.creatingTask, (newValue, oldValue) => {
  // When creation completes (true -> false), auto-hide the input
  if (oldValue === true && newValue === false && addingTaskInSection.value) {
    cancelInlineAdd();
  }
});


// Helper functions for assignee display
const getInitialsFromName = (name: string | null | undefined) => {
  if (!name || typeof name !== 'string') return '?';
  if (name === 'current_user') return 'GT';

  // Try to find assignee by name to use the centralized getInitials
  const assignee = availableUsers.value.find(u => u.name === name);
  if (assignee?.initials) {
    return assignee.initials;
  }

  // Fallback to parsing the name
  const parts = name.split(' ').filter(part => part.length > 0);
  if (parts.length >= 2) {
    return assigneeStore.getInitials(parts[0], parts[1]);
  }
  return assigneeStore.getInitials(parts[0], '');
};

const getAvatarColorFromName = (name: string | null | undefined) => {
  if (!name || typeof name !== 'string') return '#6d6e78';

  // Try to find assignee by name to use their consistent color
  const assignee = availableUsers.value.find(u => u.name === name);
  if (assignee?.avatarColor) {
    return assignee.avatarColor;
  }

  // Fallback to generating color from name parts
  const parts = name.split(' ').filter(part => part.length > 0);
  if (parts.length >= 2) {
    return assigneeStore.getAvatarColor(parts[0], parts[1]);
  }
  return assigneeStore.getAvatarColor(parts[0], '');
};

const isDatePastDue = (dateString: string) => {
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);

  return date < today;
};

const isDateToday = (dateString: string) => {
  const date = new Date(dateString);
  const today = new Date();

  return date.toDateString() === today.toDateString();
};

const getDateStatus = (dueDate?: string, endDate?: string) => {
  // Check the most relevant date (endDate if exists, otherwise dueDate)
  const dateToCheck = endDate || dueDate;

  if (!dateToCheck) return 'none';

  if (isDateToday(dateToCheck)) {
    return 'today';
  } else if (isDatePastDue(dateToCheck)) {
    return 'overdue';
  }

  return 'upcoming';
};

const getDateStatusClass = (dueDate?: string, endDate?: string) => {
  const status = getDateStatus(dueDate, endDate);
  return `date-${status}`;
};

const formatTaskDueDate = (startDate?: string, endDate?: string) => {
  if (!startDate && !endDate) return '';

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if today
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    }

    // Format as "Sep 16"
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // If both dates exist and are the same, show only one
  if (startDate && endDate) {
    const start = formatDate(startDate);
    const end = formatDate(endDate);

    // If the formatted dates are the same, show only one
    if (start === end) {
      return start;
    }

    // Otherwise show range
    return `${start} – ${end}`;
  } else if (startDate) {
    return formatDate(startDate);
  } else if (endDate) {
    return formatDate(endDate);
  }
  return '';
};

const capitalizeFirst = (str?: string) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

const formatAssignee = (name: string | null | undefined) => {
  if (!name || typeof name !== 'string') return 'Unassigned';
  if (name === 'current_user') return 'Me';

  // Capitalize each word in the name
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

// Dropdown management
const openAssigneeDropdown = (taskId: string, event: MouseEvent) => {
  event.stopPropagation();
  const dropdownKey = `assignee-${taskId}`;

  if (activeDropdown.value === dropdownKey) {
    activeDropdown.value = null;
    assigneeSearchQuery.value = '';
  } else {
    // Calculate position before opening
    const element = event.currentTarget as HTMLElement;
    calculateDropdownPosition(element, 'assignee', taskId);

    activeDropdown.value = dropdownKey;
    assigneeSearchQuery.value = '';
    // Focus search input after dropdown opens
    nextTick(() => {
      const searchInput = document.querySelector('.assignee-dropdown .search-input') as HTMLInputElement;
      if (searchInput) {
        searchInput.focus();
      }
    });
  }
};

const openPriorityDropdown = (taskId: string, event: MouseEvent) => {
  event.stopPropagation();
  const dropdownKey = `priority-${taskId}`;

  if (activeDropdown.value === dropdownKey) {
    activeDropdown.value = null;
  } else {
    const element = event.currentTarget as HTMLElement;
    calculateDropdownPosition(element, 'priority', taskId);
    activeDropdown.value = dropdownKey;
  }
};

const openDatePicker = (taskId: string, event: MouseEvent) => {
  event.stopPropagation();
  const dropdownKey = `date-${taskId}`;

  if (activeDropdown.value === dropdownKey) {
    activeDropdown.value = null;
  } else {
    const element = event.currentTarget as HTMLElement;
    calculateDropdownPosition(element, 'date', taskId);
    activeDropdown.value = dropdownKey;
  }
};

const openProjectDropdown = (taskId: string, event: MouseEvent) => {
  event.stopPropagation();
  const dropdownKey = `project-${taskId}`;

  if (activeDropdown.value === dropdownKey) {
    activeDropdown.value = null;
  } else {
    const element = event.currentTarget as HTMLElement;
    calculateDropdownPosition(element, 'project', taskId);
    activeDropdown.value = dropdownKey;
  }
};

const closeAllDropdowns = () => {
  activeDropdown.value = null;
  assigneeSearchQuery.value = '';
};

// Tag editing
const startEditTag = (task: Task) => {
  editingTagTaskId.value = task.id;
  newTag.value = '';
  nextTick(() => {
    const input = document.querySelector('.tag-input') as HTMLInputElement;
    if (input) {
      input.focus();
    }
  });
};

const cancelEditTag = () => {
  editingTagTaskId.value = null;
  newTag.value = '';
};

// Ultra-simple drag and drop handlers
const handleDragStart = (event: DragEvent, task: Task, sectionKey: string, index: number) => {
  if (!event.dataTransfer) return;

  // Store drag data
  draggedTask.value = task;
  draggedIndex.value = index;
  draggedSection.value = sectionKey;

  // Set drag effect
  event.dataTransfer.effectAllowed = 'move';
  event.dataTransfer.setData('text/plain', task.id.toString());

  // Add visual feedback
  (event.currentTarget as HTMLElement).classList.add('dragging');
};

const handleDragOver = (event: DragEvent, _task: Task, _sectionKey: string, _index: number) => {
  event.preventDefault();
  event.stopPropagation();

  if (!event.dataTransfer) return;

  // Allow drag and drop for all grouping modes
  event.dataTransfer.dropEffect = 'move';

  // Remove all existing highlights
  document.querySelectorAll('.drag-over')
    .forEach(el => el.classList.remove('drag-over'));

  // Highlight current row - insertion position depends on drag direction
  (event.currentTarget as HTMLElement).classList.add('drag-over');
};

const handleDrop = (event: DragEvent, sectionKey: string, dropIndex: number) => {
  event.preventDefault();
  event.stopPropagation();

  // Clean up highlights immediately
  document.querySelectorAll('.drag-over')
    .forEach(el => el.classList.remove('drag-over'));

  // Validate
  if (!draggedTask.value || draggedIndex.value === null) {
    resetDragState();
    return;
  }

  // Check if moving between sections
  const isMovingBetweenSections = draggedSection.value !== sectionKey;

  // Simple pass-through - let parent handle all the logic
  // Skip if dropping on same position
  if (!isMovingBetweenSections && draggedIndex.value === dropIndex) {
    resetDragState();
    return;
  }

  // Get the target section with metadata
  const targetSection = taskSections.value.find(s => s.key === sectionKey);

  // Emit the reorder with raw indices - no adjustments
  emit('reorder-tasks', {
    fromSectionKey: draggedSection.value,
    toSectionKey: sectionKey,
    sectionKey,
    fromIndex: draggedIndex.value,  // Visual source index
    toIndex: dropIndex,              // Visual target index (raw, no adjustments!)
    task: draggedTask.value,
    isMovingBetweenSections,
    targetSectionMetadata: targetSection?.metadata || null  // Pass section metadata
  });

  resetDragState();
};

const handleDragLeave = (event: DragEvent) => {
  // Remove highlight when leaving
  const target = event.target as HTMLElement;
  if (target.classList.contains('task-row')) {
    target.classList.remove('drag-over');
  }
};

const handleDragEnd = (event: DragEvent) => {
  // Clean everything
  (event.currentTarget as HTMLElement).classList.remove('dragging');
  document.querySelectorAll('.drag-over')
    .forEach(el => el.classList.remove('drag-over'));

  resetDragState();
};

const resetDragState = () => {
  draggedTask.value = null;
  draggedIndex.value = null;
  draggedSection.value = null;
};

// Smart dropdown positioning
const dropdownPositions = ref<Record<string, string>>({});

const getDropdownPositionClass = (taskId: string, dropdownType: string) => {
  const key = `${dropdownType}-${taskId}`;
  return dropdownPositions.value[key] || '';
};

const calculateDropdownPosition = (element: HTMLElement, dropdownType: string, taskId: string) => {
  const rect = element.getBoundingClientRect();
  const dropdownHeight = 300; // Approximate max height of dropdown
  const viewportHeight = window.innerHeight;
  const spaceBelow = viewportHeight - rect.bottom;

  const key = `${dropdownType}-${taskId}`;

  // If not enough space below and more space above, position above
  if (spaceBelow < dropdownHeight && rect.top > dropdownHeight) {
    dropdownPositions.value[key] = 'dropdown-above';
  } else {
    dropdownPositions.value[key] = '';
  }
};
</script>

<style lang="scss" scoped src="./Task.scss"></style>

<style lang="scss" scoped>
// Compact mode styles
.task-list-view.compact-mode {
  // Reduce spacing in grouping tabs
  .grouping-tabs {
    padding: 6px 12px;
    gap: 4px;

    .tab-button {
      padding: 4px 12px;
      font-size: 12px;
      min-height: 28px;

      .material-icons {
        font-size: 16px;
      }
    }
  }

  // More compact task sections
  .task-section {
    margin-bottom: 12px;

    .section-header {
      padding: 4px 0;

      h3 {
        font-size: 13px;
      }

      .section-title-input {
        font-size: 13px;
      }
    }

    .task-item {
      padding: 6px 12px;
      margin-bottom: 4px;

      .task-checkbox {
        width: 16px;
        height: 16px;
      }

      .task-content {
        gap: 8px;

        .task-title {
          font-size: 13px;
        }
      }

      .task-details,
      .task-meta {
        font-size: 11px;
        gap: 8px;
      }
    }
  }

  // Smaller add task button
  .add-task-button {
    padding: 6px 12px;
    font-size: 12px;
    min-height: 28px;

    .material-icons {
      font-size: 16px;
    }
  }

  // Smaller add section button
  .add-section-button {
    padding: 8px 12px;
    font-size: 12px;

    .material-icons {
      font-size: 18px;
    }
  }
}

// Dense Context Menu Styles
:deep(.md3-context-menu) {
  .q-menu__paper {
    background: white;
    border: 1px solid #e0e0e0;
    border-radius: 2px;
    box-shadow: none !important; // Override Quasar's default shadow
    padding: 0;
    z-index: 10000 !important; // Ensure menu appears above TaskManagementDialog (z-index: 9999)
  }
}

.md3-menu-item {
  border-radius: 0;
  margin: 0;
  min-height: 32px;
  font-size: 13px;
  padding: 4px 8px;

  &:hover {
    background-color: #f5f5f5;
  }

  .q-item__section--avatar {
    min-width: 24px;
    padding-right: 8px;
  }

  .md3-menu-text {
    color: #333333;
    font-weight: 400;
  }
}
</style>

<style lang="scss">
// Global styles for drag ghost
.drag-ghost {
  background: white !important;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15) !important;
  border: 2px solid #097BFF !important;
  border-radius: 6px !important;
  opacity: 0.9 !important;
}

// Smooth transitions for drag states
.task-row {
  transition: transform 0.2s ease, opacity 0.2s ease, background 0.15s ease !important;
}

// Cursor states during drag
body.dragging {
  cursor: grabbing !important;
}

// Task row drag states
.task-row {
  transition: background-color 0.2s ease, opacity 0.2s ease;

  &.dragging {
    opacity: 0.5;
    background-color: #f5f5f5;
    cursor: grabbing;
  }

  &.drag-over {
    background-color: rgba(0, 140, 227, 0.05);
  }

  &.drag-over-top {
    border-top: 2px solid #008CE3;
  }

  &.drag-over-bottom {
    border-bottom: 2px solid #008CE3;
  }
}

// Hide dropzone indicators when not dragging
.task-section:not(.drag-active) {
  .drop-zone-indicator {
    display: none;
  }
}

// Visual feedback for sections during drag
.task-section.drag-active {
  .section-header {
    color: #097BFF;
  }

  .section-content {
    background: rgba(9, 123, 255, 0.02);
    border-radius: 6px;
    padding: 4px;
    margin: -4px;
  }
}

// Drop placeholder indicator
.drop-placeholder {
  height: 4px;
  margin: 4px 0;
  position: relative;

  .placeholder-line {
    position: absolute;
    top: 50%;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, #097BFF 0%, rgba(9, 123, 255, 0.6) 100%);
    border-radius: 2px;
    transform: translateY(-50%);
    animation: placeholderPulse 1s ease-in-out infinite;
  }
}

@keyframes placeholderPulse {
  0%, 100% {
    opacity: 0.6;
    transform: translateY(-50%) scaleX(0.98);
  }
  50% {
    opacity: 1;
    transform: translateY(-50%) scaleX(1);
  }
}

// Enhanced drag handle on hover
.drag-handle {
  position: relative;
  cursor: move;
  cursor: grab;
  cursor: -webkit-grab;
  user-select: none;
  padding: 4px;
  border-radius: 4px;
  transition: background 0.2s ease;

  &:hover {
    background: rgba(9, 123, 255, 0.1);
  }

  &:active {
    cursor: grabbing;
    cursor: -webkit-grabbing;
    background: rgba(9, 123, 255, 0.2);
  }

  &::after {
    content: 'Drag to reorder';
    position: absolute;
    left: 100%;
    top: 50%;
    transform: translateY(-50%);
    margin-left: 8px;
    padding: 4px 8px;
    background: #333;
    color: white;
    font-size: 11px;
    border-radius: 4px;
    white-space: nowrap;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.2s ease;
    z-index: 1000;
  }

  &:hover::after {
    opacity: 0.9;
  }
}

// Make task row draggable
.task-row[draggable="true"] {
  &:hover .drag-handle {
    opacity: 1;
    color: #097BFF;
  }

  &.dragging {
    opacity: 0.5;
    cursor: grabbing;
  }
}
</style>