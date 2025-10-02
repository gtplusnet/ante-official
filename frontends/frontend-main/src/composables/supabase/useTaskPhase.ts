import { ref, Ref, computed } from 'vue';
import supabaseService from 'src/services/supabase';

export interface TaskPhase {
  id: number;
  name: string;
  description: string | null;
  projectId: number;
  status: 'DRAFT' | 'ACTIVE' | 'COMPLETED';
  order: number;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
  companyId: number;
  taskCount?: number;
}

export const useTaskPhase = (projectId: Ref<number | null>, companyId?: number) => {
  const supabase = supabaseService.getClient();
  const phases = ref<TaskPhase[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Fetch phases for project
  const fetchPhases = async () => {
    if (!projectId.value) return;

    loading.value = true;
    error.value = null;

    try {
      // Fetch phases with task count
      const { data, error: fetchError } = await supabase
        .from('TaskPhase')
        .select(`
          *,
          tasks:Task(count)
        `)
        .eq('projectId', projectId.value)
        .eq('isDeleted', false)
        .order('order', { ascending: true });

      if (fetchError) throw fetchError;

      // Transform data to include task count
      phases.value = (data || []).map((phase: any) => ({
        ...phase,
        taskCount: phase.tasks?.[0]?.count || 0
      }));
    } catch (err: any) {
      console.error('Error fetching task phases:', err);
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Create a new phase
  const createPhase = async (phase: Partial<TaskPhase>) => {
    loading.value = true;
    error.value = null;

    try {
      // Use provided companyId or get from auth store
      let finalCompanyId = companyId;

      if (!finalCompanyId) {
        // Try to get from auth store if available in Vue context
        try {
          const { useAuthStore } = await import('src/stores/auth');
          const authStore = useAuthStore();
          finalCompanyId = authStore.companyData?.id || authStore.accountInformation?.companyId;
        } catch (e) {
          console.log('Could not get company from auth store, trying localStorage');
          // Fallback to localStorage
          const selectedCompany = localStorage.getItem('selectedCompany');
          if (selectedCompany) {
            finalCompanyId = JSON.parse(selectedCompany)?.id;
          }
        }
      }

      if (!finalCompanyId) {
        throw new Error('Company ID not found');
      }

      // Get the next order value
      const maxOrder = Math.max(...phases.value.map((p: TaskPhase) => p.order), -1);

      const now = new Date().toISOString();
      const { data, error: insertError } = await supabase
        .from('TaskPhase')
        .insert({
          ...phase,
          projectId: projectId.value,
          companyId: finalCompanyId,
          order: maxOrder + 1,
          status: 'DRAFT',
          createdAt: now,
          updatedAt: now,
          isDeleted: false
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Don't add to local phases list here - let the store manage it
      // to avoid duplicates from realtime subscription
      // phases.value.push(data);
      return data;
    } catch (err: any) {
      console.error('Error creating task phase:', err);
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Update a phase
  const updatePhase = async (phaseId: number, updates: Partial<TaskPhase>) => {
    loading.value = true;
    error.value = null;

    try {
      const { data, error: updateError } = await supabase
        .from('TaskPhase')
        .update({
          ...updates,
          updatedAt: new Date().toISOString()
        })
        .eq('id', phaseId)
        .select()
        .single();

      if (updateError) throw updateError;

      // Update local phase
      const index = phases.value.findIndex((p: TaskPhase) => p.id === phaseId);
      if (index !== -1) {
        phases.value[index] = data;
      }

      return data;
    } catch (err: any) {
      console.error('Error updating task phase:', err);
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Activate a phase (change status from DRAFT to ACTIVE and update tasks)
  const activatePhase = async (phaseId: number) => {
    loading.value = true;
    error.value = null;

    try {
      // Use the RPC function for atomic operation
      const { error: rpcError } = await supabase
        .rpc('activate_task_phase', { phase_id: phaseId });

      if (rpcError) throw rpcError;

      // Update local phase status
      const phase = phases.value.find((p: TaskPhase) => p.id === phaseId);
      if (phase) {
        phase.status = 'ACTIVE';
      }

      // Trigger a refresh of tasks in the parent component
      return true;
    } catch (err: any) {
      console.error('Error activating task phase:', err);
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Delete a phase (soft delete)
  const deletePhase = async (phaseId: number) => {
    loading.value = true;
    error.value = null;

    try {
      const { error: deleteError } = await supabase
        .from('TaskPhase')
        .update({ isDeleted: true })
        .eq('id', phaseId);

      if (deleteError) throw deleteError;

      // Remove from local phases
      phases.value = phases.value.filter((p: TaskPhase) => p.id !== phaseId);

      return true;
    } catch (err: any) {
      console.error('Error deleting task phase:', err);
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Reorder phases
  const reorderPhases = async (reorderedPhases: { id: number; order: number }[]) => {
    loading.value = true;
    error.value = null;

    try {
      // Update all phases with new order values
      const updates = reorderedPhases.map(phase =>
        supabase
          .from('TaskPhase')
          .update({ order: phase.order })
          .eq('id', phase.id)
      );

      const results = await Promise.all(updates);

      // Check for errors
      const errors = results.filter((r: any) => r.error);
      if (errors.length > 0) {
        throw errors[0].error;
      }

      // Update local phases order
      reorderedPhases.forEach(({ id, order }) => {
        const phase = phases.value.find((p: TaskPhase) => p.id === id);
        if (phase) phase.order = order;
      });

      // Sort phases by order
      phases.value.sort((a: TaskPhase, b: TaskPhase) => a.order - b.order);

      return true;
    } catch (err: any) {
      console.error('Error reordering task phases:', err);
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Computed properties
  const draftPhases = computed(() => phases.value.filter((p: TaskPhase) => p.status === 'DRAFT'));
  const activePhases = computed(() => phases.value.filter((p: TaskPhase) => p.status === 'ACTIVE'));
  const completedPhases = computed(() => phases.value.filter((p: TaskPhase) => p.status === 'COMPLETED'));

  return {
    phases,
    loading,
    error,
    draftPhases,
    activePhases,
    completedPhases,
    fetchPhases,
    createPhase,
    updatePhase,
    activatePhase,
    deletePhase,
    reorderPhases
  };
};