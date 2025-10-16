<template>
  <div class="google-calendar-view">
    <FullCalendar
      ref="calendarRef"
      :options="calendarOptions"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import FullCalendar from '@fullcalendar/vue3';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import multiMonthPlugin from '@fullcalendar/multimonth';
import type { CalendarOptions, EventClickArg, DateSelectArg, EventDropArg } from '@fullcalendar/core';

// Props
interface Props {
  view?: string;
  date?: Date;
  events?: any[];
  editable?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  view: 'dayGridMonth',
  date: () => new Date(),
  events: () => [],
  editable: true
});

// Emits
const emit = defineEmits<{
  'event-click': [event: any];
  'event-drop': [info: any];
  'event-resize': [info: any];
  'date-select': [start: Date, end: Date, allDay: boolean];
}>();

// Refs
const calendarRef = ref<InstanceType<typeof FullCalendar> | null>(null);

// Calendar options
const calendarOptions = computed<CalendarOptions>(() => ({
  plugins: [
    dayGridPlugin,
    timeGridPlugin,
    interactionPlugin,
    listPlugin,
    multiMonthPlugin
  ],

  // Initial view and date
  initialView: props.view,
  initialDate: props.date,

  // Header toolbar - we use custom toolbar, so hide this
  headerToolbar: false,

  // Height
  height: 'calc(100vh - 128px)',

  // Events
  events: props.events,

  // Interaction
  editable: props.editable,
  droppable: true,
  selectable: true,
  selectMirror: true,

  // Day/Week settings
  weekends: true,
  nowIndicator: true,

  // Event settings
  dayMaxEvents: 3, // Show "+N more" link when too many events
  moreLinkClick: 'popover',

  // Time format
  eventTimeFormat: {
    hour: 'numeric',
    minute: '2-digit',
    meridiem: 'short'
  },

  slotLabelFormat: {
    hour: 'numeric',
    minute: '2-digit',
    meridiem: 'short'
  },

  // Business hours (optional)
  businessHours: {
    daysOfWeek: [1, 2, 3, 4, 5], // Monday - Friday
    startTime: '08:00',
    endTime: '18:00'
  },

  // Week settings
  firstDay: 0, // Sunday
  weekNumbers: false,

  // Slot duration
  slotDuration: '00:30:00',
  slotMinTime: '00:00:00',
  slotMaxTime: '24:00:00',

  // Event rendering
  eventDisplay: 'block',
  eventBackgroundColor: 'transparent',
  eventBorderColor: 'transparent',

  // Custom event content
  eventContent: renderEventContent,

  // Event handlers
  eventClick: handleEventClick,
  select: handleDateSelect,
  eventDrop: handleEventDrop,
  eventResize: handleEventResize,

  // Day cell content
  dayCellDidMount: (arg) => {
    // Add custom styling to day cells if needed
  },

  // Views
  views: {
    timeGrid4Day: {
      type: 'timeGrid',
      duration: { days: 4 },
      buttonText: '4 days'
    }
  },

  // Mobile responsiveness
  windowResize: () => {
    handleWindowResize();
  }
}));

// Render event content (Material Design 3 style)
const renderEventContent = (arg: any) => {
  const event = arg.event;
  const backgroundColor = event.backgroundColor || '#2196F3';

  // Apply opacity for flat design
  const bgColor = hexToRgba(backgroundColor, 0.65);

  return {
    html: `
      <div class="fc-event-main-frame" style="background-color: ${bgColor}; border-left: 3px solid ${backgroundColor}; padding: 2px 6px; border-radius: 4px;">
        ${arg.timeText ? `<div class="fc-event-time">${arg.timeText}</div>` : ''}
        <div class="fc-event-title">${event.title || 'Untitled'}</div>
      </div>
    `
  };
};

// Helper: Convert hex to rgba
const hexToRgba = (hex: string, alpha: number): string => {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

// Helper: Get contrast color
const getContrastColor = (hexColor: string): string => {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return (yiq >= 128) ? '#000000' : '#FFFFFF';
};

// Event handlers
const handleEventClick = (clickInfo: EventClickArg) => {
  emit('event-click', clickInfo.event);
};

const handleDateSelect = (selectInfo: DateSelectArg) => {
  emit('date-select', selectInfo.start, selectInfo.end, selectInfo.allDay);
};

const handleEventDrop = (dropInfo: EventDropArg) => {
  emit('event-drop', {
    event: dropInfo.event,
    oldEvent: dropInfo.oldEvent,
    delta: dropInfo.delta,
    revert: dropInfo.revert
  });
};

const handleEventResize = (resizeInfo: any) => {
  emit('event-resize', {
    event: resizeInfo.event,
    prevEvent: resizeInfo.prevEvent,
    endDelta: resizeInfo.endDelta,
    revert: resizeInfo.revert
  });
};

const handleWindowResize = () => {
  // Handle responsive behavior
  if (calendarRef.value) {
    const calendarApi = calendarRef.value.getApi();
    if (window.innerWidth < 768) {
      // Mobile view adjustments
      calendarApi.setOption('dayMaxEvents', 2);
    } else {
      calendarApi.setOption('dayMaxEvents', 3);
    }
  }
};

// Public methods
const getApi = () => {
  return calendarRef.value?.getApi();
};

const changeView = (viewName: string) => {
  const api = getApi();
  if (api) {
    api.changeView(viewName);
  }
};

const goToDate = (date: Date) => {
  const api = getApi();
  if (api) {
    api.gotoDate(date);
  }
};

const refetchEvents = () => {
  const api = getApi();
  if (api) {
    api.refetchEvents();
  }
};

const addEvent = (event: any) => {
  const api = getApi();
  if (api) {
    api.addEvent(event);
  }
};

const removeEvent = (eventId: string) => {
  const api = getApi();
  if (api) {
    const event = api.getEventById(eventId);
    if (event) {
      event.remove();
    }
  }
};

const updateEvent = (eventId: string, updates: any) => {
  const api = getApi();
  if (api) {
    const event = api.getEventById(eventId);
    if (event) {
      event.setProp('title', updates.title);
      event.setStart(updates.start);
      event.setEnd(updates.end);
      event.setAllDay(updates.allDay);
      event.setExtendedProp('description', updates.description);
      event.setExtendedProp('location', updates.location);
    }
  }
};

// Watchers
watch(() => props.view, (newView) => {
  changeView(newView);
});

watch(() => props.date, (newDate) => {
  goToDate(newDate);
});

watch(() => props.events, () => {
  refetchEvents();
}, { deep: true });

// Expose methods to parent
defineExpose({
  getApi,
  changeView,
  goToDate,
  refetchEvents,
  addEvent,
  removeEvent,
  updateEvent
});
</script>

<style lang="scss">
// Material Design 3 Calendar Styles
.google-calendar-view {
  width: 100%;
  height: 100%;
  background: white;

  // FullCalendar overrides for MD3
  .fc {
    // General styling
    font-family: 'Roboto', sans-serif;

    // Remove shadows (MD3 flat design)
    .fc-theme-standard td,
    .fc-theme-standard th {
      border-color: rgba(0, 0, 0, 0.08);
    }

    // Header
    .fc-col-header-cell {
      background: transparent;
      padding: 8px 4px;
      font-weight: 500;
      font-size: 0.75rem;
      text-transform: uppercase;
      color: rgba(0, 0, 0, 0.54);
      border: none;
    }

    // Day cells
    .fc-daygrid-day {
      &:hover {
        background: rgba(0, 0, 0, 0.02);
      }
    }

    .fc-daygrid-day-number {
      padding: 4px 8px;
      font-weight: 400;
      color: rgba(0, 0, 0, 0.87);
    }

    .fc-day-today {
      background: rgba(33, 150, 243, 0.08) !important;

      .fc-daygrid-day-number {
        background: #2196F3;
        color: white;
        border-radius: 50%;
        width: 24px;
        height: 24px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-weight: 500;
      }
    }

    .fc-day-other {
      background: rgba(0, 0, 0, 0.01);

      .fc-daygrid-day-number {
        color: rgba(0, 0, 0, 0.38);
      }
    }

    // Events
    .fc-event {
      border: none;
      box-shadow: none !important;
      cursor: pointer;
      margin-bottom: 2px;

      &:hover {
        opacity: 0.9;
      }
    }

    .fc-event-main {
      padding: 0;
    }

    .fc-event-time {
      font-size: 0.75rem;
      font-weight: 500;
      margin-bottom: 2px;
    }

    .fc-event-title {
      font-size: 0.875rem;
      font-weight: 400;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .fc-event-location {
      font-size: 0.75rem;
      opacity: 0.8;
      display: flex;
      align-items: center;
      gap: 2px;
      margin-top: 2px;
    }

    // More link
    .fc-more-link {
      color: rgba(0, 0, 0, 0.54);
      font-size: 0.75rem;
      font-weight: 500;
      padding: 2px 4px;

      &:hover {
        background: rgba(0, 0, 0, 0.04);
        border-radius: 2px;
      }
    }

    // Popover
    .fc-popover {
      border: 1px solid rgba(0, 0, 0, 0.08);
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      border-radius: 8px;
    }

    .fc-popover-header {
      background: transparent;
      border-bottom: 1px solid rgba(0, 0, 0, 0.08);
      padding: 12px 16px;
      font-weight: 500;
    }

    .fc-popover-body {
      padding: 8px;
    }

    // Time grid
    .fc-timegrid-slot {
      height: 3rem;
    }

    .fc-timegrid-slot-label {
      font-size: 0.75rem;
      color: rgba(0, 0, 0, 0.54);
    }

    .fc-timegrid-event {
      border-radius: 4px;
      padding: 4px;
    }

    // Now indicator
    .fc-timegrid-now-indicator-line {
      border-color: #E53935;
      border-width: 2px;
    }

    .fc-timegrid-now-indicator-arrow {
      border-color: #E53935;
      border-width: 5px;
    }

    // List view
    .fc-list-event {
      cursor: pointer;

      &:hover {
        background: rgba(0, 0, 0, 0.02);
      }
    }

    .fc-list-event-time {
      font-size: 0.875rem;
      color: rgba(0, 0, 0, 0.54);
    }

    .fc-list-event-title {
      font-size: 0.875rem;
    }

    // Scrollbars
    ::-webkit-scrollbar {
      width: 8px;
      height: 8px;
    }

    ::-webkit-scrollbar-track {
      background: rgba(0, 0, 0, 0.05);
    }

    ::-webkit-scrollbar-thumb {
      background: rgba(0, 0, 0, 0.2);
      border-radius: 4px;

      &:hover {
        background: rgba(0, 0, 0, 0.3);
      }
    }
  }
}

// Mobile responsive
@media (max-width: 768px) {
  .google-calendar-view {
    .fc {
      .fc-event-time,
      .fc-event-location {
        display: none;
      }

      .fc-event-title {
        font-size: 0.75rem;
      }

      .fc-daygrid-day-number {
        font-size: 0.875rem;
        padding: 2px 4px;
      }
    }
  }
}
</style>