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
        @create-event="openQuickCreate"
        @search="handleSearch"
        @export-calendar="openExportDialog"
        @import-calendar="openImportDialog"
      />

      <div class="calendar-body">
        <!-- Left Sidebar -->
        <CalendarSidebar
          v-if="sidebarVisible"
          :selected-date="currentDate"
          :events="events"
          :show-other-calendars="false"
          @date-select="handleDateSelect"
          @create-event="openQuickCreate"
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

    <!-- Quick Create Menu (positioned at center of screen) -->
    <q-dialog v-model="showQuickCreate" position="top">
      <q-card style="min-width: 400px; max-width: 500px; margin-top: 100px;">
        <q-card-section class="q-pb-none">
          <div class="text-subtitle1 text-weight-medium">
            <q-icon name="event" size="20px" color="primary" class="q-mr-xs" />
            Quick Create Event
          </div>
        </q-card-section>

        <q-card-section>
          <q-form @submit.prevent="handleQuickCreateSubmit" class="q-gutter-md">
            <!-- Title -->
            <q-input
              v-model="quickCreateForm.title"
              label="Event title *"
              outlined
              dense
              autofocus
              :rules="[val => !!val || 'Title is required']"
            >
              <template v-slot:prepend>
                <q-icon name="edit" size="18px" />
              </template>
            </q-input>

            <!-- Date & Time Row -->
            <div class="row q-col-gutter-sm">
              <div class="col-7">
                <q-input
                  v-model="quickCreateForm.date"
                  label="Date *"
                  outlined
                  dense
                  type="date"
                  :rules="[val => !!val || 'Date is required']"
                >
                  <template v-slot:prepend>
                    <q-icon name="calendar_today" size="18px" />
                  </template>
                </q-input>
              </div>
              <div class="col-5">
                <q-input
                  v-model="quickCreateForm.time"
                  label="Time"
                  outlined
                  dense
                  type="time"
                >
                  <template v-slot:prepend>
                    <q-icon name="schedule" size="18px" />
                  </template>
                </q-input>
              </div>
            </div>

            <!-- Category -->
            <q-select
              v-model="quickCreateForm.categoryId"
              :options="categories"
              option-value="id"
              option-label="name"
              label="Category"
              outlined
              dense
              emit-value
              map-options
            >
              <template v-slot:prepend>
                <q-icon name="label" size="18px" />
              </template>
              <template v-slot:append>
                <div
                  v-if="quickCreateForm.categoryId"
                  class="color-indicator"
                  :style="{ backgroundColor: selectedQuickCategoryColor }"
                ></div>
              </template>
              <template v-slot:option="scope">
                <q-item v-bind="scope.itemProps">
                  <q-item-section avatar>
                    <div
                      class="category-color-dot"
                      :style="{ backgroundColor: scope.opt.colorCode }"
                    ></div>
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>{{ scope.opt.name }}</q-item-label>
                  </q-item-section>
                </q-item>
              </template>
            </q-select>

            <!-- All day checkbox -->
            <q-checkbox
              v-model="quickCreateForm.allDay"
              label="All day event"
              dense
              size="sm"
            />

            <!-- Actions -->
            <div class="row q-gutter-sm justify-end">
              <q-btn
                flat
                label="More options"
                color="primary"
                size="sm"
                @click="openFullDialogFromQuickCreate"
              />
              <q-btn
                unelevated
                label="Create"
                color="primary"
                type="submit"
                size="sm"
                :loading="quickCreateLoading"
              />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- Dialogs (Lazy Loaded) -->
    <CreateEventDialog
      v-if="showCreateDialog"
      v-model="showCreateDialog"
      :initial-date="selectedDialogDate"
      :initial-end-date="selectedDialogEndDate"
      :initial-all-day="selectedAllDay"
      :prefill-data="prefillData"
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

    <ImportCalendarDialog
      v-if="showImportDialog"
      v-model="showImportDialog"
      @imported="handleCalendarImported"
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
import { useCalendarIntegration } from 'src/composables/calendar/useCalendarIntegration';
import { useCalendarExport } from 'src/composables/calendar/useCalendarExport';
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

const ImportCalendarDialog = defineAsyncComponent(() =>
  import('./dialogs/ImportCalendarDialog.vue')
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

const {
  fetchAllIntegratedEvents,
  getIntegratedFullCalendarEvents,
  loading: integratedLoading
} = useCalendarIntegration();

const { exportDateRange } = useCalendarExport();

// State
const currentView = ref('dayGridMonth');
const currentDate = ref(new Date());
const sidebarVisible = ref(true);
const searchQuery = ref('');

// Dialog states
const showQuickCreate = ref(false);
const showCreateDialog = ref(false);
const showDetailsDialog = ref(false);
const showCategoryDialog = ref(false);
const showImportDialog = ref(false);

// Selected data
const selectedEvent = ref<any>(null);
const selectedCategory = ref<any>(null);
const selectedDialogDate = ref<Date>(new Date());
const selectedDialogEndDate = ref<Date | null>(null);
const selectedAllDay = ref(false);
const prefillData = ref<any>(null);

// Quick Create state
const quickCreateLoading = ref(false);
const quickCreateForm = ref({
  title: '',
  date: date.formatDate(new Date(), 'YYYY-MM-DD'),
  time: date.formatDate(new Date(), 'HH:00'),
  categoryId: null as number | null,
  allDay: false
});

// Refs
const calendarViewRef = ref<any>(null);

// Real-time subscription
let realtimeChannel: any = null;

// Computed
const fullCalendarEvents = computed(() => {
  // Filter regular calendar events by category
  const filteredByCategory = events.value.filter(event =>
    !event.categoryId || selectedCategories.value.includes(event.categoryId)
  );

  const filteredBySearch = searchQuery.value
    ? filteredByCategory.filter(event =>
        event.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
        event.description?.toLowerCase().includes(searchQuery.value.toLowerCase())
      )
    : filteredByCategory;

  const regularEvents = getFullCalendarEvents.value.filter(fcEvent => {
    const originalEvent = filteredBySearch.find(e => e.id === fcEvent.id);
    return !!originalEvent;
  });

  // Merge with integrated events (tasks, shifts, leaves, projects, holidays)
  const integratedEvents = getIntegratedFullCalendarEvents.value;

  // Filter integrated events by search query if present
  const filteredIntegratedEvents = searchQuery.value
    ? integratedEvents.filter(event =>
        event.title.toLowerCase().includes(searchQuery.value.toLowerCase())
      )
    : integratedEvents;

  return [...regularEvents, ...filteredIntegratedEvents];
});

const filteredEvents = computed(() => {
  return events.value.filter(event =>
    !event.categoryId || selectedCategories.value.includes(event.categoryId)
  );
});

const selectedQuickCategoryColor = computed(() => {
  const category = categories.value.find(c => c.id === quickCreateForm.value.categoryId);
  return category?.colorCode || '#2196F3';
});

// Methods
const loadEvents = async () => {
  const startDate = getStartDateForView();
  const endDate = getEndDateForView();

  // Load both regular calendar events and integrated events in parallel
  await Promise.all([
    fetchEvents(startDate, endDate),
    fetchAllIntegratedEvents(startDate, endDate)
  ]);
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
const openQuickCreate = (initialDate?: Date) => {
  selectedDialogDate.value = initialDate || new Date();
  quickCreateForm.value.date = date.formatDate(initialDate || new Date(), 'YYYY-MM-DD');
  quickCreateForm.value.time = date.formatDate(new Date(), 'HH:00');
  showQuickCreate.value = true;
};

const openCreateEventDialog = (initialDate?: Date, allDay = false) => {
  selectedDialogDate.value = initialDate || new Date();
  selectedAllDay.value = allDay;
  prefillData.value = null; // Reset prefill data
  showCreateDialog.value = true;
};

const handleQuickCreateSubmit = async () => {
  if (!quickCreateForm.value.title || !quickCreateForm.value.date) {
    $q.notify({
      type: 'negative',
      message: 'Please fill in required fields'
    });
    return;
  }

  quickCreateLoading.value = true;

  try {
    const startDateTime = quickCreateForm.value.allDay
      ? new Date(`${quickCreateForm.value.date}T00:00:00`).toISOString()
      : new Date(`${quickCreateForm.value.date}T${quickCreateForm.value.time || '09:00'}:00`).toISOString();

    const endDateTime = quickCreateForm.value.allDay
      ? new Date(`${quickCreateForm.value.date}T23:59:59`).toISOString()
      : date.addToDate(new Date(startDateTime), { hours: 1 }).toISOString();

    const eventData = {
      title: quickCreateForm.value.title,
      startDateTime,
      endDateTime,
      allDay: quickCreateForm.value.allDay,
      colorCode: selectedQuickCategoryColor.value,
      categoryId: quickCreateForm.value.categoryId,
      visibility: 'private'
    };

    await createEvent(eventData);

    $q.notify({
      type: 'positive',
      message: 'Event created successfully',
      icon: 'check_circle'
    });

    // Reset form and close
    quickCreateForm.value = {
      title: '',
      date: date.formatDate(new Date(), 'YYYY-MM-DD'),
      time: date.formatDate(new Date(), 'HH:00'),
      categoryId: null,
      allDay: false
    };
    showQuickCreate.value = false;

    // Reload events
    await loadEvents();
  } catch (error) {
    console.error('Error creating event:', error);
    $q.notify({
      type: 'negative',
      message: 'Failed to create event'
    });
  } finally {
    quickCreateLoading.value = false;
  }
};

const openFullDialogFromQuickCreate = () => {
  // Transfer data from quick create to full dialog
  prefillData.value = {
    title: quickCreateForm.value.title,
    date: quickCreateForm.value.date,
    time: quickCreateForm.value.time,
    categoryId: quickCreateForm.value.categoryId,
    allDay: quickCreateForm.value.allDay
  };
  selectedDialogDate.value = new Date(quickCreateForm.value.date);
  selectedAllDay.value = quickCreateForm.value.allDay;
  showQuickCreate.value = false;
  showCreateDialog.value = true;
};

const handleEventClick = (event: any) => {
  // Check if this is an integrated event (task, shift, leave, project, holiday)
  if (event.extendedProps?.isIntegrated) {
    // For integrated events, we'll show a simple info dialog
    // You can enhance this later with a dedicated integrated event details dialog
    const sourceType = event.extendedProps.sourceType;
    const sourceData = event.extendedProps.sourceData;

    $q.dialog({
      title: event.title,
      message: `Type: ${sourceType}\n\nThis is a ${sourceType} event. Detailed view coming soon.`,
      ok: 'Close'
    });
    return;
  }

  // Handle regular calendar events
  const originalEvent = events.value.find(e => e.id === event.id);
  if (originalEvent) {
    selectedEvent.value = originalEvent;
    showDetailsDialog.value = true;
  }
};

const handleDateClick = (clickedDate: Date, allDay: boolean) => {
  // Use quick create for single date clicks
  openQuickCreate(clickedDate);
};

const handleDateRangeSelect = (start: Date, end: Date, allDay: boolean) => {
  selectedDialogDate.value = start;
  selectedDialogEndDate.value = end;
  selectedAllDay.value = allDay;
  showCreateDialog.value = true;
};

const handleEventDrop = async (info: any) => {
  const { event, revert } = info;

  // Prevent moving integrated events (they're read-only)
  if (event.extendedProps?.isIntegrated) {
    revert();
    $q.notify({
      type: 'warning',
      message: 'Integrated events cannot be moved'
    });
    return;
  }

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

    // Reload events to reflect changes (especially for recurring events)
    await loadEvents();
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

  // Prevent resizing integrated events (they're read-only)
  if (event.extendedProps?.isIntegrated) {
    revert();
    $q.notify({
      type: 'warning',
      message: 'Integrated events cannot be resized'
    });
    return;
  }

  try {
    await updateEvent(event.id, {
      endDateTime: event.end?.toISOString() || event.start.toISOString()
    });

    $q.notify({
      type: 'positive',
      message: 'Event resized successfully'
    });

    // Reload events to reflect changes (especially for recurring events)
    await loadEvents();
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

const openExportDialog = async () => {
  try {
    const startDate = getStartDateForView();
    const endDate = getEndDateForView();

    // Get selected category IDs
    const categoryIds = selectedCategories.value.length > 0
      ? selectedCategories.value
      : undefined;

    await exportDateRange(
      { startDate, endDate, categoryIds },
      `calendar-${date.formatDate(new Date(), 'YYYY-MM-DD')}.ics`
    );
  } catch (error) {
    console.error('Error exporting calendar:', error);
  }
};

const openImportDialog = () => {
  showImportDialog.value = true;
};

const handleCalendarImported = async () => {
  // Reload events after import
  await loadEvents();
  $q.notify({
    type: 'positive',
    message: 'Calendar imported successfully'
  });
};

// Keyboard shortcuts
const handleKeyboardShortcut = (event: KeyboardEvent) => {
  // Shift+C: Quick create event
  if (event.shiftKey && event.key.toLowerCase() === 'c') {
    event.preventDefault();
    openQuickCreate();
  }
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

  // Add keyboard shortcut listener
  window.addEventListener('keydown', handleKeyboardShortcut);
});

onBeforeUnmount(() => {
  // Unsubscribe from real-time updates
  if (realtimeChannel) {
    realtimeChannel.unsubscribe();
  }

  // Remove keyboard shortcut listener
  window.removeEventListener('keydown', handleKeyboardShortcut);
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

// Quick Create styles
.color-indicator {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid rgba(0, 0, 0, 0.1);
}

.category-color-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}
</style>