import { ref, computed } from 'vue';
import supabaseService from '../../services/supabase';
import type { PostgrestError } from '@supabase/supabase-js';

export interface ShiftTime {
  id: number;
  shiftId: number;
  startTime: string;
  endTime: string;
  isBreakTime: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Shift {
  id: number;
  shiftCode: string;
  breakHours: number;
  targetHours: number;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  companyId: number | null;
  shiftType: 'TIME_BOUND' | 'TASK_BOUND' | 'FLEXIBLE';
  filingId: number | null;
  shiftTimes?: ShiftTime[];
}

export interface ShiftOption {
  label: string;
  value: number;
  data?: Shift; // Include full shift data for complex displays
}

export function useSupabaseShifts() {
  const supabase = supabaseService.getClient();
  
  const shifts = ref<Shift[]>([]);
  const loading = ref(false);
  const error = ref<PostgrestError | null>(null);
  
  // Convert shifts to dropdown options
  const shiftOptions = computed<ShiftOption[]>(() => {
    return shifts.value.map(shift => ({
      label: shift.shiftCode,
      value: shift.id,
      data: shift
    }));
  });
  
  // Fetch all shifts with their shift times
  const fetchShifts = async () => {
    loading.value = true;
    error.value = null;
    
    try {
      const { data, error: fetchError } = await supabase
        .from('Shift')
        .select(`
          *,
          shiftTimes:ShiftTime(*)
        `)
        .eq('isDeleted', false)
        .order('shiftCode', { ascending: true });
      
      if (fetchError) {
        console.error('Error fetching shifts:', fetchError);
        error.value = fetchError;
        return;
      }
      
      // Transform the data to match our interface
      const transformedData = (data || []).map(shift => ({
        ...shift,
        shiftTimes: shift.shiftTimes || []
      }));
      
      shifts.value = transformedData;
    } catch (err) {
      console.error('Unexpected error fetching shifts:', err);
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
  
  // Fetch shifts by company ID
  const fetchShiftsByCompany = async (companyId: number) => {
    loading.value = true;
    error.value = null;
    
    try {
      const { data, error: fetchError } = await supabase
        .from('Shift')
        .select(`
          *,
          shiftTimes:ShiftTime(*)
        `)
        .eq('companyId', companyId)
        .eq('isDeleted', false)
        .order('shiftCode', { ascending: true });
      
      if (fetchError) {
        console.error('Error fetching shifts by company:', fetchError);
        error.value = fetchError;
        return;
      }
      
      // Transform the data to match our interface
      const transformedData = (data || []).map(shift => ({
        ...shift,
        shiftTimes: shift.shiftTimes || []
      }));
      
      shifts.value = transformedData;
    } catch (err) {
      console.error('Unexpected error fetching shifts:', err);
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
  
  // Fetch shift times for a specific shift
  const fetchShiftTimes = async (shiftId: number) => {
    try {
      const { data, error: fetchError } = await supabase
        .from('ShiftTime')
        .select('*')
        .eq('shiftId', shiftId)
        .order('startTime', { ascending: true });
      
      if (fetchError) {
        console.error('Error fetching shift times:', fetchError);
        return [];
      }
      
      return data || [];
    } catch (err) {
      console.error('Unexpected error fetching shift times:', err);
      return [];
    }
  };
  
  // Create a new shift with shift times
  const createShift = async (shiftData: Partial<Shift>, shiftTimes?: Partial<ShiftTime>[]) => {
    loading.value = true;
    error.value = null;
    
    try {
      // Create the shift first
      const { data: shiftResult, error: createError } = await supabase
        .from('Shift')
        .insert([shiftData])
        .select()
        .single();
      
      if (createError) {
        console.error('Error creating shift:', createError);
        error.value = createError;
        return null;
      }
      
      // If shift times are provided, create them
      if (shiftResult && shiftTimes && shiftTimes.length > 0) {
        const shiftTimesData = shiftTimes.map(time => ({
          ...time,
          shiftId: shiftResult.id
        }));
        
        const { error: timesError } = await supabase
          .from('ShiftTime')
          .insert(shiftTimesData);
        
        if (timesError) {
          console.error('Error creating shift times:', timesError);
          // Note: Shift was created but times failed
        }
      }
      
      // Fetch the complete shift with times
      if (shiftResult) {
        const completeShift = await fetchShiftById(shiftResult.id);
        if (completeShift) {
          shifts.value.push(completeShift);
          return completeShift;
        }
      }
      
      return shiftResult;
    } catch (err) {
      console.error('Unexpected error creating shift:', err);
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
  
  // Fetch a single shift by ID
  const fetchShiftById = async (id: number) => {
    try {
      const { data, error: fetchError } = await supabase
        .from('Shift')
        .select(`
          *,
          shiftTimes:ShiftTime(*)
        `)
        .eq('id', id)
        .single();
      
      if (fetchError) {
        console.error('Error fetching shift by ID:', fetchError);
        return null;
      }
      
      return {
        ...data,
        shiftTimes: data.shiftTimes || []
      };
    } catch (err) {
      console.error('Unexpected error fetching shift:', err);
      return null;
    }
  };
  
  // Update a shift
  const updateShift = async (id: number, updates: Partial<Shift>) => {
    loading.value = true;
    error.value = null;
    
    try {
      const { data, error: updateError } = await supabase
        .from('Shift')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (updateError) {
        console.error('Error updating shift:', updateError);
        error.value = updateError;
        return null;
      }
      
      // Update local list
      if (data) {
        const completeShift = await fetchShiftById(id);
        if (completeShift) {
          const index = shifts.value.findIndex(s => s.id === id);
          if (index !== -1) {
            shifts.value[index] = completeShift;
          }
        }
      }
      
      return data;
    } catch (err) {
      console.error('Unexpected error updating shift:', err);
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
  
  // Delete (soft delete) a shift
  const deleteShift = async (id: number) => {
    return updateShift(id, { isDeleted: true });
  };
  
  // Add a shift time to an existing shift
  const addShiftTime = async (shiftId: number, shiftTime: Partial<ShiftTime>) => {
    try {
      const { data, error: createError } = await supabase
        .from('ShiftTime')
        .insert([{ ...shiftTime, shiftId }])
        .select()
        .single();
      
      if (createError) {
        console.error('Error adding shift time:', createError);
        return null;
      }
      
      // Update local shift with new time
      const shiftIndex = shifts.value.findIndex(s => s.id === shiftId);
      if (shiftIndex !== -1 && data) {
        if (!shifts.value[shiftIndex].shiftTimes) {
          shifts.value[shiftIndex].shiftTimes = [];
        }
        shifts.value[shiftIndex].shiftTimes!.push(data);
      }
      
      return data;
    } catch (err) {
      console.error('Unexpected error adding shift time:', err);
      return null;
    }
  };
  
  // Remove a shift time
  const removeShiftTime = async (shiftTimeId: number) => {
    try {
      const { error: deleteError } = await supabase
        .from('ShiftTime')
        .delete()
        .eq('id', shiftTimeId);
      
      if (deleteError) {
        console.error('Error removing shift time:', deleteError);
        return false;
      }
      
      // Update local shifts
      shifts.value.forEach(shift => {
        if (shift.shiftTimes) {
          shift.shiftTimes = shift.shiftTimes.filter(t => t.id !== shiftTimeId);
        }
      });
      
      return true;
    } catch (err) {
      console.error('Unexpected error removing shift time:', err);
      return false;
    }
  };
  
  return {
    shifts,
    shiftOptions,
    loading,
    error,
    fetchShifts,
    fetchShiftsByCompany,
    fetchShiftTimes,
    fetchShiftById,
    createShift,
    updateShift,
    deleteShift,
    addShiftTime,
    removeShiftTime
  };
}