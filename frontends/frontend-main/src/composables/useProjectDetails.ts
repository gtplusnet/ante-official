import { ref, Ref } from 'vue';
import supabaseService from '../services/supabase';
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
      const { data, error: supabaseError } = await supabaseService.getClient()
        .from('Project')
        .select(`
          *,
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
            zipCode
          ),
          Company (
            id,
            companyName
          )
        `)
        .eq('id', projectId)
        .eq('isDeleted', false)
        .single();

      if (supabaseError) {
        throw supabaseError;
      }

      // Format the data to match expected structure
      // Map uppercase relation names to lowercase for backward compatibility
      projectData.value = {
        ...data,
        client: data.Client,
        location: data.Location,
        company: data.Company
      } as ProjectDataResponse;
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