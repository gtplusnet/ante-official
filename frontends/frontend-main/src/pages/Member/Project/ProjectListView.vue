<template>
  <div class="project-list-view">
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

    <template v-if="!isLoading || (isCached && projectList.length > 0)">
      <q-table
        :rows="projectList"
        :columns="columns"
        row-key="id"
        flat
        bordered
        :pagination="pagination"
        :loading="isRefreshing"
        class="project-table"
        :no-data-label="'No projects found'"
      >
        <!-- Custom header -->
        <template v-slot:header="props">
          <q-tr :props="props">
            <q-th
              v-for="col in props.cols"
              :key="col.name"
              :props="props"
              class="table-header"
            >
              {{ col.label }}
            </q-th>
          </q-tr>
        </template>

        <!-- Custom body -->
        <template v-slot:body="props">
          <q-tr :props="props" class="table-row" @click="openProject(props.row.id)">
            <!-- Project Name -->
            <q-td key="name" :props="props">
              <div class="project-name">
                <span class="text-body-medium">{{ props.row.name }}</span>
                <div class="text-caption text-grey-6" v-if="props.row.description">
                  {{ truncateText(props.row.description, 50) }}
                </div>
              </div>
            </q-td>

            <!-- Client -->
            <q-td key="client" :props="props">
              <div class="client-info" v-if="props.row.client">
                <q-icon name="person" size="xs" class="q-mr-xs" />
                {{ props.row.client.name }}
              </div>
              <span v-else class="text-grey-5">No client</span>
            </q-td>

            <!-- Budget -->
            <q-td key="budget" :props="props">
              <span class="budget-amount">{{ props.row.budget.formatted }}</span>
            </q-td>

            <!-- Start Date -->
            <q-td key="startDate" :props="props">
              <div class="date-cell">
                <q-icon name="event" size="xs" class="q-mr-xs" />
                {{ props.row.startDate.formatted }}
              </div>
            </q-td>

            <!-- End Date -->
            <q-td key="endDate" :props="props">
              <div class="date-cell">
                <q-icon name="event_available" size="xs" class="q-mr-xs" />
                {{ props.row.endDate.formatted }}
              </div>
            </q-td>

            <!-- Status -->
            <q-td key="status" :props="props">
              <q-badge
                :color="getStatusColor(props.row.projectBoardStage || props.row.status)"
                text-color="white"
                class="text-caption"
              >
                {{ formatStatus(props.row.projectBoardStage || props.row.status) }}
              </q-badge>
            </q-td>

            <!-- Progress -->
            <q-td key="progress" :props="props">
              <div class="progress-cell">
                <q-linear-progress
                  :value="(props.row.progressPercentage || 0) / 100"
                  color="primary"
                  style="height: 6px; width: 60px"
                  class="q-mr-xs"
                />
                <span class="text-caption">{{ props.row.progressPercentage || 0 }}%</span>
              </div>
            </q-td>

            <!-- Actions -->
            <q-td key="actions" :props="props" auto-width>
              <div class="action-buttons">
                <q-btn
                  flat
                  round
                  dense
                  size="sm"
                  icon="edit"
                  @click.stop="editProject(props.row)"
                >
                  <q-tooltip>Edit</q-tooltip>
                </q-btn>
                <q-btn
                  flat
                  round
                  dense
                  size="sm"
                  icon="delete"
                  @click.stop="deleteProject(props.row)"
                >
                  <q-tooltip>Delete</q-tooltip>
                </q-btn>
              </div>
            </q-td>
          </q-tr>
        </template>
      </q-table>
    </template>

    <template v-else>
      <div class="no-projects-container">
        <div class="no-projects-text">
          <global-loader></global-loader>
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
.project-list-view {
  width: 100%;
}

.project-table {
  background: var(--md-sys-color-surface);
  border: 1px solid var(--md-sys-color-outline-variant);
}

.project-table :deep(.q-table__top) {
  background: var(--md-sys-color-surface-variant-low);
  border-bottom: 1px solid var(--md-sys-color-outline-variant);
}

.table-header {
  background: var(--md-sys-color-surface-variant-low);
  font-weight: 500;
  color: var(--md-sys-color-on-surface);
  padding: 12px !important;
  border-bottom: 1px solid var(--md-sys-color-outline-variant);
}

.table-row {
  cursor: pointer;
  transition: background 0.2s ease;
}

.table-row:hover {
  background: var(--md-sys-color-primary-container-low);
}

.table-row td {
  padding: 12px !important;
  border-bottom: 1px solid var(--md-sys-color-outline-variant);
}

.project-name {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.client-info {
  display: flex;
  align-items: center;
  color: var(--md-sys-color-on-surface-variant);
}

.budget-amount {
  font-weight: 500;
  color: var(--md-sys-color-primary);
}

.date-cell {
  display: flex;
  align-items: center;
  color: var(--md-sys-color-on-surface-variant);
}

.progress-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.action-buttons {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s;
}

.table-row:hover .action-buttons {
  opacity: 1;
}

.no-projects-container {
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  height: calc(100vh - 300px);
}

.no-projects-text {
  font-size: 1rem;
  color: var(--text-color);
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
import GlobalLoader from "../../../components/shared/common/GlobalLoader.vue";

// Lazy-loaded dialogs (ALL dialogs must be lazy loaded - CLAUDE.md)
const ProjectCreateDialog = defineAsyncComponent(() =>
  import("../../../components/dialog/ProjectCreateDialog.vue")
);

// Component definition
defineOptions({
  name: 'ProjectListView'
});

// Import types
import type { ProjectStatus } from "@shared/response";
import { ProjectDataResponse } from "@shared/response";

// Setup utilities
const router = useRouter();
const $q = useQuasar();

// Type for internal project display
type ProjectDisplayInterface = {
  id: number;
  name: string;
  description: string;
  budget: { formatted: string; raw: number };
  isDeleted: boolean;
  startDate: { formatted: string; raw: string | Date };
  endDate: { formatted: string; raw: string | Date };
  status: ProjectStatus;
  projectBoardStage?: string;
  progressPercentage?: number;
  client?: any;
  clientId?: number;
  locationId?: number;
};

// Table columns definition
const columns = [
  {
    name: 'name',
    required: true,
    label: 'Project Name',
    align: 'left' as const,
    field: (row: ProjectDisplayInterface) => row.name,
    sortable: true
  },
  {
    name: 'client',
    label: 'Client',
    align: 'left' as const,
    field: (row: ProjectDisplayInterface) => row.client?.name || '',
    sortable: true
  },
  {
    name: 'budget',
    label: 'Budget',
    align: 'right' as const,
    field: (row: ProjectDisplayInterface) => row.budget.raw,
    format: (val: number, row: ProjectDisplayInterface) => row.budget.formatted,
    sortable: true
  },
  {
    name: 'startDate',
    label: 'Start Date',
    align: 'left' as const,
    field: (row: ProjectDisplayInterface) => row.startDate.raw,
    format: (val: any, row: ProjectDisplayInterface) => row.startDate.formatted,
    sortable: true
  },
  {
    name: 'endDate',
    label: 'End Date',
    align: 'left' as const,
    field: (row: ProjectDisplayInterface) => row.endDate.raw,
    format: (val: any, row: ProjectDisplayInterface) => row.endDate.formatted,
    sortable: true
  },
  {
    name: 'status',
    label: 'Status',
    align: 'center' as const,
    field: (row: ProjectDisplayInterface) => row.status,
    sortable: true
  },
  {
    name: 'progress',
    label: 'Progress',
    align: 'center' as const,
    field: (row: ProjectDisplayInterface) => row.progressPercentage || 0,
    sortable: true
  },
  {
    name: 'actions',
    label: 'Actions',
    align: 'center' as const,
    field: () => '',
    sortable: false
  }
];

// Reactive state
const projectData = ref<ProjectDataResponse | undefined>(undefined);
const isProjectCreateDialogOpen = ref<boolean>(false);
const pagination = ref({
  rowsPerPage: 20,
  sortBy: 'name',
  descending: false
});

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
          perPage: 50
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
    cacheKey: () => ({ type: 'list' }),
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
    budget: item.budget || { formatted: '₱0.00', raw: 0 }, // Backend formats currency
    isDeleted: item.isDeleted || false,
    startDate: item.startDate || { formatted: 'No date', raw: null }, // Backend formats dates
    endDate: item.endDate || { formatted: 'No date', raw: null },
    status: item.status as ProjectStatus,
    projectBoardStage: item.projectBoardStage || 'planning',
    progressPercentage: item.progressPercentage || 0,
    client: item.client, // Backend includes full client object
    clientId: item.client?.id,
    locationId: item.location?.id
  }));
});

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

const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

const formatStatus = (status: string): string => {
  return status.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim();
};

const getStatusColor = (status: string): string => {
  const statusMap: Record<string, string> = {
    'planning': 'purple',
    'DRAFT': 'purple',
    'in_progress': 'blue',
    'ACTIVE': 'blue',
    'PROJECT': 'blue',
    'on_hold': 'orange',
    'ON_HOLD': 'orange',
    'completed': 'green',
    'COMPLETED': 'green',
    'CANCELLED': 'red'
  };
  return statusMap[status] || 'grey';
};

const openProject = (id: number): void => {
  router.push({ name: 'member_project_page', params: { id } });
};

const editProject = (_project: ProjectDisplayInterface): void => {
  // Similar to grid view edit logic
  $q.notify({
    type: 'info',
    message: 'Edit functionality to be implemented',
    position: 'top',
    timeout: 2000
  });
};

const deleteProject = (project: ProjectDisplayInterface): void => {
  $q.dialog({
    title: 'Delete Project',
    message: `Are you sure you want to delete ${project.name}?`,
    cancel: true,
  }).onOk(async () => {
    // Delete logic to be implemented
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