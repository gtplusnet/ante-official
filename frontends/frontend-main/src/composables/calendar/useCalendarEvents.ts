import { ref, computed } from 'vue';
import { api } from 'src/boot/axios';
import { useQuasar } from 'quasar';

// Types
export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  location?: string;
  startDateTime: string;
  endDateTime: string;
  allDay: boolean;
  colorCode: string;
  categoryId?: number;
  creatorId: string;
  isActive: boolean;
  visibility: string;
  companyId: number;
  createdAt: string;
  updatedAt: string;

  // Relations
  category?: CalendarCategory;
  creator?: any;
  attendees?: CalendarEventAttendee[];
  attachments?: CalendarEventAttachment[];
  recurrence?: CalendarEventRecurrence;
  reminders?: CalendarEventReminder[];
}

export interface CalendarCategory {
  id: number;
  name: string;
  colorCode: string;
  icon?: string;
  description?: string;
  isSystem: boolean;
  creatorId?: string;
  companyId: number;
  isActive: boolean;
  sortOrder: number;
}

export interface CalendarEventAttendee {
  id: string;
  eventId: string;
  accountId: string;
  email?: string;
  responseStatus: string;
  isOrganizer: boolean;
  isOptional: boolean;
  addedAt: string;
  respondedAt?: string;
  account?: any;
}

export interface CalendarEventRecurrence {
  id: string;
  eventId: string;
  recurrenceType: string;
  frequency: number;
  interval?: string;
  byDay?: string[];
  byMonthDay?: number[];
  byMonth?: number[];
  count?: number;
  until?: string;
  exceptions?: string[];
}

export interface CalendarEventAttachment {
  id: string;
  eventId: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  uploadedBy: string;
  uploadedAt: string;
}

export interface CalendarEventReminder {
  id: string;
  eventId: string;
  method: string;
  minutes: number;
}

// FullCalendar Event Format
export interface FullCalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  allDay?: boolean;
  color?: string;
  backgroundColor?: string;
  borderColor?: string;
  textColor?: string;
  extendedProps?: any;
  classNames?: string[];
}

export function useCalendarEvents() {
  const $q = useQuasar();

  const events = ref<CalendarEvent[]>([]);
  const loading = ref(false);
  const error = ref<any>(null);

  // Cache management
  const eventCache = new Map<string, { data: CalendarEvent[], timestamp: number }>();
  const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  // Convert to FullCalendar format
  const transformToFullCalendar = (events: CalendarEvent[]): FullCalendarEvent[] => {
    return events.map(event => ({
      id: event.id,
      title: event.title,
      start: event.startDateTime,
      end: event.endDateTime,
      allDay: event.allDay,
      backgroundColor: event.category?.colorCode || event.colorCode,
      borderColor: 'transparent',
      textColor: getContrastColor(event.category?.colorCode || event.colorCode),
      classNames: [`category-${event.categoryId}`, `visibility-${event.visibility}`],
      extendedProps: {
        description: event.description,
        location: event.location,
        category: event.category,
        attendees: event.attendees,
        creatorId: event.creatorId,
        visibility: event.visibility
      }
    }));
  };

  // Get contrast color for text
  const getContrastColor = (hexColor: string): string => {
    // Remove # if present
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 128) ? '#000000' : '#FFFFFF';
  };

  // Fetch events with date range (using backend expansion)
  const fetchEvents = async (startDate: Date, endDate: Date, categoryIds?: number[], useCache = true) => {
    const cacheKey = `${startDate.toISOString()}_${endDate.toISOString()}_${categoryIds?.join(',') || 'all'}`;

    // Check cache
    if (useCache) {
      const cached = eventCache.get(cacheKey);
      if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
        events.value = cached.data;
        return cached.data;
      }
    }

    loading.value = true;
    error.value = null;

    try {
      const params: any = {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      };

      if (categoryIds && categoryIds.length > 0) {
        params.categoryIds = categoryIds;
      }

      // Use expanded endpoint - backend handles recurrence expansion
      const response = await api.get('/calendar/event/expanded/all', { params });
      const expandedEvents = response.data || [];

      // Cache the results
      eventCache.set(cacheKey, {
        data: expandedEvents,
        timestamp: Date.now()
      });

      events.value = expandedEvents;
      return expandedEvents;

    } catch (err) {
      console.error('Error in fetchEvents:', err);
      error.value = err;
      $q.notify({
        type: 'negative',
        message: 'Failed to load calendar events'
      });
      return [];
    } finally {
      loading.value = false;
    }
  };

  // Expand recurring events
  const expandRecurringEvents = async (events: CalendarEvent[], startDate: Date, endDate: Date): Promise<CalendarEvent[]> => {
    const expanded: CalendarEvent[] = [];

    for (const event of events) {
      if (!event.recurrence) {
        // Non-recurring event
        expanded.push(event);
      } else {
        // Generate instances for recurring event
        const instances = generateRecurrenceInstances(event, event.recurrence, startDate, endDate);
        expanded.push(...instances);
      }
    }

    return expanded;
  };

  // Generate recurrence instances
  const generateRecurrenceInstances = (
    event: CalendarEvent,
    recurrence: CalendarEventRecurrence,
    startDate: Date,
    endDate: Date
  ): CalendarEvent[] => {
    const instances: CalendarEvent[] = [];
    const eventStart = new Date(event.startDateTime);
    const eventEnd = new Date(event.endDateTime);
    const duration = eventEnd.getTime() - eventStart.getTime();

    let currentDate = new Date(eventStart);
    let instanceCount = 0;

    // Simple recurrence generation (can be enhanced with rrule library)
    while (currentDate <= endDate && (!recurrence.count || instanceCount < recurrence.count)) {
      if (currentDate >= startDate) {
        // Check if this date is not in exceptions
        const dateStr = currentDate.toISOString().split('T')[0];
        if (!recurrence.exceptions?.includes(dateStr)) {
          const instanceStart = new Date(currentDate);
          const instanceEnd = new Date(currentDate.getTime() + duration);

          instances.push({
            ...event,
            id: `${event.id}_${instanceCount}`,
            startDateTime: instanceStart.toISOString(),
            endDateTime: instanceEnd.toISOString()
          });
        }
      }

      // Move to next occurrence based on recurrence type
      switch (recurrence.recurrenceType) {
        case 'daily':
          currentDate.setDate(currentDate.getDate() + recurrence.frequency);
          break;
        case 'weekly':
          currentDate.setDate(currentDate.getDate() + (7 * recurrence.frequency));
          break;
        case 'monthly':
          currentDate.setMonth(currentDate.getMonth() + recurrence.frequency);
          break;
        case 'yearly':
          currentDate.setFullYear(currentDate.getFullYear() + recurrence.frequency);
          break;
        default:
          // Stop if unknown recurrence type
          return instances;
      }

      instanceCount++;

      // Check until date
      if (recurrence.until && currentDate > new Date(recurrence.until)) {
        break;
      }
    }

    return instances;
  };

  // Create a new event
  const createEvent = async (eventData: {
    title: string;
    description?: string;
    location?: string;
    startDateTime: string;
    endDateTime: string;
    allDay: boolean;
    colorCode: string;
    categoryId?: number;
    visibility: string;
    recurrence?: {
      recurrenceType: string;
      frequency: number;
      interval?: string;
      byDay?: string[];
      byMonthDay?: number[];
      byMonth?: number[];
      count?: number;
      until?: string;
      exceptions?: string[];
    };
    attendeeIds?: string[];
    reminders?: { method: string; minutes: number }[];
  }) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await api.post('/calendar/event', eventData);
      const data = response.data;

      // Clear cache
      eventCache.clear();

      $q.notify({
        type: 'positive',
        message: 'Event created successfully'
      });

      return data;

    } catch (err) {
      console.error('Error creating event:', err);
      error.value = err;
      $q.notify({
        type: 'negative',
        message: 'Failed to create event'
      });
      return null;
    } finally {
      loading.value = false;
    }
  };

  // Update an event
  const updateEvent = async (eventId: string, updates: {
    title?: string;
    description?: string;
    location?: string;
    startDateTime?: string;
    endDateTime?: string;
    allDay?: boolean;
    colorCode?: string;
    categoryId?: number;
    visibility?: string;
    attendeeIds?: string[];
  }) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await api.put(`/calendar/event/${eventId}`, updates);
      const data = response.data;

      // Update local events
      const index = events.value.findIndex(e => e.id === eventId);
      if (index !== -1) {
        events.value[index] = { ...events.value[index], ...data };
      }

      // Clear cache
      eventCache.clear();

      $q.notify({
        type: 'positive',
        message: 'Event updated successfully'
      });

      return data;

    } catch (err) {
      console.error('Error updating event:', err);
      error.value = err;
      $q.notify({
        type: 'negative',
        message: 'Failed to update event'
      });
      return null;
    } finally {
      loading.value = false;
    }
  };

  // Quick update for drag/drop
  const quickUpdateEvent = async (eventId: string, startDateTime: string, endDateTime: string) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await api.put(`/calendar/event/${eventId}/quick-update`, {
        startDateTime,
        endDateTime
      });
      const data = response.data;

      // Update local events
      const index = events.value.findIndex(e => e.id === eventId);
      if (index !== -1) {
        events.value[index] = { ...events.value[index], ...data };
      }

      // Clear cache
      eventCache.clear();

      return data;

    } catch (err) {
      console.error('Error updating event:', err);
      error.value = err;
      $q.notify({
        type: 'negative',
        message: 'Failed to update event'
      });
      return null;
    } finally {
      loading.value = false;
    }
  };

  // Delete an event
  const deleteEvent = async (eventId: string) => {
    loading.value = true;
    error.value = null;

    try {
      await api.delete(`/calendar/event/${eventId}`);

      // Remove from local events
      events.value = events.value.filter(e => e.id !== eventId);

      // Clear cache
      eventCache.clear();

      $q.notify({
        type: 'positive',
        message: 'Event deleted successfully'
      });

      return true;

    } catch (err) {
      console.error('Error deleting event:', err);
      error.value = err;
      $q.notify({
        type: 'negative',
        message: 'Failed to delete event'
      });
      return false;
    } finally {
      loading.value = false;
    }
  };

  // Get events for FullCalendar
  const getFullCalendarEvents = computed(() => {
    return transformToFullCalendar(events.value);
  });

  return {
    // State
    events,
    loading,
    error,

    // Methods
    fetchEvents,
    createEvent,
    updateEvent,
    quickUpdateEvent,
    deleteEvent,

    // Computed
    getFullCalendarEvents,

    // Utils
    transformToFullCalendar,
    expandRecurringEvents
  };
}
