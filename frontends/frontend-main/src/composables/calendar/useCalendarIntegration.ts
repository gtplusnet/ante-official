import { ref, computed } from 'vue';
import { api } from 'src/boot/axios';
import { useQuasar } from 'quasar';
import { usePreferencesStore } from 'src/stores/preferences';

// Types
export interface CalendarSource {
  id: string;
  name: string;
  enabled: boolean;
  color: string;
  category: 'personal' | 'company';
}

export interface IntegratedCalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  allDay: boolean;
  color: string;
  sourceType: 'task' | 'shift' | 'leave' | 'project' | 'local-holiday' | 'national-holiday';
  sourceData: any;
}

// FullCalendar Event Format
export interface FullCalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  allDay?: boolean;
  backgroundColor?: string;
  borderColor?: string;
  textColor?: string;
  extendedProps?: any;
  classNames?: string[];
}

// ============================================
// SINGLETON STATE (shared across all components)
// ============================================
const personalEvents = ref<IntegratedCalendarEvent[]>([]);
const companyEvents = ref<IntegratedCalendarEvent[]>([]);
const loading = ref(false);
const error = ref<any>(null);

// Calendar sources (singleton state)
// All sources start as unchecked (enabled: false)
// User preferences from backend will be loaded and applied during splash screen
const calendarSources = ref<CalendarSource[]>([
    // Personal sources
    {
      id: 'personal-tasks',
      name: 'Task (Task Deadline)',
      enabled: false,
      color: '#FF6B6B',
      category: 'personal',
    },
    {
      id: 'personal-shifts',
      name: 'Shifting Schedule',
      enabled: false,
      color: '#4ECDC4',
      category: 'personal',
    },
    {
      id: 'personal-leaves',
      name: 'Leaves',
      enabled: false,
      color: '#95E1D3',
      category: 'personal',
    },

    // Company sources
    {
      id: 'company-projects',
      name: 'Projects (Project Deadline)',
      enabled: false,
      color: '#F38181',
      category: 'company',
    },
    {
      id: 'company-leaves',
      name: 'Leaves (All Employee)',
      enabled: false,
      color: '#FFA07A',
      category: 'company',
    },
    {
      id: 'company-local-holidays',
      name: 'Local Holiday',
      enabled: false,
      color: '#FFD93D',
      category: 'company',
    },
    {
      id: 'company-national-holidays',
      name: 'National Holiday',
      enabled: false,
      color: '#6BCB77',
      category: 'company',
    },
  ]);

// Cache management (singleton)
const personalEventsCache = new Map<string, { data: IntegratedCalendarEvent[]; timestamp: number }>();
const companyEventsCache = new Map<string, { data: IntegratedCalendarEvent[]; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Computed (singleton)
const enabledSources = computed(() => calendarSources.value.filter((source) => source.enabled));

const personalSources = computed(() =>
  calendarSources.value.filter((source) => source.category === 'personal')
);

const companySources = computed(() => calendarSources.value.filter((source) => source.category === 'company'));

// Get contrast color for text
const getContrastColor = (hexColor: string): string => {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? '#000000' : '#FFFFFF';
};

// Filter events by enabled sources
const filterByEnabledSources = (events: IntegratedCalendarEvent[]): IntegratedCalendarEvent[] => {
  const enabledSourceTypes = new Set<string>();

  enabledSources.value.forEach((source) => {
    switch (source.id) {
      case 'personal-tasks':
        enabledSourceTypes.add('task');
        break;
      case 'personal-shifts':
        enabledSourceTypes.add('shift');
        break;
      case 'personal-leaves':
        // Personal leaves (need to check if isCompanyWide is false)
        enabledSourceTypes.add('leave-personal');
        break;
      case 'company-projects':
        enabledSourceTypes.add('project');
        break;
      case 'company-leaves':
        // Company leaves (need to check if isCompanyWide is true)
        enabledSourceTypes.add('leave-company');
        break;
      case 'company-local-holidays':
        enabledSourceTypes.add('local-holiday');
        break;
      case 'company-national-holidays':
        enabledSourceTypes.add('national-holiday');
        break;
    }
  });

  return events.filter((event) => {
    if (event.sourceType === 'leave') {
      // Check if leave is personal or company-wide
      const isCompanyWide = event.sourceData?.isCompanyWide;
      return isCompanyWide
        ? enabledSourceTypes.has('leave-company')
        : enabledSourceTypes.has('leave-personal');
    }
    return enabledSourceTypes.has(event.sourceType);
  });
};

// Convert to FullCalendar format
const transformToFullCalendar = (events: IntegratedCalendarEvent[]): FullCalendarEvent[] => {
  return events.map((event) => ({
    id: event.id,
    title: event.title,
    start: event.start,
    end: event.end,
    allDay: event.allDay,
    backgroundColor: event.color,
    borderColor: 'transparent',
    textColor: getContrastColor(event.color),
    classNames: [`source-${event.sourceType}`],
    extendedProps: {
      sourceType: event.sourceType,
      sourceData: event.sourceData,
      isIntegrated: true,
    },
  }));
};

// Computed for all integrated events
const getAllIntegratedEvents = computed(() => {
  const allEvents = [...personalEvents.value, ...companyEvents.value];
  return filterByEnabledSources(allEvents);
});

// Computed for integrated events in FullCalendar format
const getIntegratedFullCalendarEvents = computed(() => {
  return transformToFullCalendar(getAllIntegratedEvents.value);
});

// Toggle source and save to preferences
const toggleSource = (sourceId: string) => {
  const index = calendarSources.value.findIndex((s) => s.id === sourceId);
  if (index !== -1) {
    // Create a new array with updated source to trigger Vue reactivity
    calendarSources.value = [
      ...calendarSources.value.slice(0, index),
      {
        ...calendarSources.value[index],
        enabled: !calendarSources.value[index].enabled
      },
      ...calendarSources.value.slice(index + 1)
    ];

    // Save to preferences store
    const preferencesStore = usePreferencesStore();
    const enabledSourceIds = calendarSources.value
      .filter(s => s.enabled)
      .map(s => s.id);
    preferencesStore.updatePreference('calendar.enabledSources', enabledSourceIds);
  }
};

// Toggle all sources in a category and save to preferences
const toggleAllSources = (category: 'personal' | 'company', enabled: boolean) => {
  // Create a new array with updated sources to trigger Vue reactivity
  calendarSources.value = calendarSources.value.map((source) =>
    source.category === category
      ? { ...source, enabled }
      : source
  );

  // Save to preferences store
  const preferencesStore = usePreferencesStore();
  const enabledSourceIds = calendarSources.value
    .filter(s => s.enabled)
    .map(s => s.id);
  preferencesStore.updatePreference('calendar.enabledSources', enabledSourceIds);
};

// Check if all sources in a category are enabled
const areAllSourcesEnabled = (category: 'personal' | 'company'): boolean => {
  const sources = calendarSources.value.filter((source) => source.category === category);
  return sources.length > 0 && sources.every((source) => source.enabled);
};

// Clear cache
const clearCache = () => {
  personalEventsCache.clear();
  companyEventsCache.clear();
};

// Flag to ensure initialization happens only once
let sourcesInitialized = false;

// Initialize calendar sources from preferences
const initializeCalendarSources = () => {
  // Prevent multiple initializations
  if (sourcesInitialized) return;

  const preferencesStore = usePreferencesStore();

  // Only initialize if preferences are loaded
  if (preferencesStore.isLoaded) {
    const enabledSourceIds = preferencesStore.getPreference('calendar.enabledSources', []);

    // Apply saved preferences to calendar sources
    if (enabledSourceIds.length > 0) {
      calendarSources.value = calendarSources.value.map((source) => ({
        ...source,
        enabled: enabledSourceIds.includes(source.id)
      }));
    }

    // Mark as initialized
    sourcesInitialized = true;
  }
};

// Export composable function
export function useCalendarIntegration() {
  const $q = useQuasar();

  // Initialize calendar sources from preferences on first use
  initializeCalendarSources();

  // Fetch personal calendar events
  const fetchPersonalEvents = async (startDate: Date, endDate: Date, useCache = true) => {
    const cacheKey = `${startDate.toISOString()}_${endDate.toISOString()}`;

    // Check cache
    if (useCache) {
      const cached = personalEventsCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        personalEvents.value = cached.data;
        return cached.data;
      }
    }

    loading.value = true;
    error.value = null;

    try {
      const response = await api.get('/calendar/event/integration/personal', {
        params: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        },
      });

      const events = response.data || [];

      // Cache the results
      personalEventsCache.set(cacheKey, {
        data: events,
        timestamp: Date.now(),
      });

      personalEvents.value = events;
      return events;
    } catch (err) {
      console.error('Error fetching personal calendar events:', err);
      error.value = err;
      $q.notify({
        type: 'negative',
        message: 'Failed to load personal calendar events',
      });
      return [];
    } finally {
      loading.value = false;
    }
  };

  // Fetch company calendar events
  const fetchCompanyEvents = async (startDate: Date, endDate: Date, useCache = true) => {
    const cacheKey = `${startDate.toISOString()}_${endDate.toISOString()}`;

    // Check cache
    if (useCache) {
      const cached = companyEventsCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        companyEvents.value = cached.data;
        return cached.data;
      }
    }

    loading.value = true;
    error.value = null;

    try {
      const response = await api.get('/calendar/event/integration/company', {
        params: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        },
      });

      const events = response.data || [];

      // Cache the results
      companyEventsCache.set(cacheKey, {
        data: events,
        timestamp: Date.now(),
      });

      companyEvents.value = events;
      return events;
    } catch (err) {
      console.error('Error fetching company calendar events:', err);
      error.value = err;
      $q.notify({
        type: 'negative',
        message: 'Failed to load company calendar events',
      });
      return [];
    } finally {
      loading.value = false;
    }
  };

  // Fetch all integrated events
  const fetchAllIntegratedEvents = async (startDate: Date, endDate: Date, useCache = true) => {
    await Promise.all([
      fetchPersonalEvents(startDate, endDate, useCache),
      fetchCompanyEvents(startDate, endDate, useCache),
    ]);
  };

  return {
    // State
    personalEvents,
    companyEvents,
    loading,
    error,
    calendarSources,

    // Computed
    enabledSources,
    personalSources,
    companySources,
    getAllIntegratedEvents,
    getIntegratedFullCalendarEvents,

    // Methods
    fetchPersonalEvents,
    fetchCompanyEvents,
    fetchAllIntegratedEvents,
    toggleSource,
    toggleAllSources,
    areAllSourcesEnabled,
    clearCache,
  };
}
