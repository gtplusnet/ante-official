import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useAuthStore } from 'src/stores/auth';
import { api } from 'src/boot/axios';

export interface Project {
  id: number;
  name: string;
  description?: string;
  status: 'PROJECT' | 'LEAD' | 'BRANCH';
  isDeleted: boolean;
  isLead: boolean;
  budget?: number;
  startDate?: string;
  endDate?: string;
  clientId?: number;
  locationId?: string;
  personInChargeId?: string;
  progressPercentage?: number;
  createdAt?: string;
  updatedAt?: string;
  companyId?: number;
}

export interface FormattedProject {
  id: number | string;
  key: number | string;
  value: number | string;
  name: string;
  label: string;
  color: string;
  description?: string;
  status: 'PROJECT' | 'LEAD' | 'BRANCH';
  progressPercentage: number;
}

/**
 * Global Project Store
 *
 * Centralized state management for projects across the application.
 * Initialized once on app load (MainLayout.vue) to prevent multiple API calls.
 *
 * Usage:
 *   const projectStore = useProjectStore();
 *   const projects = projectStore.formattedProjects;
 *   await projectStore.fetchProjects(); // manual refresh
 */
export const useProjectStore = defineStore('project', () => {
  // Get auth store for company filtering
  const authStore = useAuthStore();

  // State
  const projects = ref<Project[]>([]);
  const loading = ref(false);
  const error = ref<Error | null>(null);
  const initialized = ref(false);

  /**
   * Generate consistent color based on project name
   */
  const getProjectColor = (projectName: string): string => {
    const colors = [
      '#FF6900', // Orange
      '#097BFF', // Blue
      '#00D084', // Green
      '#8ED1FC', // Light Blue
      '#FE9200', // Dark Orange
      '#E27D00', // Brown Orange
      '#9B59B6', // Purple
      '#E74C3C', // Red
      '#F39C12', // Yellow
      '#27AE60', // Green
      '#2980B9', // Dark Blue
      '#8E44AD'  // Dark Purple
    ];

    if (!projectName) return '#6d6e78'; // Default gray

    // Generate hash from project name for consistent color
    let hash = 0;
    for (let i = 0; i < projectName.length; i++) {
      hash = projectName.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  /**
   * Fetch projects from Backend API
   * Uses PUT /project endpoint with table filters
   */
  const fetchProjects = async () => {
    loading.value = true;
    error.value = null;

    try {
      const userCompanyId = authStore.accountInformation?.company?.id;

      console.log('[ProjectStore] Fetching projects with companyId:', userCompanyId);

      // Use backend API with table endpoint (PUT /project)
      const response = await api.put('/project', {
        // TableBodyDTO
        filters: [
          { field: 'isDeleted', operator: '=', value: false },
          { field: 'isLead', operator: '=', value: false },
          { field: 'status', operator: '=', value: 'PROJECT' }
        ],
        sorts: [{ field: 'name', order: 'asc' }]
      }, {
        params: {
          // TableQueryDTO
          page: 1,
          perPage: 100
        }
      });

      // Backend returns data with list property
      const projectList = response.data?.list || [];

      // Map backend response to Project interface
      projects.value = projectList.map((item: any) => ({
        id: item.id,
        name: item.name || 'Unnamed Project',
        description: item.description || '',
        status: item.status,
        isDeleted: item.isDeleted || false,
        isLead: item.isLead || false,
        budget: typeof item.budget === 'object' ? item.budget.raw : item.budget,
        startDate: typeof item.startDate === 'object' ? item.startDate.raw : item.startDate,
        endDate: typeof item.endDate === 'object' ? item.endDate.raw : item.endDate,
        progressPercentage: item.progressPercentage || 0,
        companyId: item.companyId,
        clientId: item.client?.id,
        locationId: item.location?.id,
        personInChargeId: item.personInCharge?.id,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
      }));

      initialized.value = true;

      console.log('[ProjectStore] Loaded', projects.value.length, 'projects from backend API');
    } catch (err) {
      console.error('[ProjectStore] Failed to fetch projects:', err);
      error.value = err as Error;
      projects.value = [];
    } finally {
      loading.value = false;
    }
  };

  /**
   * Formatted projects for dropdown/select display
   */
  const formattedProjects = computed<FormattedProject[]>(() => {
    if (!projects.value) return [];

    return projects.value.map((project: Project) => ({
      id: project.id,
      key: project.id,
      value: project.id,
      name: project.name,
      label: project.name,
      color: getProjectColor(project.name),
      description: project.description,
      status: project.status,
      progressPercentage: project.progressPercentage || 0
    }));
  });

  /**
   * Projects with "No project" option
   */
  const projectsWithNone = computed<FormattedProject[]>(() => {
    return [
      {
        id: 'none',
        key: 'none',
        value: 'none',
        name: 'No project',
        label: 'No project',
        color: '#6d6e78',
        description: '',
        status: 'PROJECT' as const,
        progressPercentage: 0
      },
      ...formattedProjects.value
    ];
  });

  /**
   * Get project by ID
   */
  const getProjectById = (id: number | string): FormattedProject | undefined => {
    return formattedProjects.value.find(p => p.id === id);
  };

  /**
   * Get project name by ID
   */
  const getProjectName = (id: number | string | null | undefined): string => {
    if (!id) return 'No project';
    if (id === 'none') return 'No project';

    const project = getProjectById(id);
    return project ? project.name : 'Unknown project';
  };

  /**
   * Clear all project data
   * Used when logging out or switching accounts
   */
  const clearData = () => {
    projects.value = [];
    initialized.value = false;
    error.value = null;
    console.log('[ProjectStore] Data cleared');
  };

  return {
    // State
    projects,
    loading,
    error,
    initialized,

    // Computed
    formattedProjects,
    projectsWithNone,

    // Actions
    fetchProjects,
    clearData,

    // Helpers
    getProjectColor,
    getProjectById,
    getProjectName
  };
});
