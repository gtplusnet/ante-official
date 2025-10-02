<template>
  <expanded-nav-page-container variant="transparent">
    <div class="project-dashboard-wrapper">
      <div class="page-content">
      <!-- Overview Cards -->
      <div class="dashboard-card-container">
        <GlobalWidgetCounter
          icon="folder"
          icon-color="var(--q-primary)"
          :value="stats.total.toString()"
          label="Total Projects"
          card-class="dashboard-card-1"
          :loading="loading"
          :clickable="true"
          @click="viewAllProjects"
        />
        <GlobalWidgetCounter
          icon="trending_up"
          icon-color="var(--q-positive)"
          :value="stats.active.toString()"
          label="Active Projects"
          card-class="dashboard-card-2"
          :loading="loading"
          :clickable="true"
          @click="filterByStatus('active')"
        />
        <GlobalWidgetCounter
          icon="check_circle"
          icon-color="var(--q-grey-7)"
          :value="stats.completed.toString()"
          label="Completed"
          card-class="dashboard-card-3"
          :loading="loading"
          :clickable="true"
          @click="filterByStatus('completed')"
        />
        <GlobalWidgetCounter
          icon="schedule"
          icon-color="#ff9800"
          :value="stats.pending.toString()"
          label="Pending"
          card-class="pending-card"
          :loading="loading"
          :clickable="true"
          @click="filterByStatus('pending')"
        />
      </div>

      <!-- Recent Projects -->
      <q-card class="q-mb-lg">
        <q-card-section>
          <div class="text-title-medium q-mb-md">Recent Projects</div>
          <q-table
            :rows="recentProjects"
            :columns="columns"
            row-key="id"
            flat
            :pagination="{ rowsPerPage: 5 }"
          >
            <template v-slot:body-cell-name="props">
              <q-td :props="props">
                <router-link
                  :to="{ name: 'member_project_page', params: { id: props.row.id } }"
                  class="project-link"
                >
                  {{ props.value }}
                </router-link>
              </q-td>
            </template>
            <template v-slot:body-cell-status="props">
              <q-td :props="props">
                <q-badge :color="getStatusColor(props.value)">
                  {{ props.value }}
                </q-badge>
              </q-td>
            </template>
            <template v-slot:body-cell-actions="props">
              <q-td :props="props">
                <q-btn
                  flat
                  round
                  dense
                  icon="visibility"
                  @click="viewProject(props.row.id)"
                >
                  <q-tooltip>View Project</q-tooltip>
                </q-btn>
              </q-td>
            </template>
          </q-table>
        </q-card-section>
      </q-card>

      <!-- Quick Actions -->
      <q-card>
        <q-card-section>
          <div class="text-title-medium q-mb-md">Quick Actions</div>
          <div class="row q-col-gutter-md">
            <div class="col-12 col-sm-6 col-md-3">
              <q-btn
                flat
                color="primary"
                icon="add"
                label="New Project"
                no-caps
                class="full-width md3-button-primary"
                @click="createProject"
              />
            </div>
            <div class="col-12 col-sm-6 col-md-3">
              <q-btn
                flat
                outline
                color="primary"
                icon="list_alt"
                label="View All Projects"
                no-caps
                class="full-width md3-button-outlined"
                @click="viewAllProjects"
              />
            </div>
            <div class="col-12 col-sm-6 col-md-3">
              <q-btn
                flat
                outline
                color="primary"
                icon="groups"
                label="Manage Clients"
                no-caps
                class="full-width md3-button-outlined"
                @click="manageClients"
              />
            </div>
            <div class="col-12 col-sm-6 col-md-3">
              <q-btn
                flat
                outline
                color="primary"
                icon="photo_library"
                label="Media Library"
                no-caps
                class="full-width md3-button-outlined"
                @click="openMediaLibrary"
              />
            </div>
          </div>
        </q-card-section>
      </q-card>
    </div>
    </div>
  </expanded-nav-page-container>
</template>

<script lang="ts">
import { defineComponent, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import ExpandedNavPageContainer from '../../../components/shared/ExpandedNavPageContainer.vue';
import GlobalWidgetCounter from '../../../components/shared/global/GlobalWidgetCounter.vue';
import supabaseService from '../../../services/supabase';
import { useCache } from '../../../composables/useCache';
import { projectCache, CacheTTL, ProjectCacheData } from '../../../utils/cache/implementations';

export default defineComponent({
  name: 'ProjectDashboard',
  components: {
    ExpandedNavPageContainer,
    GlobalWidgetCounter,
  },
  setup() {
    const router = useRouter();
    const $q = useQuasar();

    // Define custom interface for dashboard data
    interface DashboardData extends ProjectCacheData {
      stats?: {
        total: number;
        active: number;
        completed: number;
        pending: number;
      };
      recentProjects?: any[];
    }

    // Cache implementation for dashboard data
    const {
      data: cachedDashboardData,
      isCached,
      isRefreshing,
      lastUpdated,
      load: loadDashboard,
      refresh: refreshDashboard
    } = useCache<DashboardData>(
      projectCache as any,
      async (): Promise<DashboardData> => {
        // Fetch projects directly from Supabase
        const { data: projects, error } = await supabaseService.getClient()
          .from('Project')
          .select(`
            id,
            name,
            status,
            projectBoardStage,
            budget,
            startDate,
            endDate,
            isDeleted,
            isLead,
            createdAt,
            Client (
              id,
              name,
              email
            )
          `)
          .eq('isDeleted', false)
          .eq('isLead', false)
          .eq('status', 'PROJECT')
          .order('createdAt', { ascending: false });

        if (error) {
          console.error('Error fetching projects:', error);
          throw new Error('Failed to fetch dashboard data');
        }

        const projectList = projects || [];

        // Calculate statistics
        const stats = {
          total: projectList.length,
          active: projectList.filter((p: any) =>
            ['active', 'in_progress', 'ACTIVE', 'IN_PROGRESS', 'ONGOING'].includes(p.projectBoardStage || p.status)
          ).length,
          completed: projectList.filter((p: any) =>
            ['completed', 'COMPLETED', 'done'].includes(p.projectBoardStage || p.status)
          ).length,
          pending: projectList.filter((p: any) =>
            ['pending', 'PENDING', 'planning'].includes(p.projectBoardStage || p.status)
          ).length,
        };

        // Format recent projects
        const recentProjects = projectList.slice(0, 5).map((project: any) => ({
          ...project,
          client: project.Client,
          endDate: project.endDate ? {
            dateFull: new Date(project.endDate).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            })
          } : null
        }));

        // Return as ProjectCacheData format
        return {
          projects: projectList as any[],
          stats,
          recentProjects,
          totalCount: projectList.length,
          currentPage: 1
        };
      },
      {
        cacheKey: () => ({ type: 'dashboard' }),
        ttl: CacheTTL.TASK_LIST, // 5 minutes
        invalidateEvents: ['project-created', 'project-updated', 'project-deleted']
      }
    );

    // Computed properties from cached data
    const loading = computed(() => isRefreshing.value && !isCached.value);
    const stats = computed(() => cachedDashboardData.value?.stats || {
      total: 0,
      active: 0,
      completed: 0,
      pending: 0,
    });
    const recentProjects = computed(() => cachedDashboardData.value?.recentProjects || []);

    const columns = [
      {
        name: 'name',
        required: true,
        label: 'Project Name',
        align: 'left',
        field: 'name',
        sortable: true,
      },
      {
        name: 'client',
        label: 'Client',
        align: 'left',
        field: (row: any) => row.client?.name || 'No Client',
        sortable: true,
      },
      {
        name: 'status',
        label: 'Status',
        align: 'center',
        field: 'status',
        sortable: true,
      },
      {
        name: 'endDate',
        label: 'End Date',
        align: 'center',
        field: (row: any) => row.endDate?.dateFull || 'N/A',
        sortable: true,
      },
      {
        name: 'actions',
        label: 'Actions',
        align: 'center',
        field: 'actions',
      },
    ];

    const getStatusColor = (status: string) => {
      const colors: Record<string, string> = {
        'ACTIVE': 'green',
        'IN_PROGRESS': 'blue',
        'ONGOING': 'teal',
        'COMPLETED': 'grey',
        'PENDING': 'orange',
        'ON_HOLD': 'warning',
      };
      return colors[status] || 'grey';
    };

    // Manual refresh function
    const handleRefresh = async () => {
      await refreshDashboard();
      $q.notify({
        type: 'positive',
        message: 'Dashboard refreshed',
        position: 'top',
        timeout: 1000
      });
    };

    // Helper function for relative time display
    const getRelativeTime = (date: Date): string => {
      const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
      if (seconds < 60) return 'just now';
      const minutes = Math.floor(seconds / 60);
      if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
      return `${Math.floor(hours / 24)} day${Math.floor(hours / 24) > 1 ? 's' : ''} ago`;
    };

    const filterByStatus = (status: string) => {
      // Navigate to project list with status filter
      router.push({
        name: 'member_project',
        query: { status }
      });
    };

    const viewProject = (id: number) => {
      router.push({ name: 'member_project_page', params: { id } });
    };

    const createProject = () => {
      // This would open a project creation dialog
      $q.notify({
        message: 'Project creation dialog would open',
        color: 'info',
      });
    };

    const viewAllProjects = () => {
      router.push({ name: 'member_project' });
    };

    const manageClients = () => {
      router.push({ name: 'member_project_client_management' });
    };

    const openMediaLibrary = () => {
      router.push({ name: 'member_project_media_library' });
    };

    onMounted(() => {
      // Load dashboard data with cache check
      loadDashboard();
    });

    return {
      loading,
      stats,
      recentProjects,
      columns,
      getStatusColor,
      viewProject,
      createProject,
      viewAllProjects,
      manageClients,
      openMediaLibrary,
      filterByStatus,
      handleRefresh,
      getRelativeTime,
      isCached,
      isRefreshing,
      lastUpdated,
    };
  },
});
</script>

<style lang="scss" scoped>
.project-dashboard-wrapper {
  width: 100%;
}

.page-head {
  margin-bottom: 8px;
}

.page-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.dashboard-card-container {
  display: flex;
  flex-wrap: wrap;
  gap: 25px;
  margin-bottom: 5px;

  @media (max-width: 1200px) {
    gap: 20px;
    margin-bottom: 20px;
  }

  @media (max-width: 768px) {
    gap: 16px;
    margin-bottom: 16px;
  }
}

.pending-card {
  background-image: url('../../../assets/img/card1.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-color: #FFF3E0;
}

.project-link {
  color: #1976d2;
  text-decoration: none;
  font-weight: 500;

  &:hover {
    text-decoration: underline;
  }
}

.full-width {
  width: 100%;
}

// MD3 Button Styles - Flat Design
.md3-button-primary {
  background-color: var(--q-primary);
  color: white;
  border-radius: 8px;
  font-weight: 500;
  transition: background-color 0.2s;

  &:hover {
    background-color: var(--q-primary);
    filter: brightness(0.9);
  }
}

.md3-button-outlined {
  border: 1px solid var(--q-primary);
  background-color: transparent;
  border-radius: 8px;
  font-weight: 500;
  transition: background-color 0.2s;

  &:hover {
    background-color: rgba(25, 118, 210, 0.08);
  }
}

// Ensure q-cards have proper background
:deep(.q-card) {
  background-color: #fff;
  border: 1px solid #eee;
}
</style>