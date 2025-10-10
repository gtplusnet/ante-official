import { defineStore } from 'pinia';
import { ref } from 'vue';
// TODO: Migrate to backend API - TaskPhase endpoints need to be created
// import { useTaskPhase, type TaskPhase } from 'src/composables/supabase/useTaskPhase';
import { useAuthStore } from './auth';
// import supabaseService from 'src/services/supabase';
// const supabase = supabaseService.getClient();

// Temporary type definition until backend migration
export type TaskPhase = {
  id: number;
  name: string;
  order: number;
  status: string;
  projectId: number;
  isDeleted?: boolean;
};

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
    return companyId || null;
  };

  // Load phases for a project
  const loadPhasesForProject = async (projectId: number) => {
    // TODO: Implement backend API call
    console.warn('TaskPhase backend API not implemented yet');
    loadingByProject.value.set(projectId, false);
    phasesByProject.value.set(projectId, []);
  };

  // Setup realtime subscription for a project's phases
  const setupRealtimeSubscription = (projectId: number) => {
    // TODO: Migrate to Socket.io
    console.warn('TaskPhase realtime not implemented yet');
  };

  // Get phases for a project
  const getPhasesForProject = (projectId: number): TaskPhase[] => {
    return phasesByProject.value.get(projectId) || [];
  };

  // Create a phase
  const createPhase = async (projectId: number, phase: Partial<TaskPhase>) => {
    // TODO: Implement backend API call
    console.warn('TaskPhase create not implemented yet');
    throw new Error('TaskPhase backend API not implemented');
  };

  // Update a phase
  const updatePhase = async (projectId: number, phaseId: number, updates: Partial<TaskPhase>) => {
    // TODO: Implement backend API call
    console.warn('TaskPhase update not implemented yet');
    throw new Error('TaskPhase backend API not implemented');
  };

  // Activate a phase
  const activatePhase = async (projectId: number, phaseId: number) => {
    // TODO: Implement backend API call
    console.warn('TaskPhase activate not implemented yet');
  };

  // Delete a phase
  const deletePhase = async (projectId: number, phaseId: number) => {
    // TODO: Implement backend API call
    console.warn('TaskPhase delete not implemented yet');
  };

  // Reorder phases
  const reorderPhases = async (projectId: number, reorderedPhases: { id: number; order: number }[]) => {
    // TODO: Implement backend API call
    console.warn('TaskPhase reorder not implemented yet');
  };

  // Cleanup subscriptions
  const cleanupSubscriptions = () => {
    // TODO: Migrate to Socket.io cleanup
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