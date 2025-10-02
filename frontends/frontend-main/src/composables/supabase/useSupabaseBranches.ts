import { ref, computed } from 'vue';
import supabaseService from '../../services/supabase';
import { useAuthStore } from 'src/stores/auth';
import type { PostgrestError } from '@supabase/supabase-js';

export interface Branch {
  id: number;
  name: string;
  description: string;
  budget: number;
  startDate: string;
  endDate: string;
  status: 'PROJECT' | 'BRANCH' | 'LEAD';
  isDeleted: boolean;
  isLead: boolean;
  leadBoardStage: string;
  notificationRequirements: any;
  priorityLevel: number;
  completionPercentage: number;
  createdAt: string;
  updatedAt: string;
  companyId: number | null;
  createdBy: string | null;
  projectNotificationsEmail: string | null;
  clientId: number | null;
}

export interface BranchOption {
  label: string;
  value: number;
}

export function useSupabaseBranches() {
  const supabase = supabaseService.getClient();
  const authStore = useAuthStore();
  
  const branches = ref<Branch[]>([]);
  const loading = ref(false);
  const error = ref<PostgrestError | null>(null);
  
  // Convert branches to dropdown options
  const branchOptions = computed<BranchOption[]>(() => {
    return branches.value.map(branch => ({
      label: branch.name,
      value: branch.id
    }));
  });
  
  // Fetch all branches (projects with status = BRANCH) - filtered by user's company
  const fetchBranches = async () => {
    loading.value = true;
    error.value = null;
    
    // Get the current user's company ID
    const userCompanyId = authStore.accountInformation?.company?.id;
    
    try {
      // Build the query
      let query = supabase
        .from('Project')
        .select('*')
        .in('status', ['BRANCH', 'PROJECT']) // Both BRANCH and PROJECT can be branches
        .eq('isDeleted', false);
      
      // Add company filter if user has a company
      // This ensures users only see branches from their own company
      if (userCompanyId) {
        query = query.eq('companyId', userCompanyId);
      }
      
      const { data, error: fetchError } = await query.order('name', { ascending: true });
      
      if (fetchError) {
        console.error('Error fetching branches:', fetchError);
        error.value = fetchError;
        return;
      }
      
      branches.value = data || [];
    } catch (err) {
      console.error('Unexpected error fetching branches:', err);
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
  
  // Fetch branches by company ID
  const fetchBranchesByCompany = async (companyId: number) => {
    loading.value = true;
    error.value = null;
    
    try {
      const { data, error: fetchError } = await supabase
        .from('Project')
        .select('*')
        .eq('companyId', companyId)
        .in('status', ['BRANCH', 'PROJECT'])
        .eq('isDeleted', false)
        .order('name', { ascending: true });
      
      if (fetchError) {
        console.error('Error fetching branches by company:', fetchError);
        error.value = fetchError;
        return;
      }
      
      branches.value = data || [];
    } catch (err) {
      console.error('Unexpected error fetching branches:', err);
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
  
  // Fetch a single branch by ID - with company validation
  const fetchBranchById = async (id: number) => {
    // Get the current user's company ID
    const userCompanyId = authStore.accountInformation?.company?.id;
    
    try {
      // Build the query
      let query = supabase
        .from('Project')
        .select('*')
        .eq('id', id);
      
      // Add company filter if user has a company for security
      if (userCompanyId) {
        query = query.eq('companyId', userCompanyId);
      }
      
      const { data, error: fetchError } = await query.single();
      
      if (fetchError) {
        console.error('Error fetching branch by ID:', fetchError);
        return null;
      }
      
      return data;
    } catch (err) {
      console.error('Unexpected error fetching branch:', err);
      return null;
    }
  };
  
  // Create a new branch
  const createBranch = async (branchData: Partial<Branch>) => {
    loading.value = true;
    error.value = null;
    
    // Get the current user's company ID
    const userCompanyId = authStore.accountInformation?.company?.id;
    
    try {
      // Ensure it's marked as a branch and includes company ID
      const dataWithStatus = {
        ...branchData,
        status: branchData.status || 'BRANCH',
        // Always set the companyId to the user's company for security
        companyId: userCompanyId || branchData.companyId
      };
      
      const { data, error: createError } = await supabase
        .from('Project')
        .insert([dataWithStatus])
        .select()
        .single();
      
      if (createError) {
        console.error('Error creating branch:', createError);
        error.value = createError;
        return null;
      }
      
      // Add to local list
      if (data) {
        branches.value.push(data);
      }
      
      return data;
    } catch (err) {
      console.error('Unexpected error creating branch:', err);
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
  
  // Update a branch
  const updateBranch = async (id: number, updates: Partial<Branch>) => {
    loading.value = true;
    error.value = null;
    
    // Get the current user's company ID
    const userCompanyId = authStore.accountInformation?.company?.id;
    
    try {
      // Build the update query with company validation
      let query = supabase
        .from('Project')
        .update(updates)
        .eq('id', id);
      
      // Add company filter to ensure users can only update branches from their company
      if (userCompanyId) {
        query = query.eq('companyId', userCompanyId);
      }
      
      const { data, error: updateError } = await query
        .select()
        .single();
      
      if (updateError) {
        console.error('Error updating branch:', updateError);
        error.value = updateError;
        return null;
      }
      
      // Update local list
      if (data) {
        const index = branches.value.findIndex(b => b.id === id);
        if (index !== -1) {
          branches.value[index] = data;
        }
      }
      
      return data;
    } catch (err) {
      console.error('Unexpected error updating branch:', err);
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
  
  // Delete (soft delete) a branch
  const deleteBranch = async (id: number) => {
    return updateBranch(id, { isDeleted: true });
  };
  
  // Get all active branches (non-deleted, active status)
  const getActiveBranches = computed(() => {
    return branches.value.filter(branch => 
      !branch.isDeleted && 
      ['BRANCH', 'PROJECT'].includes(branch.status)
    );
  });
  
  // Get branches count by status
  const branchCountByStatus = computed(() => {
    const counts = {
      PROJECT: 0,
      BRANCH: 0,
      LEAD: 0
    };
    
    branches.value.forEach(branch => {
      if (!branch.isDeleted && counts[branch.status] !== undefined) {
        counts[branch.status]++;
      }
    });
    
    return counts;
  });
  
  return {
    branches,
    branchOptions,
    loading,
    error,
    fetchBranches,
    fetchBranchesByCompany,
    fetchBranchById,
    createBranch,
    updateBranch,
    deleteBranch,
    getActiveBranches,
    branchCountByStatus
  };
}