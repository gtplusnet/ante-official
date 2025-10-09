import { ref, Ref } from 'vue';
import { api } from '../boot/axios';
import { ProjectDataResponse } from '@shared/response';
import { Notify } from 'quasar';

export interface UseProjectDetailsReturn {
  projectData: Ref<ProjectDataResponse | null>;
  loading: Ref<boolean>;
  error: Ref<Error | null>;
  fetchProjectDetails: (projectId: string | number) => Promise<void>;
}

export function useProjectDetails(): UseProjectDetailsReturn {
  const projectData = ref<ProjectDataResponse | null>(null);
  const loading = ref(false);
  const error = ref<Error | null>(null);

  const fetchProjectDetails = async (projectId: string | number) => {
    loading.value = true;
    error.value = null;

    try {
      // Use backend API endpoint (standard responseHandler pattern)
      const response = await api.get(`/project?id=${projectId}`);

      // Backend returns data directly (not wrapped)
      projectData.value = response.data as ProjectDataResponse;
    } catch (err) {
      error.value = err as Error;
      console.error('Error fetching project details:', err);

      // Show error notification
      Notify.create({
        type: 'negative',
        message: 'Failed to load project information',
        position: 'top',
        timeout: 3000
      });
    } finally {
      loading.value = false;
    }
  };

  return {
    projectData,
    loading,
    error,
    fetchProjectDetails
  };
}