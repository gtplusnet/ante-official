import { defineStore } from 'pinia';
import { ref, watch } from 'vue';

export type TaskViewType = 'list' | 'board' | 'card';
export type TaskGroupingMode = 'none' | 'priority' | 'deadline' | 'stages' | 'assignee' | 'project' | 'taskPhase' | 'goals';

export const useTaskSearchStore = defineStore('taskSearch', () => {
  const searchQuery = ref('');

  // View management with localStorage persistence
  const viewType = ref<TaskViewType>('list'); // Default to Asana-style list view

  // Grouping mode management with localStorage persistence
  const groupingMode = ref<TaskGroupingMode>('none'); // Default to no groups (all tasks in one list)

  // Current grouping value for drag-and-drop operations
  const currentGroupingValue = ref<string | undefined>(undefined)

  // Load saved view preference from localStorage
  const savedView = localStorage.getItem('taskViewType');
  if (savedView && ['list', 'board', 'card'].includes(savedView)) {
    viewType.value = savedView as TaskViewType;
  }

  // Load saved grouping preference from localStorage
  const savedGrouping = localStorage.getItem('taskGroupingMode');
  // Migrate from 'custom' to 'stages' if user had custom mode selected
  if (savedGrouping === 'custom') {
    groupingMode.value = 'stages';
    localStorage.setItem('taskGroupingMode', 'stages');
  } else if (savedGrouping && ['none', 'priority', 'deadline', 'stages', 'assignee', 'project', 'taskPhase', 'goals'].includes(savedGrouping)) {
    groupingMode.value = savedGrouping as TaskGroupingMode;
  }

  // Watch for view changes and save to localStorage
  watch(viewType, (newView) => {
    localStorage.setItem('taskViewType', newView);
  });

  // Watch for grouping changes and save to localStorage
  watch(groupingMode, (newMode) => {
    localStorage.setItem('taskGroupingMode', newMode);
  });

  const setSearchQuery = (query: string) => {
    searchQuery.value = query;
  };

  const clearSearch = () => {
    searchQuery.value = '';
  };

  const setViewType = (view: TaskViewType) => {
    viewType.value = view;
  };

  const setGroupingMode = (mode: TaskGroupingMode) => {
    groupingMode.value = mode;
  };

  return {
    searchQuery,
    viewType,
    groupingMode,
    currentGroupingValue,
    setSearchQuery,
    clearSearch,
    setViewType,
    setGroupingMode,
  };
});