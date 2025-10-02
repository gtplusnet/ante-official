import { ref } from 'vue';
import { api } from 'src/boot/axios';
import { useQuasar } from 'quasar';
import { AxiosError } from 'axios';
import { handleAxiosError } from '../../../../../utility/axios.error.handler';
import type { FilingsResponse } from '../types/filing.types';

export const useFilings = () => {
  const q = useQuasar();
  const isLoading = ref(false);

  const fetchFilings = async (status: string, page: number, limit: number): Promise<FilingsResponse> => {
    isLoading.value = true;
    try {
      const response = await api.get<FilingsResponse>('hr-filing/filings', {
        params: { 
          status: status.toUpperCase(), 
          page, 
          limit 
        }
      });
      return response.data;
    } catch (error) {
      handleAxiosError(q, error as AxiosError);
      return { data: [], total: 0, page, limit };
    } finally {
      isLoading.value = false;
    }
  };

  return { 
    fetchFilings, 
    isLoading 
  };
};