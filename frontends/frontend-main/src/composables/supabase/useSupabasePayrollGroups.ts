import { ref, computed } from 'vue';
import supabaseService from '../../services/supabase';
import type { PostgrestError } from '@supabase/supabase-js';

export interface PayrollGroup {
  id: number;
  payrollGroupCode: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  companyId: number | null;
}

export interface PayrollGroupOption {
  label: string;
  value: number;
}

export function useSupabasePayrollGroups() {
  const supabase = supabaseService.getClient();
  
  const payrollGroups = ref<PayrollGroup[]>([]);
  const loading = ref(false);
  const error = ref<PostgrestError | null>(null);
  
  // Convert payroll groups to dropdown options
  const payrollGroupOptions = computed<PayrollGroupOption[]>(() => {
    return payrollGroups.value.map(group => ({
      label: group.payrollGroupCode,
      value: group.id
    }));
  });
  
  // Fetch all payroll groups
  const fetchPayrollGroups = async () => {
    loading.value = true;
    error.value = null;
    
    try {
      const { data, error: fetchError } = await supabase
        .from('PayrollGroup')
        .select('*')
        .eq('isDeleted', false)
        .order('payrollGroupCode', { ascending: true });
      
      if (fetchError) {
        console.error('Error fetching payroll groups:', fetchError);
        error.value = fetchError;
        return;
      }
      
      payrollGroups.value = data || [];
    } catch (err) {
      console.error('Unexpected error fetching payroll groups:', err);
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
  
  // Fetch payroll groups by company ID
  const fetchPayrollGroupsByCompany = async (companyId: number) => {
    loading.value = true;
    error.value = null;
    
    try {
      const { data, error: fetchError } = await supabase
        .from('PayrollGroup')
        .select('*')
        .eq('companyId', companyId)
        .eq('isDeleted', false)
        .order('payrollGroupCode', { ascending: true });
      
      if (fetchError) {
        console.error('Error fetching payroll groups by company:', fetchError);
        error.value = fetchError;
        return;
      }
      
      payrollGroups.value = data || [];
    } catch (err) {
      console.error('Unexpected error fetching payroll groups:', err);
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
  
  // Create a new payroll group
  const createPayrollGroup = async (payrollGroupData: Partial<PayrollGroup>) => {
    loading.value = true;
    error.value = null;
    
    try {
      const { data, error: createError } = await supabase
        .from('PayrollGroup')
        .insert([payrollGroupData])
        .select()
        .single();
      
      if (createError) {
        console.error('Error creating payroll group:', createError);
        error.value = createError;
        return null;
      }
      
      // Add to local list
      if (data) {
        payrollGroups.value.push(data);
      }
      
      return data;
    } catch (err) {
      console.error('Unexpected error creating payroll group:', err);
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
  
  // Update a payroll group
  const updatePayrollGroup = async (id: number, updates: Partial<PayrollGroup>) => {
    loading.value = true;
    error.value = null;
    
    try {
      const { data, error: updateError } = await supabase
        .from('PayrollGroup')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (updateError) {
        console.error('Error updating payroll group:', updateError);
        error.value = updateError;
        return null;
      }
      
      // Update local list
      if (data) {
        const index = payrollGroups.value.findIndex(g => g.id === id);
        if (index !== -1) {
          payrollGroups.value[index] = data;
        }
      }
      
      return data;
    } catch (err) {
      console.error('Unexpected error updating payroll group:', err);
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
  
  // Delete (soft delete) a payroll group
  const deletePayrollGroup = async (id: number) => {
    return updatePayrollGroup(id, { isDeleted: true });
  };
  
  return {
    payrollGroups,
    payrollGroupOptions,
    loading,
    error,
    fetchPayrollGroups,
    fetchPayrollGroupsByCompany,
    createPayrollGroup,
    updatePayrollGroup,
    deletePayrollGroup
  };
}