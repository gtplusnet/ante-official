import { ref, computed } from 'vue';
import supabaseService from '../../services/supabase';
import type { PostgrestError } from '@supabase/supabase-js';

export interface Schedule {
  id: number;
  scheduleCode: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  companyId: number | null;
}

export interface ScheduleOption {
  label: string;
  value: number;
}

export function useSupabaseSchedules() {
  const supabase = supabaseService.getClient();
  
  const schedules = ref<Schedule[]>([]);
  const loading = ref(false);
  const error = ref<PostgrestError | null>(null);
  
  // Convert schedules to dropdown options
  const scheduleOptions = computed<ScheduleOption[]>(() => {
    return schedules.value.map(schedule => ({
      label: schedule.scheduleCode,
      value: schedule.id
    }));
  });
  
  // Fetch all schedules
  const fetchSchedules = async () => {
    loading.value = true;
    error.value = null;
    
    try {
      const { data, error: fetchError } = await supabase
        .from('Schedule')
        .select('*')
        .eq('isDeleted', false)
        .order('scheduleCode', { ascending: true });
      
      if (fetchError) {
        console.error('Error fetching schedules:', fetchError);
        error.value = fetchError;
        return;
      }
      
      schedules.value = data || [];
    } catch (err) {
      console.error('Unexpected error fetching schedules:', err);
      error.value = {
        message: err instanceof Error ? err.message : 'An unexpected error occurred',
        details: null,
        hint: null,
        code: 'UNKNOWN'
      };
    } finally {
      loading.value = false;
    }
  };
  
  // Fetch schedules by company ID
  const fetchSchedulesByCompany = async (companyId: number) => {
    loading.value = true;
    error.value = null;
    
    try {
      const { data, error: fetchError } = await supabase
        .from('Schedule')
        .select('*')
        .eq('companyId', companyId)
        .eq('isDeleted', false)
        .order('scheduleCode', { ascending: true });
      
      if (fetchError) {
        console.error('Error fetching schedules by company:', fetchError);
        error.value = fetchError;
        return;
      }
      
      schedules.value = data || [];
    } catch (err) {
      console.error('Unexpected error fetching schedules:', err);
      error.value = {
        message: err instanceof Error ? err.message : 'An unexpected error occurred',
        details: null,
        hint: null,
        code: 'UNKNOWN'
      };
    } finally {
      loading.value = false;
    }
  };
  
  // Create a new schedule
  const createSchedule = async (scheduleData: Partial<Schedule>) => {
    loading.value = true;
    error.value = null;
    
    try {
      const { data, error: createError } = await supabase
        .from('Schedule')
        .insert([scheduleData])
        .select()
        .single();
      
      if (createError) {
        console.error('Error creating schedule:', createError);
        error.value = createError;
        return null;
      }
      
      // Add to local list
      if (data) {
        schedules.value.push(data);
      }
      
      return data;
    } catch (err) {
      console.error('Unexpected error creating schedule:', err);
      error.value = {
        message: err instanceof Error ? err.message : 'An unexpected error occurred',
        details: null,
        hint: null,
        code: 'UNKNOWN'
      };
      return null;
    } finally {
      loading.value = false;
    }
  };
  
  // Update a schedule
  const updateSchedule = async (id: number, updates: Partial<Schedule>) => {
    loading.value = true;
    error.value = null;
    
    try {
      const { data, error: updateError } = await supabase
        .from('Schedule')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (updateError) {
        console.error('Error updating schedule:', updateError);
        error.value = updateError;
        return null;
      }
      
      // Update local list
      if (data) {
        const index = schedules.value.findIndex(s => s.id === id);
        if (index !== -1) {
          schedules.value[index] = data;
        }
      }
      
      return data;
    } catch (err) {
      console.error('Unexpected error updating schedule:', err);
      error.value = {
        message: err instanceof Error ? err.message : 'An unexpected error occurred',
        details: null,
        hint: null,
        code: 'UNKNOWN'
      };
      return null;
    } finally {
      loading.value = false;
    }
  };
  
  // Delete (soft delete) a schedule
  const deleteSchedule = async (id: number) => {
    return updateSchedule(id, { isDeleted: true });
  };
  
  return {
    schedules,
    scheduleOptions,
    loading,
    error,
    fetchSchedules,
    fetchSchedulesByCompany,
    createSchedule,
    updateSchedule,
    deleteSchedule
  };
}