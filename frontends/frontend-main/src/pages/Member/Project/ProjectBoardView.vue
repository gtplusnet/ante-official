<template>
  <div class="project-board-view">
    <!-- Refresh button with cache indicator -->
    <div class="q-mb-md row items-center justify-end">
      <q-btn
        flat
        round
        dense
        size="sm"
        :loading="isRefreshing"
        @click="refreshProjects"
        class="q-mr-sm"
      >
        <q-icon
          name="refresh"
          size="18px"
          :class="{ 'rotate-animation': isRefreshing }"
          style="color: var(--q-grey-icon)"
        />
        <q-tooltip>{{ isCached ? 'Refresh projects (showing cached data)' : 'Refresh projects' }}</q-tooltip>
      </q-btn>
      <div v-if="isCached && lastUpdated" class="text-caption text-grey">
        Updated {{ getRelativeTime(lastUpdated) }}
      </div>
    </div>

    <div v-if="isLoading && !isCached" class="flex flex-center" style="height: 400px">
      <q-spinner-dots color="primary" size="40px" />
    </div>

    <template v-else>
      <div class="board-container q-pa-sm">
        <div
          v-for="column in boardColumns"
          :key="column.key"
          class="board-column"
          :class="{ 'drop-active': dragOverColumn === column.key }"
          @dragover.prevent="handleDragOver(column.key)"
          @dragleave="handleDragLeave"
          @drop="handleDrop($event, column.key)"
        >
          <div class="column-header">
            <div class="column-header-top">
              <h6 class="column-title text-title-large">{{ column.title }}</h6>
              <div class="q-badge text-title-small" :class="getColumnProjects(column.key).length === 0 ? 'q-badge-zero' : ''">
                {{ getColumnProjects(column.key).length }}
              </div>
            </div>
            <div class="divider q-my-sm"></div>
            <div class="column-total text-title-medium">
              {{ formatColumnTotal(getColumnProjects(column.key)) }}
            </div>
          </div>

          <div class="column-content">
            <div
              v-for="project in getColumnProjects(column.key)"
              :key="project.id"
              class="project-card"
              :class="{
                'drag-source': draggedProject?.id === project.id && isDragging
              }"
              draggable="true"
              @dragstart="handleDragStart($event, project)"
              @dragend="handleDragEnd"
              @click="openProject(project.id)"
            >
              <div class="project-card-header">
                <div class="project-name text-title-small">{{ project.name }}</div>
                <q-btn flat round dense size="sm" icon="more_vert" @click.stop>
                  <q-menu anchor="bottom right" self="top right" auto-close>
                    <div class="q-pa-sm">
                      <div clickable @click="editProject(project)" class="row q-pa-xs cursor-pointer">
                        <div><q-icon name="edit" color="grey" size="20px" /></div>
                        <div class="text-blue q-pa-xs text-label-medium">Edit</div>
                      </div>
                      <div clickable @click="deleteProject(project)" class="row q-pa-xs cursor-pointer">
                        <div><q-icon name="delete" color="grey" size="20px" /></div>
                        <div class="text-blue q-pa-xs text-label-medium">Delete</div>
                      </div>
                    </div>
                  </q-menu>
                </q-btn>
              </div>

              <div class="project-card-body text-label-small">
                <!-- Project code badge -->
                <div class="deal-badge row" v-if="project.code">
                  <div class="deal-type">{{ project.code }}</div>
                  <div class="deal-status" v-if="project.progressPercentage">
                    {{ project.progressPercentage }}%
                  </div>
                </div>

                <!-- Client info -->
                <div class="avatar-container row items-center" v-if="project.client">
                  <q-avatar size="md">
                    <q-icon name="business" color="grey" />
                  </q-avatar>
                  <div class="text-grey text-label-medium q-ml-sm">{{ project.client.name }}</div>
                </div>

                <!-- Budget -->
                <div class="abc-item row justify-between" v-if="project.budget && project.budget.raw > 0">
                  <div class="row items-center">
                    <div class="row items-center q-mr-sm" :style="{ color: '#747786' }">
                      <q-icon name="payments" size="18px" />
                      <span class="text-label-medium">Budget</span>
                    </div>
                    <div class="text-bold text-label-medium" :style="{ color: 'var(--q-text-dark)' }">
                      {{ project.budget.formatCurrency }}
                    </div>
                  </div>
                </div>

                <!-- Timeline -->
                <div class="detail-item row justify-between" v-if="project.startDate && project.endDate">
                  <div class="row items-center">
                    <div class="row items-center q-mr-sm" :style="{ color: '#747786' }">
                      <q-icon name="schedule" size="18px" />
                      <span class="text-label-medium">Timeline</span>
                    </div>
                    <div class="text-bold text-label-medium" :style="{ color: 'var(--q-text-dark)' }">
                      {{ project.startDate.date }} - {{ project.endDate.date }}
                    </div>
                  </div>
                </div>

                <!-- Progress bar -->
                <div class="progress-section" v-if="project.progressPercentage !== undefined">
                  <q-linear-progress
                    :value="project.progressPercentage / 100"
                    :color="getProgressColor(project.progressPercentage)"
                    track-color="grey-3"
                    style="height: 4px; border-radius: 2px"
                  />
                </div>
              </div>
            </div>

            <div v-if="!getColumnProjects(column.key).length" class="empty-column">
              No projects in this stage
            </div>
          </div>
        </div>
      </div>
    </template>

    <ProjectCreateDialog
      v-model="isProjectCreateDialogOpen"
      :projectData="projectData"
      @close="fetchData"
    />
  </div>
</template>

<style scoped>
.project-board-view {
  width: 100%;
}

/* Board Container */
.board-container {
  margin: 0 auto;
  display: flex;
  gap: 16px;
  height: calc(100vh - 250px);
  width: 100%;
  overflow: auto;
  user-select: none;
}

/* Board Column */
.board-column {
  flex: 0 0 310px;
  background: #f6f8fb;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  will-change: transform, box-shadow;
}

.board-column.drop-active {
  background: #e8f4fd;
  box-shadow: 0 0 0 2px #1976d2;
  transform: scale(1.01);
}

/* Column Header */
.column-header {
  margin: 16px;
}

.column-header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.column-title {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: var(--q-text-dark);
}

.q-badge {
  background-color: var(--q-secondary);
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  padding: 5px 8px;
  border-radius: 4px;
  transition: background-color 0.3s ease;
}

.q-badge-zero {
  background-color: #c7cbd2;
}

.divider {
  height: 3px;
  width: 35px;
  background-color: #615ff6;
}

.column-total {
  font-size: 18px;
  font-weight: 600;
  color: #747786;
}

/* Column Content */
.column-content {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 0 16px 16px 16px;
  max-height: calc(100vh - 350px);
  transition: padding 0.3s ease;
}

/* Project Card */
.project-card {
  background: #fff;
  border-radius: 8px;
  cursor: move;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  transform-origin: center;
  will-change: transform, opacity;
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Smooth transitions for drag and drop */

.project-card.drag-source {
  opacity: 0.3;
  transform: scale(0.98);
  transition: all 0.2s ease;
}

.project-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.project-card.dragging {
  cursor: grabbing;
}

/* Card Header */
.project-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 12px 12px 0 12px;
}

.project-name {
  font-weight: 700;
  font-size: 18px;
  color: var(--q-text-dark);
  word-break: break-word;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.project-name:hover {
  text-decoration: underline;
  cursor: pointer;
}

/* Card Body */
.project-card-body {
  padding-bottom: 12px;
  transition: opacity 0.3s ease;
}

.deal-badge {
  padding: 12px 12px 0 12px;
  gap: 6px;
}

.deal-type {
  font-weight: 500;
  margin-bottom: 8px;
  color: #fff;
  background-color: var(--q-dark);
  border-radius: 50px;
  padding: 2px 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.deal-status {
  font-weight: 500;
  margin-bottom: 8px;
  color: #fff;
  background-color: #9e9e9e;
  border-radius: 50px;
  padding: 0 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-container {
  padding: 5px 12px;
}

.abc-item {
  padding: 5px 12px;
}

.detail-item {
  font-size: 16px;
  padding: 6px 12px;
}

.progress-section {
  padding: 0 12px 6px 12px;
  transition: transform 0.3s ease;
}

/* Empty Column */
.empty-column {
  text-align: center;
  color: #999;
  padding: 40px 20px;
  font-size: 14px;
}

/* Rotation animation for refresh icon */
@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.rotate-animation {
  animation: rotate 1s linear infinite;
}
</style>

<script lang="ts" setup>
import { ref, computed, onMounted, defineAsyncComponent } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { api } from '../../../boot/axios';
import { useCache } from '../../../composables/useCache';
import { projectCache, CacheTTL } from '../../../utils/cache/implementations';

// Lazy-loaded dialogs (ALL dialogs must be lazy loaded - CLAUDE.md)
const ProjectCreateDialog = defineAsyncComponent(() =>
  import("../../../components/dialog/ProjectCreateDialog.vue")
);

// Component definition
defineOptions({
  name: 'ProjectBoardView'
});

// Import types
import type { ProjectStatus } from "@shared/response";
import { ProjectDataResponse } from "@shared/response";

// Import board stages reference - single source of truth
import {
  PROJECT_BOARD_COLUMNS
} from "../../../reference/board-stages.reference";

// Setup utilities
const router = useRouter();
const $q = useQuasar();

// Use board columns from reference file
const boardColumns = PROJECT_BOARD_COLUMNS;

// Type for internal project display
type ProjectDisplayInterface = {
  id: number;
  name: string;
  description: string;
  budget: { formatCurrency: string; raw: number };
  isDeleted: boolean;
  startDate: { date: string; raw: string | Date };
  endDate: { date: string; raw: string | Date };
  status: ProjectStatus;
  projectBoardStage?: string;
  progressPercentage?: number;
  code?: string;
  client?: any;
  clientId?: number;
  locationId?: number;
};

// Reactive state
const draggedProject = ref<ProjectDisplayInterface | null>(null);
const dragOverColumn = ref<string | null>(null);
const projectData = ref<ProjectDataResponse | undefined>(undefined);
const isProjectCreateDialogOpen = ref<boolean>(false);
const isDragging = ref<boolean>(false);

// Use centralized cache for projects with Backend API
const {
  data: cachedProjectData,
  isCached,
  isRefreshing,
  lastUpdated,
  load: loadProjects,
  refresh: refreshProjectsCache
} = useCache(
  projectCache,
  async () => {
    try {
      // Use backend API with table endpoint (PUT /project)
      const response = await api.put('/project', {
        // TableBodyDTO
        filters: [
          { field: 'isDeleted', operator: '=', value: false },
          { field: 'isLead', operator: '=', value: false },
          { field: 'status', operator: '=', value: 'PROJECT' }
        ],
        sorts: [{ field: 'createdAt', order: 'desc' }]
      }, {
        params: {
          // TableQueryDTO
          page: 1,
          perPage: 100 // Get more for board view
        }
      });

      // Backend returns formatted data with list, pagination, etc.
      return {
        projects: response.data?.list || [],
        currentPage: response.data?.currentPage || 1,
        pagination: response.data?.pagination || []
      };
    } catch (err) {
      console.error('Unexpected error fetching projects:', err);
      $q.notify({
        type: 'negative',
        message: 'Failed to load projects',
        position: 'top',
        timeout: 3000
      });
      return { projects: [], currentPage: 1, pagination: [] };
    }
  },
  {
    cacheKey: () => ({ type: 'board' }),
    ttl: CacheTTL.TASK_LIST,
    invalidateEvents: ['project-created', 'project-updated', 'project-deleted']
  }
);

// Computed properties
const isLoading = computed(() => isRefreshing.value && !isCached.value);

const projectList = computed<ProjectDisplayInterface[]>(() => {
  if (!cachedProjectData.value?.projects) return [];

  // Backend already returns fully formatted data, just map to display interface
  return cachedProjectData.value.projects.map((item: any) => ({
    id: item.id,
    name: item.name || 'Unnamed Project',
    description: item.description || '',
    budget: item.budget || { formatCurrency: '₱0.00', raw: 0 }, // Backend formats currency
    isDeleted: item.isDeleted || false,
    startDate: item.startDate || { date: 'No date', raw: null }, // Backend formats dates
    endDate: item.endDate || { date: 'No date', raw: null },
    status: item.status as ProjectStatus,
    projectBoardStage: item.projectBoardStage || 'planning',
    progressPercentage: item.progressPercentage || 0,
    code: item.code || '',
    client: item.client, // Backend includes full client object
    clientId: item.client?.id,
    locationId: item.location?.id
  }));
});

// Get projects for a specific column
const getColumnProjects = (columnKey: string) => {
  const column = boardColumns.find(c => c.key === columnKey);
  if (!column) return [];

  return projectList.value.filter((project: ProjectDisplayInterface) => {
    // Only check projectBoardStage since that's the actual board field
    const boardStage = project.projectBoardStage || 'planning';
    return column.stages.includes(boardStage);
  });
};

// Format column total
const formatColumnTotal = (projects: ProjectDisplayInterface[]): string => {
  if (!projects || projects.length === 0) {
    return '₱0.00';
  }

  const total = projects.reduce((sum, project) => {
    return sum + (project.budget?.raw || 0);
  }, 0);

  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP'
  }).format(total);
};

// Drag and drop handlers
const handleDragStart = (event: DragEvent, project: ProjectDisplayInterface) => {
  draggedProject.value = project;
  isDragging.value = true;
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', project.id.toString());
    event.dataTransfer.dropEffect = 'move';
  }
  // Add dragging class to the element
  const target = event.target as HTMLElement;
  target.classList.add('dragging');
};

const handleDragEnd = (event: DragEvent) => {
  const target = event.target as HTMLElement;
  target.classList.remove('dragging');
  draggedProject.value = null;
  dragOverColumn.value = null;
  isDragging.value = false;
};

const handleDragOver = (columnKey: string) => {
  dragOverColumn.value = columnKey;
};

const handleDragLeave = () => {
  dragOverColumn.value = null;
};

const handleDrop = async (event: DragEvent, columnKey: string) => {
  event.preventDefault();
  dragOverColumn.value = null;

  if (!draggedProject.value || draggedProject.value.projectBoardStage === columnKey) {
    draggedProject.value = null;
    isDragging.value = false;
    return;
  }

  // Store the project data before the API call
  const projectToMove = { ...draggedProject.value };
  const originalStage = projectToMove.projectBoardStage;

  // Clear drag state immediately for smooth UX
  draggedProject.value = null;
  isDragging.value = false;

  try {
    // Optimistically update the cache data first (this will trigger computed property update)
    if (cachedProjectData.value?.projects) {
      const cacheIndex = cachedProjectData.value.projects.findIndex((p: any) => p.id === projectToMove.id);
      if (cacheIndex !== -1) {
        // Update the cache
        cachedProjectData.value.projects[cacheIndex].projectBoardStage = columnKey;

        // Then update via backend API (PATCH /project/board-stage)
        await api.patch('/project/board-stage', {
          projectId: projectToMove.id.toString(),
          nowBoardStageKey: columnKey
        });

        // Silent success - no notification needed for smooth UX
      }
    }
  } catch (error) {
    console.error('Error updating project stage:', error);

    // Rollback on error
    if (cachedProjectData.value?.projects) {
      const cacheIndex = cachedProjectData.value.projects.findIndex((p: any) => p.id === projectToMove.id);
      if (cacheIndex !== -1) {
        cachedProjectData.value.projects[cacheIndex].projectBoardStage = originalStage;
      }
    }

    $q.notify({
      type: 'negative',
      message: 'Failed to update project stage',
      position: 'top',
      timeout: 3000
    });

    // Refresh to reset state on error
    await refreshProjectsCache();
  }
};

// Methods
const refreshProjects = async () => {
  await refreshProjectsCache();
  $q.notify({
    type: 'positive',
    message: 'Projects refreshed',
    position: 'top',
    timeout: 1000
  });
};

const getRelativeTime = (date: Date): string => {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  return `${Math.floor(hours / 24)} day${Math.floor(hours / 24) > 1 ? 's' : ''} ago`;
};

// Get color based on progress percentage - using subtle colors
const getProgressColor = (progress: number): string => {
  if (progress < 25) return 'grey-6';
  if (progress < 50) return 'grey-7';
  if (progress < 75) return 'blue-grey-6';
  if (progress < 100) return 'blue-grey-7';
  return 'grey-8';
};

const openProject = (id: number): void => {
  router.push({ name: 'member_project_page', params: { id } });
};

const editProject = async (project: ProjectDisplayInterface): void => {
  try {
    // Fetch full project data from backend
    const response = await api.get(`/project?id=${project.id}`);
    projectData.value = response.data as ProjectDataResponse;
    isProjectCreateDialogOpen.value = true;
  } catch (error) {
    console.error('Error fetching project data:', error);
    $q.notify({
      type: 'negative',
      message: 'Failed to load project data for editing',
      position: 'top',
      timeout: 3000
    });
  }
};

const deleteProject = (project: ProjectDisplayInterface): void => {
  $q.dialog({
    title: 'Delete Project',
    message: `Are you sure you want to delete ${project.name}?`,
    cancel: true,
  }).onOk(async () => {
    // Delete logic to be implemented
    console.log('Deleting project:', project.id);
  });
};

const fetchData = async (): Promise<void> => {
  await loadProjects();
};

// Lifecycle
onMounted(() => {
  loadProjects();
});
</script>