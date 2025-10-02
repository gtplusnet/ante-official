import { computed } from 'vue';
import { useSupabaseTable } from './supabase/useSupabaseTable';
import { useAuthStore } from 'src/stores/auth';

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

export function useProjectList() {
  // Get the current user's company ID from auth store
  const authStore = useAuthStore();
  const userCompanyId = authStore.accountInformation?.company?.id;
  
  // Build filters array
  const filters: any[] = [
    { column: 'isDeleted', operator: 'eq', value: false },
    { column: 'status', operator: 'eq', value: 'PROJECT' },
    { column: 'isLead', operator: 'eq', value: false }
  ];
  
  // Add company filter if user has a company
  // This ensures users only see projects from their own company
  if (userCompanyId) {
    filters.push({ column: 'companyId', operator: 'eq', value: userCompanyId });
  }
  
  // Use Supabase to fetch projects
  const {
    data: projects,
    loading,
    error,
    refetch
  } = useSupabaseTable({
    table: 'Project',
    select: 'id, name, description, status, isDeleted, isLead, budget, startDate, endDate, progressPercentage, companyId',
    filters,
    orderBy: { column: 'name', ascending: true },
    pageSize: 100,
    autoFetch: true
  });

  // Generate color based on project name (consistent colors)
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

  // Format projects for dropdown display
  const formattedProjects = computed(() => {
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

  // Add a "No project" option
  const projectsWithNone = computed(() => {
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

  return {
    projects: formattedProjects,
    projectsWithNone,
    loading,
    error,
    refetch,
    getProjectColor
  };
}