import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useTaskPhase, type TaskPhase } from 'src/composables/supabase/useTaskPhase';
import { useAuthStore } from './auth';
import supabaseService from 'src/services/supabase';
const supabase = supabaseService.getClient();

export const useTaskPhaseStore = defineStore('taskPhase', () => {
  // State - Map of project ID to phases
  const phasesByProject = ref<Map<number, TaskPhase[]>>(new Map());
  const loadingByProject = ref<Map<number, boolean>>(new Map());
  const subscriptions = ref<Map<number, any>>(new Map());
  const loadingPromises = ref<Map<number, Promise<void>>>(new Map());

  // Get company ID from auth store
  const getCompanyId = () => {
    const authStore = useAuthStore();
    const companyId = authStore.companyData?.id || authStore.accountInformation?.companyId;
    console.log('Company ID from auth store:', companyId);
    return companyId || null;
  };

  // Load phases for a project
  const loadPhasesForProject = async (projectId: number) => {
    // Check if there's an existing loading promise for this project
    const existingPromise = loadingPromises.value.get(projectId);
    if (existingPromise) {
      // Return the existing promise to prevent duplicate loads
      return existingPromise;
    }

    // Check if already loading (backward compatibility)
    if (loadingByProject.value.get(projectId)) {
      return;
    }

    // Create the loading promise
    const loadPromise = (async () => {
      loadingByProject.value.set(projectId, true);

      const projectIdRef = ref(projectId);
      const companyId = getCompanyId();
      const taskPhaseComposable = useTaskPhase(projectIdRef, companyId);

      try {
        await taskPhaseComposable.fetchPhases();
        phasesByProject.value.set(projectId, taskPhaseComposable.phases.value);

        // Setup realtime subscription if not already subscribed
        if (!subscriptions.value.has(projectId)) {
          setupRealtimeSubscription(projectId);
        }
      } finally {
        loadingByProject.value.set(projectId, false);
        // Clean up the promise from the map once it completes
        loadingPromises.value.delete(projectId);
      }
    })();

    // Store the promise to prevent duplicate loads
    loadingPromises.value.set(projectId, loadPromise);
    return loadPromise;
  };

  // Setup realtime subscription for a project's phases
  const setupRealtimeSubscription = (projectId: number) => {
    const channel = supabase
      .channel(`taskphase:${projectId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'TaskPhase',
          filter: `projectId=eq.${projectId}`
        },
        async (payload) => {
          console.log('TaskPhase realtime event:', payload);

          // Handle different event types
          switch (payload.eventType) {
            case 'INSERT': {
              const newPhase = payload.new as TaskPhase;
              const phases = phasesByProject.value.get(projectId) || [];

              // Check if phase already exists (to avoid duplicates)
              if (!phases.find(p => p.id === newPhase.id)) {
                phases.push(newPhase);
                phases.sort((a, b) => a.order - b.order);
                phasesByProject.value.set(projectId, [...phases]);
              }
              break;
            }

            case 'UPDATE': {
              const updatedPhase = payload.new as TaskPhase;
              const phases = phasesByProject.value.get(projectId) || [];

              const index = phases.findIndex(p => p.id === updatedPhase.id);
              if (index !== -1) {
                // Handle soft delete
                if (updatedPhase.isDeleted) {
                  phases.splice(index, 1);
                } else {
                  phases[index] = updatedPhase;
                }
                phases.sort((a, b) => a.order - b.order);
                phasesByProject.value.set(projectId, [...phases]);
              }
              break;
            }

            case 'DELETE': {
              const deletedPhase = payload.old as TaskPhase;
              const phases = phasesByProject.value.get(projectId) || [];

              const filtered = phases.filter(p => p.id !== deletedPhase.id);
              if (filtered.length !== phases.length) {
                phasesByProject.value.set(projectId, filtered);
              }
              break;
            }
          }
        }
      )
      .subscribe();

    subscriptions.value.set(projectId, channel);
  };

  // Get phases for a project
  const getPhasesForProject = (projectId: number): TaskPhase[] => {
    return phasesByProject.value.get(projectId) || [];
  };

  // Create a phase
  const createPhase = async (projectId: number, phase: Partial<TaskPhase>) => {
    const projectIdRef = ref(projectId);
    const companyId = getCompanyId();
    const taskPhaseComposable = useTaskPhase(projectIdRef, companyId);

    // Set existing phases for order calculation
    taskPhaseComposable.phases.value = getPhasesForProject(projectId);

    const newPhase = await taskPhaseComposable.createPhase(phase);

    // Update local store - but check if it already exists to avoid duplicates
    const phases = phasesByProject.value.get(projectId) || [];

    // Only add if not already present (realtime might have already added it)
    if (!phases.find(p => p.id === newPhase.id)) {
      phases.push(newPhase);
      phases.sort((a, b) => a.order - b.order);
      phasesByProject.value.set(projectId, [...phases]);
    }

    return newPhase;
  };

  // Update a phase
  const updatePhase = async (projectId: number, phaseId: number, updates: Partial<TaskPhase>) => {
    const projectIdRef = ref(projectId);
    const companyId = getCompanyId();
    const taskPhaseComposable = useTaskPhase(projectIdRef, companyId);

    const updatedPhase = await taskPhaseComposable.updatePhase(phaseId, updates);

    // Update local store
    const phases = phasesByProject.value.get(projectId) || [];
    const index = phases.findIndex(p => p.id === phaseId);
    if (index !== -1) {
      phases[index] = updatedPhase;
      phasesByProject.value.set(projectId, [...phases]);
    }

    return updatedPhase;
  };

  // Activate a phase
  const activatePhase = async (projectId: number, phaseId: number) => {
    const projectIdRef = ref(projectId);
    const companyId = getCompanyId();
    const taskPhaseComposable = useTaskPhase(projectIdRef, companyId);

    await taskPhaseComposable.activatePhase(phaseId);

    // Update local phase status
    const phases = phasesByProject.value.get(projectId) || [];
    const phase = phases.find(p => p.id === phaseId);
    if (phase) {
      phase.status = 'ACTIVE';
      phasesByProject.value.set(projectId, [...phases]);
    }
  };

  // Delete a phase
  const deletePhase = async (projectId: number, phaseId: number) => {
    const projectIdRef = ref(projectId);
    const companyId = getCompanyId();
    const taskPhaseComposable = useTaskPhase(projectIdRef, companyId);

    await taskPhaseComposable.deletePhase(phaseId);

    // Remove from local store
    const phases = phasesByProject.value.get(projectId) || [];
    const filtered = phases.filter(p => p.id !== phaseId);
    phasesByProject.value.set(projectId, filtered);
  };

  // Reorder phases
  const reorderPhases = async (projectId: number, reorderedPhases: { id: number; order: number }[]) => {
    const projectIdRef = ref(projectId);
    const companyId = getCompanyId();
    const taskPhaseComposable = useTaskPhase(projectIdRef, companyId);

    await taskPhaseComposable.reorderPhases(reorderedPhases);

    // Update local order
    const phases = phasesByProject.value.get(projectId) || [];
    reorderedPhases.forEach(({ id, order }) => {
      const phase = phases.find(p => p.id === id);
      if (phase) phase.order = order;
    });
    phases.sort((a, b) => a.order - b.order);
    phasesByProject.value.set(projectId, [...phases]);
  };

  // Cleanup subscriptions
  const cleanupSubscriptions = () => {
    subscriptions.value.forEach(channel => {
      supabase.removeChannel(channel);
    });
    subscriptions.value.clear();
  };

  // Clear all data
  const clearAll = () => {
    cleanupSubscriptions();
    phasesByProject.value.clear();
    loadingByProject.value.clear();
    loadingPromises.value.clear();
  };

  return {
    phasesByProject,
    loadingByProject,
    loadPhasesForProject,
    getPhasesForProject,
    createPhase,
    updatePhase,
    activatePhase,
    deletePhase,
    reorderPhases,
    cleanupSubscriptions,
    clearAll
  };
});