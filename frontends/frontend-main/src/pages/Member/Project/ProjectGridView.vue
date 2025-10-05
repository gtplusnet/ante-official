<template>
  <div>
    <!-- Header with legend and refresh button -->
    <div class="q-mb-md">

      <!-- Refresh button with cache indicator -->
      <div class="row items-center justify-end">
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
    </div>

    <template v-if="!isLoading || (isCached && projectList.length > 0)">
      <div class="grid-view">
        <template v-for="project in projectList" :key="project.id">

          <q-card class="grid-box" @click="openProject(project.id)">
            <q-card-section class="grid-box-content">
              <!-- Header with title and actions -->
              <div class="grid-box-header">
                <div class="grid-box-title-section">
                  <div class="grid-box-title text-title-medium">{{ project.name }}</div>
                  <div class="grid-box-subtitle text-caption text-grey-7" v-if="project.code">
                    Code: {{ project.code }}
                  </div>
                </div>
                <div class="grid-box-actions">
                  <q-btn
                    flat
                    round
                    dense
                    size="sm"
                    icon="more_vert"
                    @click.stop
                  >
                    <q-menu anchor="bottom right" self="top right" auto-close>
                      <q-list dense style="min-width: 150px">
                        <q-item clickable @click="editProject(project)">
                          <q-item-section avatar>
                            <q-icon name="edit" size="18px" color="primary" />
                          </q-item-section>
                          <q-item-section>Edit</q-item-section>
                        </q-item>
                        <q-separator />
                        <q-item clickable @click="deleteProject(project)">
                          <q-item-section avatar>
                            <q-icon name="delete" size="18px" color="negative" />
                          </q-item-section>
                          <q-item-section>Delete</q-item-section>
                        </q-item>
                      </q-list>
                    </q-menu>
                  </q-btn>
                </div>
              </div>

              <!-- Board Stage Badge with subtle colors -->
              <div class="grid-box-badges">
                <q-chip
                  dense
                  square
                  class="board-stage-chip"
                  :style="{
                    backgroundColor: BOARD_STAGE_COLORS[project.projectBoardStage || 'planning']?.bg || '#F8F8F8',
                    color: BOARD_STAGE_COLORS[project.projectBoardStage || 'planning']?.text || '#616161',
                    borderColor: BOARD_STAGE_COLORS[project.projectBoardStage || 'planning']?.border || '#E0E0E0'
                  }"
                >
                  <q-icon
                    :name="getProjectBoardColumn(project.projectBoardStage || 'planning')?.icon"
                    size="16px"
                    class="q-mr-xs"
                  />
                  {{ getBoardStage(project.projectBoardStage || 'planning')?.boardName || 'Planning' }}
                </q-chip>

                <!-- Progress indicator if available -->
                <div class="progress-indicator" v-if="project.progressPercentage">
                  <q-circular-progress
                    :value="project.progressPercentage || 0"
                    size="32px"
                    :thickness="0.2"
                    color="blue-grey-6"
                    track-color="grey-3"
                    class="q-mr-xs"
                  />
                  <span class="text-caption text-weight-medium">{{ project.progressPercentage }}%</span>
                </div>
              </div>

              <!-- Description -->
              <div class="grid-box-body" v-if="project.description">
                <p class="grid-box-description text-body-small">
                  {{ project.description || 'No description available' }}
                </p>
              </div>

              <!-- Key Metrics -->
              <div class="grid-box-metrics">
                <div class="metric-item">
                  <q-icon name="account_circle" size="18px" color="grey-7" />
                  <span class="metric-label">{{ project.client?.name || 'No Client' }}</span>
                </div>
                <div class="metric-item">
                  <q-icon name="payments" size="18px" color="grey-7" />
                  <span class="metric-value">{{ project.budget.formatted }}</span>
                </div>
              </div>

              <!-- Timeline Bar -->
              <div class="grid-box-timeline">
                <div class="timeline-dates">
                  <div class="timeline-start">
                    <q-icon name="calendar_today" size="14px" />
                    <span class="text-caption">{{ project.startDate.formatted }}</span>
                  </div>
                  <q-icon name="arrow_forward" size="16px" color="grey-5" />
                  <div class="timeline-end">
                    <q-icon name="event" size="14px" />
                    <span class="text-caption text-weight-medium">{{ project.endDate.formatted }}</span>
                  </div>
                </div>
                <q-linear-progress
                  :value="getProjectProgress(project)"
                  color="blue-grey-5"
                  track-color="grey-3"
                  style="height: 4px; border-radius: 2px"
                  class="q-mt-xs"
                />
              </div>
            </q-card-section>
          </q-card>
        </template>
      </div>

      <template v-if="!projectList.length">
        <div class="no-projects-container">
          <div class="no-projects-text">No Project Yet</div>
        </div>
      </template>
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
    >
    </ProjectCreateDialog>
  </div>
</template>

<style scoped src="./Project.scss">
/* Add rotation animation for refresh icon */
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
import { ref, onMounted, computed, defineAsyncComponent } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import supabaseService from '../../../services/supabase';
import { useCache } from '../../../composables/useCache';
import { projectCache, CacheTTL } from '../../../utils/cache/implementations';
import GlobalLoader from "../../../components/shared/common/GlobalLoader.vue";
import {
  getProjectBoardColumn,
  getBoardStage,
  BOARD_STAGE_COLORS
} from '../../../reference/board-stages.reference';

// Lazy-loaded dialogs (ALL dialogs must be lazy loaded - CLAUDE.md)
const ProjectCreateDialog = defineAsyncComponent(() =>
  import("../../../components/dialog/ProjectCreateDialog.vue")
);

// Component definition
defineOptions({
  name: 'ProjectGridView'
});

// Import enums from the frontend interface file
import type {  ProjectStatus  } from "@shared/response";

// Import the shared interfaces from the backend
import { ProjectDataResponse } from "@shared/response";
import { ClientDataResponse } from '@shared/response/client.response';

// Setup router and quasar utilities
const router = useRouter();
const $q = useQuasar();

// Type definition for our internal use that includes partial fields
type ProjectDisplayInterface = {
  id: number;
  name: string;
  description: string;
  budget: { formatted: string; raw: number };
  isDeleted: boolean;
  startDate: { formatted: string; raw: string | Date };
  endDate: { formatted: string; raw: string | Date };
  status: ProjectStatus;
  projectBoardStage?: string; // Board stage for kanban view
  progressPercentage?: number; // Progress percentage
  code?: string; // Project code
  client?: ClientDataResponse;
  clientId?: number; // Added for form submission
  locationId?: number; // Added for form submission
};

// Reactive state
const currentPage = ref<number>(1);
// Define project data reference using the correct type to match ProjectCreateDialog props
const projectData = ref<ProjectDataResponse | undefined>(undefined);
const isProjectCreateDialogOpen = ref<boolean>(false);

// Use centralized cache for project grid with Supabase
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
      // Fetch projects directly from Supabase with relationships including board stage
      const { data: projects, error } = await supabaseService.getClient()
        .from('Project')
        .select(`
          *,
          projectBoardStage,
          Client (
            id,
            name,
            email,
            contactNumber
          ),
          Location (
            id,
            name,
            street,
            zipCode,
            landmark,
            description,
            contactNumber,
            contactPerson
          ),
          Company (
            id,
            companyName,
            domainPrefix,
            businessType,
            email,
            phone,
            tinNo,
            website,
            address,
            isActive
          )
        `)
        .eq('isDeleted', false)
        .eq('isLead', false)
        .eq('status', 'PROJECT')
        .order('createdAt', { ascending: false });

      if (error) {
        console.error('Error fetching projects:', error);
        $q.notify({
          type: 'negative',
          message: 'Failed to load projects',
          position: 'top',
          timeout: 3000
        });
        return { projects: [], currentPage: 1, pagination: [] };
      }

      return {
        projects: projects || [],
        currentPage: 1,
        pagination: []
      };
    } catch (err) {
      console.error('Unexpected error fetching projects:', err);
      return { projects: [], currentPage: 1, pagination: [] };
    }
  },
  {
    cacheKey: () => ({ type: 'grid', page: currentPage.value }),
    ttl: CacheTTL.TASK_LIST, // 5 minutes
    invalidateEvents: ['project-created', 'project-updated', 'project-deleted']
  }
);

// Computed properties
const isLoading = computed(() => isRefreshing.value && !isCached.value);
const projectList = computed<ProjectDisplayInterface[]>(() => {
  if (!cachedProjectData.value?.projects) return [];

  // Convert Supabase response format to our display interface format
  return cachedProjectData.value.projects.map((item: any) => {
    // Format currency
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP'
      }).format(amount || 0);
    };

    // Format date
    const formatDate = (dateString: string | Date) => {
      if (!dateString) return 'No date';
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    };

    return {
      id: item.id,
      name: item.name || 'Unnamed Project',
      description: item.description || '',
      budget: {
        formatted: formatCurrency(item.budget),
        raw: item.budget || 0
      },
      isDeleted: item.isDeleted || false,
      startDate: {
        formatted: formatDate(item.startDate),
        raw: item.startDate
      },
      endDate: {
        formatted: formatDate(item.endDate),
        raw: item.endDate
      },
      status: (item.status || 'planning') as ProjectStatus,
      projectBoardStage: item.projectBoardStage || 'planning',
      progressPercentage: item.progressPercentage || 0,
      code: item.code || '',
      client: item.Client ? {
        id: item.Client.id,
        name: item.Client.name,
        email: item.Client.email,
        contactNumber: item.Client.contactNumber,
        companyName: '', // Client table doesn't have companyName field
        totalCollection: 0,
        totalPaid: 0,
        totalBalance: 0,
        hasInvoice: false
      } : undefined,
      clientId: item.clientId,
      locationId: item.locationId
    };
  });
});

// Methods
const refreshProjects = async (): Promise<void> => {
  await refreshProjectsCache();
  $q.notify({
    type: 'positive',
    message: 'Projects refreshed',
    position: 'top',
    timeout: 1000
  });
};

// Helper function for relative time
const getRelativeTime = (date: Date): string => {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  return `${Math.floor(hours / 24)} day${Math.floor(hours / 24) > 1 ? 's' : ''} ago`;
};

// Calculate project progress based on timeline
const getProjectProgress = (project: ProjectDisplayInterface): number => {
  if (project.progressPercentage) {
    return project.progressPercentage / 100;
  }

  // Calculate based on timeline if no explicit progress
  const start = new Date(project.startDate.raw);
  const end = new Date(project.endDate.raw);
  const now = new Date();

  if (now < start) return 0;
  if (now > end) return 1;

  const total = end.getTime() - start.getTime();
  const elapsed = now.getTime() - start.getTime();

  return Math.min(Math.max(elapsed / total, 0), 1);
};

// Refresh data when dialog closes
const fetchData = async (): Promise<void> => {
  await loadProjects();
};

// Socket event handler - commented out but kept for future use
// const watchSocketEvent = (): void => {
//   if (socketStore.socket) {
//     socketStore.socket.on('newProject', () => {
//       fetchData();
//     });
//   } else {
//     setTimeout(() => {
//       watchSocketEvent();
//     }, 1000);
//   }
// };

const openProject = (id: number): void => {
  router.push({ name: 'member_project_page', params: { id } });
};

const editProject = (project: ProjectDisplayInterface): void => {
  // Convert from our display interface to the expected backend format
  // This is a temporary conversion for type compatibility until the whole app is refactored

  // Need to add type assertion to avoid TypeScript errors
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const convertedProject = {
    id: project.id,
    name: project.name,
    description: project.description,
    budget: {
      formatCurrency: project.budget.formatted,
      formatName: project.budget.formatted, // Use formatted as a fallback
      formatNumber: project.budget.formatted, // Use formatted as a fallback
      raw: project.budget.raw
    },
    isDeleted: project.isDeleted,
    startDate: {
      dateTime: project.startDate.formatted,
      time: project.startDate.formatted,
      time24: project.startDate.formatted,
      date: project.startDate.formatted,
      dateStandard: project.startDate.formatted,
      dateFull: project.startDate.formatted,
      // Format the date string in ISO format for the form to properly populate
      raw: typeof project.startDate.raw === 'string'
           ? project.startDate.raw
           : project.startDate.raw.toISOString().slice(0, 10)
    },
    endDate: {
      dateTime: project.endDate.formatted,
      time: project.endDate.formatted,
      time24: project.endDate.formatted,
      date: project.endDate.formatted,
      dateStandard: project.endDate.formatted,
      dateFull: project.endDate.formatted,
      // Format the date string in ISO format for the form to properly populate
      raw: typeof project.endDate.raw === 'string'
           ? project.endDate.raw
           : project.endDate.raw.toISOString().slice(0, 10)
    },
    // Convert ProjectStatus enum to string
    status: String(project.status),
    // Ensure client has all required fields or create a default client object
    client: project.client || {
      id: 0,
      name: '',
      email: '',
      contactNumber: '',
      companyName: '',
      totalCollection: 0,
      totalPaid: 0,
      totalBalance: 0,
      hasInvoice: false
    },
    // Extract client ID from client object if available
    clientId: project.clientId || project.client?.id || 0,
    // Extract location ID from location object if available
    locationId: project.locationId || 0,
    isLead: false,
    // Add required properties for location
    location: {
      id: 0,
      name: '',
      region: '',
      province: '',
      city: '',
      barangay: '',
      street: '',
      building: '',
      zipCode: '',
      isActive: true
    },
    // Add required properties for company
    company: {
      id: 0,
      companyName: '',
      domainPrefix: '',
      businessType: '',
      email: '',
      contactNumber: '', // Keep for compatibility with dialog
      ownerName: '', // Keep for compatibility with dialog
      tin: '', // Keep for compatibility with dialog
      website: '',
      address: '',
      isActive: true
    },
    downpaymentAmount: { formatCurrency: '0', formatName: '0', formatNumber: '0', raw: 0 },
    retentionAmount: { formatCurrency: '0', formatName: '0', formatNumber: '0', raw: 0 },
    totalCollection: { formatCurrency: '0', formatName: '0', formatNumber: '0', raw: 0 },
    totalCollectionBalance: { formatCurrency: '0', formatName: '0', formatNumber: '0', raw: 0 },
    totalCollected: { formatCurrency: '0', formatName: '0', formatNumber: '0', raw: 0 },
    progressPercentage: 0,
    isProjectStarted: false,
    // Add missing required properties from ProjectDataResponse
    latestBoq: undefined,
    computedDate: ''
  } as unknown as ProjectDataResponse; // Type assertion through unknown to avoid type checking

  projectData.value = convertedProject;
  isProjectCreateDialogOpen.value = true;
};

const deleteProject = (project: ProjectDisplayInterface): void => {
  $q.dialog({
    title: 'Delete Project',
    message: `Are you sure you want to delete ${project.name}?`,
    cancel: true,
  }).onOk(async () => {
    // Comment preserved from original code
    // try {
    //   await api.delete(`project?id=${project.id}`);
    //   $q.notify({
    //     color: 'positive',
    //     message: 'Project deleted successfully',
    //   });
    //   fetchData();
    // } catch (error) {
    //   handleAxiosError($q, error);
    // }
  });
};

// Lifecycle hooks
onMounted(() => {
  try {
    loadProjects(); // Use load() for initial load to check cache first
    // Uncomment to enable socket watching
    // watchSocketEvent();
  } catch (error) {
    console.warn('Error during component initialization:', error);
  }
});
</script>
