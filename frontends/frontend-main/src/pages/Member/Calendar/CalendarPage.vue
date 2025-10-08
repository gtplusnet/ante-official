<template>
  <div class="calendar-page">
    <!-- Desktop Layout -->
    <div class="calendar-desktop" v-if="!$q.screen.lt.md">
      <!-- Top Toolbar -->
      <CalendarToolbar
        v-model="currentView"
        v-model:date="currentDate"
        @toggle-sidebar="sidebarVisible = !sidebarVisible"
        @open-settings="openSettings"
        @create-event="openCreateEventDialog"
        @search="handleSearch"
      />

      <div class="calendar-body">
        <!-- Left Sidebar -->
        <CalendarSidebar
          v-if="sidebarVisible"
          :selected-date="currentDate"
          :events="events"
          :show-other-calendars="false"
          @date-select="handleDateSelect"
          @create-event="openCreateEventDialog"
          @category-toggle="handleCategoryToggle"
          @edit-category="handleEditCategory"
          @delete-category="handleDeleteCategory"
          @add-category="openAddCategoryDialog"
        />

        <!-- Main Calendar Area -->
        <div class="calendar-main">
          <GoogleCalendarView
            ref="calendarViewRef"
            :view="currentView"
            :date="currentDate"
            :events="fullCalendarEvents"
            :editable="true"
            @event-click="handleEventClick"
            @date-click="handleDateClick"
            @event-drop="handleEventDrop"
            @event-resize="handleEventResize"
            @date-select="handleDateRangeSelect"
          />
        </div>
      </div>
    </div>

    <!-- Mobile Layout -->
    <div class="calendar-mobile" v-else>
      <CalendarWidget />
      <MySchedulesWidget :events="filteredEvents" />
    </div>

    <!-- Dialogs (Lazy Loaded) -->
    <CreateEventDialog
      v-if="showCreateDialog"
      v-model="showCreateDialog"
      :initial-date="selectedDialogDate"
      :initial-end-date="selectedDialogEndDate"
      :initial-all-day="selectedAllDay"
      @created="handleEventCreated"
    />

    <EventDetailsDialog
      v-if="showDetailsDialog"
      v-model="showDetailsDialog"
      :event="selectedEvent"
      @updated="handleEventUpdated"
      @deleted="handleEventDeleted"
    />

    <CategoryDialog
      v-if="showCategoryDialog"
      v-model="showCategoryDialog"
      :category="selectedCategory"
      @saved="handleCategorySaved"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, defineAsyncComponent } from 'vue';
import { useQuasar } from 'quasar';
import CalendarToolbar from './components/CalendarToolbar.vue';
import CalendarSidebar from './components/CalendarSidebar.vue';
import GoogleCalendarView from './components/GoogleCalendarView.vue';
import CalendarWidget from '../Dashboard/CalendarWidget/CalendarWidget.vue';
import MySchedulesWidget from '../Dashboard/MySchedulesWidget/MySchedulesWidget.vue';
import { useCalendarEvents } from 'src/composables/calendar/useCalendarEvents';
import { useCalendarCategories } from 'src/composables/calendar/useCalendarCategories';
import { date } from 'quasar';

// Lazy-loaded dialogs (CLAUDE.md - ALL dialogs must be lazy loaded)
const CreateEventDialog = defineAsyncComponent(() =>
  import('./dialogs/CreateEventDialog.vue')
);

const EventDetailsDialog = defineAsyncComponent(() =>
  import('./dialogs/EventDetailsDialog.vue')
);

const CategoryDialog = defineAsyncComponent(() =>
  import('./dialogs/CategoryDialog.vue')
);

// Composables
const $q = useQuasar();
const {
  events,
  loading: eventsLoading,
  fetchEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  subscribeToChanges,
  getFullCalendarEvents
} = useCalendarEvents();

const {
  categories,
  selectedCategories,
  loading: categoriesLoading,
  fetchCategories,
  deleteCategory: deleteCategoryComposable
} = useCalendarCategories();

// State
const currentView = ref('dayGridMonth');
const currentDate = ref(new Date());
const sidebarVisible = ref(true);
const searchQuery = ref('');

// Dialog states
const showCreateDialog = ref(false);
const showDetailsDialog = ref(false);
const showCategoryDialog = ref(false);

// Selected data
const selectedEvent = ref<any>(null);
const selectedCategory = ref<any>(null);
const selectedDialogDate = ref<Date>(new Date());
const selectedDialogEndDate = ref<Date | null>(null);
const selectedAllDay = ref(false);

// Refs
const calendarViewRef = ref<any>(null);

// Real-time subscription
let realtimeChannel: any = null;

// Computed
const fullCalendarEvents = computed(() => {
  const filteredByCategory = events.value.filter(event =>
    !event.categoryId || selectedCategories.value.includes(event.categoryId)
  );

  const filteredBySearch = searchQuery.value
    ? filteredByCategory.filter(event =>
        event.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
        event.description?.toLowerCase().includes(searchQuery.value.toLowerCase())
      )
    : filteredByCategory;

  return getFullCalendarEvents.value.filter(fcEvent => {
    const originalEvent = filteredBySearch.find(e => e.id === fcEvent.id);
    return !!originalEvent;
  });
});

const filteredEvents = computed(() => {
  return events.value.filter(event =>
    !event.categoryId || selectedCategories.value.includes(event.categoryId)
  );
});

// Methods
const loadEvents = async () => {
  const startDate = getStartDateForView();
  const endDate = getEndDateForView();
  await fetchEvents(startDate, endDate);
};

const getStartDateForView = (): Date => {
  const start = new Date(currentDate.value);

  switch (currentView.value) {
    case 'dayGridMonth':
      start.setDate(1);
      start.setDate(start.getDate() - start.getDay());
      break;
    case 'timeGridWeek':
      start.setDate(start.getDate() - start.getDay());
      break;
    case 'timeGridDay':
      // Use current date
      break;
    case 'multiMonthYear':
      start.setMonth(0, 1);
      break;
    default:
      start.setDate(start.getDate() - 7);
  }

  return start;
};

const getEndDateForView = (): Date => {
  const end = new Date(currentDate.value);

  switch (currentView.value) {
    case 'dayGridMonth':
      end.setMonth(end.getMonth() + 1, 0);
      end.setDate(end.getDate() + (6 - end.getDay()));
      break;
    case 'timeGridWeek':
      end.setDate(end.getDate() + (6 - end.getDay()));
      break;
    case 'timeGridDay':
      end.setDate(end.getDate() + 1);
      break;
    case 'multiMonthYear':
      end.setMonth(11, 31);
      break;
    default:
      end.setDate(end.getDate() + 7);
  }

  return end;
};

// Event handlers
const openCreateEventDialog = (initialDate?: Date, allDay = false) => {
  selectedDialogDate.value = initialDate || new Date();
  selectedAllDay.value = allDay;
  showCreateDialog.value = true;
};

const handleEventClick = (event: any) => {
  const originalEvent = events.value.find(e => e.id === event.id);
  if (originalEvent) {
    selectedEvent.value = originalEvent;
    showDetailsDialog.value = true;
  }
};

const handleDateClick = (clickedDate: Date, allDay: boolean) => {
  openCreateEventDialog(clickedDate, allDay);
};

const handleDateRangeSelect = (start: Date, end: Date, allDay: boolean) => {
  selectedDialogDate.value = start;
  selectedDialogEndDate.value = end;
  selectedAllDay.value = allDay;
  showCreateDialog.value = true;
};

const handleEventDrop = async (info: any) => {
  const { event, revert } = info;

  try {
    await updateEvent(event.id, {
      startDateTime: event.start.toISOString(),
      endDateTime: event.end?.toISOString() || event.start.toISOString(),
      allDay: event.allDay
    });

    $q.notify({
      type: 'positive',
      message: 'Event moved successfully'
    });
  } catch (error) {
    console.error('Error moving event:', error);
    revert();
    $q.notify({
      type: 'negative',
      message: 'Failed to move event'
    });
  }
};

const handleEventResize = async (info: any) => {
  const { event, revert } = info;

  try {
    await updateEvent(event.id, {
      endDateTime: event.end?.toISOString() || event.start.toISOString()
    });

    $q.notify({
      type: 'positive',
      message: 'Event resized successfully'
    });
  } catch (error) {
    console.error('Error resizing event:', error);
    revert();
    $q.notify({
      type: 'negative',
      message: 'Failed to resize event'
    });
  }
};

const handleEventCreated = async (newEvent: any) => {
  await loadEvents();
  showCreateDialog.value = false;
};

const handleEventUpdated = async (updatedEvent: any) => {
  await loadEvents();
  showDetailsDialog.value = false;
};

const handleEventDeleted = async (deletedEventId: string) => {
  await loadEvents();
  showDetailsDialog.value = false;
};

const handleDateSelect = (selectedDate: Date) => {
  currentDate.value = selectedDate;
  if (currentView.value !== 'timeGridDay') {
    currentView.value = 'timeGridDay';
  }
};

const handleSearch = (query: string) => {
  searchQuery.value = query;
};

const handleCategoryToggle = () => {
  // Already handled by composable, just refresh if needed
};

const handleEditCategory = (category: any) => {
  selectedCategory.value = category;
  showCategoryDialog.value = true;
};

const handleDeleteCategory = async (categoryId: number) => {
  $q.dialog({
    title: 'Delete Category',
    message: 'Are you sure you want to delete this category?',
    cancel: true,
    persistent: true
  }).onOk(async () => {
    await deleteCategoryComposable(categoryId);
    await loadEvents();
  });
};

const openAddCategoryDialog = () => {
  selectedCategory.value = null;
  showCategoryDialog.value = true;
};

const handleCategorySaved = async () => {
  await fetchCategories();
  showCategoryDialog.value = false;
};

const openSettings = () => {
  $q.notify({
    type: 'info',
    message: 'Calendar settings coming soon'
  });
};

// Lifecycle
onMounted(async () => {
  // Load categories first
  await fetchCategories();

  // Load events
  await loadEvents();

  // Subscribe to real-time updates
  realtimeChannel = subscribeToChanges((payload) => {
    console.log('Real-time update:', payload);
    loadEvents();
  });
});

onBeforeUnmount(() => {
  // Unsubscribe from real-time updates
  if (realtimeChannel) {
    realtimeChannel.unsubscribe();
  }
});
</script>

<style lang="scss" scoped>
.calendar-page {
  height: 100vh;
  background: #f5f5f5;
}

// Desktop Layout
.calendar-desktop {
  display: flex;
  flex-direction: column;
  height: 100%;

  .calendar-body {
    display: flex;
    flex: 1;
    overflow: hidden;

    .calendar-main {
      flex: 1;
      background: white;
      overflow: auto;
    }
  }
}

// Mobile Layout
.calendar-mobile {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
}

// Responsive
@media (max-width: 768px) {
  .calendar-desktop {
    display: none;
  }

  .calendar-mobile {
    display: flex;
  }
}

@media (min-width: 769px) {
  .calendar-desktop {
    display: flex;
  }

  .calendar-mobile {
    display: none;
  }
}
</style>