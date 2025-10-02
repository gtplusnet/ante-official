<template>
  <div class="q-pa-sm nav-submenu">
    <!-- Dashboard -->
    <div
      class="nav-item row items-center"
      :class="activeNav === 'member_project_dashboard' ? 'active' : ''"
      @click="navigate('member_project_dashboard')"
    >
      <div class="row items-center">
        <div>
          <q-icon
            :name="getActiveIcon('o_dashboard', activeNav === 'member_project_dashboard')"
            size="22px"
            class="menu-icon q-mr-sm"
          />
        </div>
        <div class="text-label-large text-grey">Dashboard</div>
      </div>
    </div>

    <!-- Project List -->
    <div
      class="nav-item row items-center"
      :class="activeNav === 'member_project' ? 'active' : ''"
      @click="navigate('member_project')"
    >
      <div class="row items-center">
        <div>
          <q-icon
            :name="getActiveIcon('o_list_alt', activeNav === 'member_project')"
            size="22px"
            class="menu-icon q-mr-sm"
          />
        </div>
        <div class="text-label-large text-grey">Project List</div>
      </div>
    </div>

    <!-- Active Projects with refresh button -->
    <div
      class="nav-item row items-center justify-between"
      :class="activeProjectId ? 'active' : ''"
    >
      <div class="row items-center">
        <div>
          <q-icon
            :name="getActiveIcon('o_folder', activeProjectId ? true : false)"
            size="22px"
            class="menu-icon q-mr-sm"
          />
        </div>
        <div class="text-label-large text-grey">Active Projects</div>
      </div>
      <q-btn
        flat
        round
        dense
        size="sm"
        :loading="isManuallyRefreshing"
        @click.stop="refreshProjects"
      >
        <q-icon
          name="refresh"
          size="18px"
          :class="{ 'rotate-animation': isManuallyRefreshing }"
          style="color: var(--q-grey-icon)"
        />
        <q-tooltip>Refresh projects</q-tooltip>
      </q-btn>
    </div>

    <!-- Active Projects dropdown list -->
    <div v-if="openKey === 'activeProjects' && projects.length > 0" class="q-pb-sm">
      <div
        v-for="project in projects"
        :key="project.id"
        class="nav-item-dropdown row items-center"
        :class="activeProjectId === project.id ? 'active' : ''"
        @click.stop="navigateToProject(project.id)"
      >
        <div class="row items-center">
          <div>
            <q-icon
              :name="getActiveIcon('o_circle', activeProjectId === project.id)"
              size="20px"
              class="menu-icon q-mr-sm"
            />
          </div>
          <div class="text-label-medium text-grey">{{ truncateName(project.name) }}</div>
        </div>
      </div>
    </div>


    <!-- Client Management -->
    <div
      class="nav-item row items-center"
      :class="activeNav === 'member_project_client_management' ? 'active' : ''"
      @click="navigate('member_project_client_management')"
    >
      <div class="row items-center">
        <div>
          <q-icon
            :name="getActiveIcon('o_groups', activeNav === 'member_project_client_management')"
            size="22px"
            class="menu-icon q-mr-sm"
          />
        </div>
        <div class="text-label-large text-grey">Client Management</div>
      </div>
    </div>

    <!-- Media Library -->
    <div
      class="nav-item row items-center"
      :class="activeNav === 'member_project_media_library' ? 'active' : ''"
      @click="navigate('member_project_media_library')"
    >
      <div class="row items-center">
        <div>
          <q-icon
            :name="getActiveIcon('o_photo_library', activeNav === 'member_project_media_library')"
            size="22px"
            class="menu-icon q-mr-sm"
          />
        </div>
        <div class="text-label-large text-grey">Media Library</div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@import '../shared/submenu-common.scss';

// Rotation animation for refresh icon
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

// Style for refresh button
:deep(.q-btn--flat.q-btn--round) {
  min-height: 28px;
  min-width: 28px;
}
</style>

<script lang="ts">
import { ref, watch, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useQuasar } from 'quasar';
import supabaseService from '../../../services/supabase';
import { useCache } from '../../../composables/useCache';
import { projectCache, CacheTTL } from '../../../utils/cache/implementations';
import { useAuthStore } from '../../../stores/auth';
export default {
  name: 'ProjectSubMenu',
  emits: ['close-drawer'],

  setup(_props: Record<string, never>, { emit }) {
    const $router = useRouter();
    const $route = useRoute();
    const $q = useQuasar();

    const activeNav = ref<string | null>(
      $router.currentRoute.value.name?.toString() || null
    );

    const openKey = ref<string | null>('activeProjects'); // Always open by default

    // Compute active project ID from route params
    const activeProjectId = computed(() => {
      if ($route.name === 'member_project_page' && $route.params.id) {
        return parseInt($route.params.id as string);
      }
      return null;
    });

    watch(
      () => $router.currentRoute.value.name,
      (newName: string | symbol | undefined) => {
        activeNav.value = newName ? newName.toString() : null;
      }
    );

    const getActiveIcon = (icon: string, isActive: boolean) => {
      if (isActive && icon.startsWith('o_')) {
        return icon.substring(2);
      }
      return icon;
    };

    const toggleDropdown = (key: string) => {
      // Prevent closing Active Projects dropdown - it should always stay open
      if (key === 'activeProjects' && openKey.value === 'activeProjects') {
        return; // Do nothing, keep it open
      }

      openKey.value = openKey.value === key ? null : key;

      // Load projects when opening the dropdown for the first time
      if (openKey.value === 'activeProjects' && projects.value.length === 0) {
        loadProjects();
      }
    };

    const navigate = (key: string) => {
      try {
        $router.push({ name: key }).catch((error: unknown) => {
          console.warn('Navigation error:', error);
        });

        // Close drawer on mobile
        if ($q.platform.is.mobile) {
          emit('close-drawer');
        }
      } catch (error) {
        console.error('Router navigation failed:', error);
      }
    };

    const navigateToProject = (projectId: number) => {
      try {
        $router.push({ name: 'member_project_page', params: { id: projectId } }).catch((error: unknown) => {
          console.warn('Navigation error:', error);
        });

        // Close drawer on mobile
        if ($q.platform.is.mobile) {
          emit('close-drawer');
        }
      } catch (error) {
        console.error('Router navigation to project failed:', error);
      }
    };

    const truncateName = (name: string): string => {
      if (name.length > 25) {
        return name.substring(0, 25) + '...';
      }
      return name;
    };

    // Get auth store for company filtering
    const authStore = useAuthStore();
    const userCompanyId = authStore.accountInformation?.company?.id;

    // Use centralized cache for projects
    const {
      data: projectsData,
      load: loadProjects,
      refresh: refreshProjectsCache
    } = useCache(
      projectCache,
      async () => {
        try {
          // Build query with filters - matching ProjectGridView filters
          let query = supabaseService.getClient()
            .from('Project')
            .select('id, name, status')
            .eq('isDeleted', false)
            .eq('isLead', false)
            .eq('status', 'PROJECT')
            .order('name', { ascending: true })
            .limit(20);

          // Add company filter if user has a company
          if (userCompanyId) {
            query = query.eq('companyId', userCompanyId);
          }

          const { data, error } = await query;

          if (error) {
            console.error('Error fetching projects:', error);
            return { projects: [] };
          }

          return {
            projects: (data || []).map((project: any) => ({
              id: project.id,
              name: project.name
            }))
          };
        } catch (error) {
          console.error('Error in project fetch:', error);
          return { projects: [] };
        }
      },
      {
        cacheKey: 'activeProjects',
        ttl: CacheTTL.TASK_LIST, // 5 minutes
        invalidateEvents: ['project-created', 'project-updated', 'project-deleted'],
        autoFetch: false // Don't auto-refresh in background to prevent loading indicator
      }
    );

    // Computed property to extract projects from cache data
    const projects = computed(() => projectsData.value?.projects || []);

    // Track manual refresh state
    const isManuallyRefreshing = ref(false);

    // Refresh function for the button
    const refreshProjects = async () => {
      isManuallyRefreshing.value = true;
      await refreshProjectsCache();
      isManuallyRefreshing.value = false;
      $q.notify({
        type: 'positive',
        message: 'Projects refreshed',
        position: 'top',
        timeout: 1000
      });
    };

    // Always preload Active Projects on mount
    onMounted(() => {
      // Always open Active Projects dropdown and fetch the list
      openKey.value = 'activeProjects';
      loadProjects();
    });

    $router.afterEach((to) => {
      try {
        activeNav.value = to.name?.toString() || '';
      } catch (error) {
        console.error('Error updating activeNav:', error);
        activeNav.value = '';
      }
    });

    return {
      activeNav,
      activeProjectId,
      projects,
      isManuallyRefreshing,
      openKey,
      navigate,
      navigateToProject,
      getActiveIcon,
      toggleDropdown,
      truncateName,
      refreshProjects,
    };
  },
};
</script>