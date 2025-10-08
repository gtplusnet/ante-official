<template>
  <q-dialog
    v-model="showDialog"
    persistent
    maximized
    transition-show="slide-up"
    transition-hide="slide-down"
  >
    <q-card class="event-dialog">
      <!-- Header -->
      <q-card-section class="dialog-header">
        <div class="header-content">
          <div class="header-left">
            <q-icon name="event" size="24px" color="primary" />
            <span class="text-h6">{{ isEditing ? 'Edit Event' : 'New Event' }}</span>
          </div>
          <q-btn
            flat
            round
            dense
            icon="close"
            v-close-popup
          />
        </div>
      </q-card-section>

      <q-separator />

      <!-- Form Content -->
      <q-card-section class="dialog-body">
        <q-form @submit="handleSubmit" class="event-form">
          <!-- Title -->
          <div class="form-field">
            <q-input
              v-model="form.title"
              label="Title *"
              outlined
              dense
              :rules="[val => !!val || 'Title is required']"
              class="full-width"
            />
          </div>

          <!-- Date & Time -->
          <div class="form-field date-time-section">
            <div class="date-time-row">
              <q-input
                v-model="form.startDate"
                label="Start Date *"
                outlined
                dense
                type="date"
                class="date-input"
                :rules="[val => !!val || 'Start date is required']"
              />
              <q-input
                v-if="!form.allDay"
                v-model="form.startTime"
                label="Start Time"
                outlined
                dense
                type="time"
                class="time-input"
              />
            </div>

            <div class="date-time-row">
              <q-input
                v-model="form.endDate"
                label="End Date *"
                outlined
                dense
                type="date"
                class="date-input"
                :rules="[val => !!val || 'End date is required']"
              />
              <q-input
                v-if="!form.allDay"
                v-model="form.endTime"
                label="End Time"
                outlined
                dense
                type="time"
                class="time-input"
              />
            </div>

            <q-checkbox
              v-model="form.allDay"
              label="All day"
              dense
              class="all-day-checkbox"
            />
          </div>

          <!-- Location -->
          <div class="form-field">
            <q-input
              v-model="form.location"
              label="Location"
              outlined
              dense
              class="full-width"
            >
              <template v-slot:prepend>
                <q-icon name="location_on" size="20px" />
              </template>
            </q-input>
          </div>

          <!-- Category -->
          <div class="form-field">
            <q-select
              v-model="form.categoryId"
              :options="categoryOptions"
              option-value="id"
              option-label="name"
              label="Category"
              outlined
              dense
              emit-value
              map-options
              class="full-width"
            >
              <template v-slot:prepend>
                <q-icon name="label" size="20px" />
              </template>
              <template v-slot:option="scope">
                <q-item v-bind="scope.itemProps">
                  <q-item-section avatar>
                    <div
                      class="category-color-indicator"
                      :style="{ backgroundColor: scope.opt.colorCode }"
                    ></div>
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>{{ scope.opt.name }}</q-item-label>
                  </q-item-section>
                </q-item>
              </template>
            </q-select>
          </div>

          <!-- Color -->
          <div class="form-field">
            <div class="color-picker-label">Event Color</div>
            <div class="color-picker-grid">
              <div
                v-for="color in predefinedColors"
                :key="color"
                class="color-option"
                :class="{ 'selected': form.colorCode === color }"
                :style="{ backgroundColor: color }"
                @click="form.colorCode = color"
              >
                <q-icon
                  v-if="form.colorCode === color"
                  name="check"
                  color="white"
                  size="16px"
                />
              </div>
            </div>
          </div>

          <!-- Description -->
          <div class="form-field">
            <q-input
              v-model="form.description"
              label="Description"
              outlined
              dense
              type="textarea"
              rows="4"
              class="full-width"
            >
              <template v-slot:prepend>
                <q-icon name="notes" size="20px" />
              </template>
            </q-input>
          </div>

          <!-- Recurrence -->
          <div class="form-field">
            <q-expansion-item
              dense
              expand-separator
              icon="repeat"
              label="Recurrence"
              class="recurrence-expansion"
            >
              <q-card flat>
                <q-card-section class="recurrence-section">
                  <q-select
                    v-model="form.recurrenceType"
                    :options="recurrenceOptions"
                    label="Repeat"
                    outlined
                    dense
                    class="full-width q-mb-md"
                  />

                  <template v-if="form.recurrenceType !== 'none'">
                    <!-- Frequency -->
                    <div class="frequency-row q-mb-md">
                      <span class="frequency-label">Repeat every</span>
                      <q-input
                        v-model.number="form.frequency"
                        type="number"
                        outlined
                        dense
                        min="1"
                        class="frequency-input"
                      />
                      <span class="frequency-unit">{{ getFrequencyUnit(form.recurrenceType) }}</span>
                    </div>

                    <!-- Days of week (for weekly recurrence) -->
                    <div v-if="form.recurrenceType === 'weekly'" class="q-mb-md">
                      <div class="field-label">Repeat on</div>
                      <div class="days-of-week">
                        <q-btn
                          v-for="day in weekDays"
                          :key="day.value"
                          :label="day.short"
                          :outline="!form.byDay.includes(day.value)"
                          :unelevated="form.byDay.includes(day.value)"
                          color="primary"
                          size="sm"
                          @click="toggleDay(day.value)"
                          class="day-button"
                        />
                      </div>
                    </div>

                    <!-- End date -->
                    <div class="recurrence-end">
                      <q-radio
                        v-model="recurrenceEndType"
                        val="never"
                        label="Never"
                        dense
                      />
                      <q-radio
                        v-model="recurrenceEndType"
                        val="until"
                        label="On"
                        dense
                      />
                      <q-input
                        v-if="recurrenceEndType === 'until'"
                        v-model="form.until"
                        type="date"
                        outlined
                        dense
                        class="until-input"
                      />
                      <q-radio
                        v-model="recurrenceEndType"
                        val="count"
                        label="After"
                        dense
                      />
                      <q-input
                        v-if="recurrenceEndType === 'count'"
                        v-model.number="form.count"
                        type="number"
                        outlined
                        dense
                        min="1"
                        suffix="occurrences"
                        class="count-input"
                      />
                    </div>
                  </template>
                </q-card-section>
              </q-card>
            </q-expansion-item>
          </div>

          <!-- Visibility -->
          <div class="form-field">
            <q-select
              v-model="form.visibility"
              :options="visibilityOptions"
              label="Visibility"
              outlined
              dense
              class="full-width"
            >
              <template v-slot:prepend>
                <q-icon name="visibility" size="20px" />
              </template>
            </q-select>
          </div>
        </q-form>
      </q-card-section>

      <!-- Actions -->
      <q-card-section class="dialog-actions">
        <q-btn
          flat
          label="Cancel"
          v-close-popup
          class="q-mr-sm"
        />
        <q-btn
          unelevated
          color="primary"
          :label="isEditing ? 'Update' : 'Create'"
          :loading="loading"
          @click="handleSubmit"
        />
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useQuasar, date as qDate } from 'quasar';
import { useCalendarEvents } from 'src/composables/calendar/useCalendarEvents';
import { useCalendarCategories } from 'src/composables/calendar/useCalendarCategories';

// Props
interface Props {
  modelValue: boolean;
  event?: any;
  initialDate?: Date;
  initialEndDate?: Date | null;
  initialAllDay?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  event: null,
  initialDate: () => new Date(),
  initialEndDate: null,
  initialAllDay: false
});

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  'created': [event: any];
  'updated': [event: any];
}>();

// Composables
const $q = useQuasar();
const { createEvent, updateEvent } = useCalendarEvents();
const { categories, fetchCategories } = useCalendarCategories();

// State
const showDialog = ref(props.modelValue);
const loading = ref(false);
const recurrenceEndType = ref<'never' | 'until' | 'count'>('never');

// Predefined colors
const predefinedColors = [
  '#2196F3', '#4CAF50', '#FF9800', '#E91E63', '#9C27B0',
  '#00BCD4', '#FFC107', '#795548', '#607D8B', '#F44336',
  '#8BC34A', '#03A9F4', '#FF5722', '#673AB7', '#009688'
];

// Week days
const weekDays = [
  { value: 'SU', short: 'S', full: 'Sunday' },
  { value: 'MO', short: 'M', full: 'Monday' },
  { value: 'TU', short: 'T', full: 'Tuesday' },
  { value: 'WE', short: 'W', full: 'Wednesday' },
  { value: 'TH', short: 'T', full: 'Thursday' },
  { value: 'FR', short: 'F', full: 'Friday' },
  { value: 'SA', short: 'S', full: 'Saturday' }
];

// Form
const form = ref({
  title: '',
  description: '',
  location: '',
  startDate: '',
  startTime: '09:00',
  endDate: '',
  endTime: '10:00',
  allDay: false,
  colorCode: '#2196F3',
  categoryId: null as number | null,
  visibility: 'private',
  recurrenceType: 'none',
  frequency: 1,
  byDay: [] as string[],
  until: '',
  count: null as number | null
});

// Computed
const isEditing = computed(() => !!props.event);

const categoryOptions = computed(() => categories.value);

const recurrenceOptions = [
  { label: 'Does not repeat', value: 'none' },
  { label: 'Daily', value: 'daily' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' },
  { label: 'Yearly', value: 'yearly' }
];

const visibilityOptions = [
  { label: 'Private', value: 'private' },
  { label: 'Public', value: 'public' }
];

// Methods
const getFrequencyUnit = (type: string): string => {
  switch (type) {
    case 'daily': return 'day(s)';
    case 'weekly': return 'week(s)';
    case 'monthly': return 'month(s)';
    case 'yearly': return 'year(s)';
    default: return '';
  }
};

const toggleDay = (day: string) => {
  const index = form.value.byDay.indexOf(day);
  if (index > -1) {
    form.value.byDay.splice(index, 1);
  } else {
    form.value.byDay.push(day);
  }
};

const initializeForm = () => {
  if (props.event) {
    // Edit mode
    const event = props.event;
    const startDate = new Date(event.startDateTime);
    const endDate = new Date(event.endDateTime);

    form.value = {
      title: event.title || '',
      description: event.description || '',
      location: event.location || '',
      startDate: qDate.formatDate(startDate, 'YYYY-MM-DD'),
      startTime: qDate.formatDate(startDate, 'HH:mm'),
      endDate: qDate.formatDate(endDate, 'YYYY-MM-DD'),
      endTime: qDate.formatDate(endDate, 'HH:mm'),
      allDay: event.allDay || false,
      colorCode: event.colorCode || '#2196F3',
      categoryId: event.categoryId || null,
      visibility: event.visibility || 'private',
      recurrenceType: 'none',
      frequency: 1,
      byDay: [],
      until: '',
      count: null
    };
  } else {
    // Create mode
    const startDate = props.initialDate || new Date();
    const endDate = props.initialEndDate || qDate.addToDate(startDate, { hours: 1 });

    form.value = {
      title: '',
      description: '',
      location: '',
      startDate: qDate.formatDate(startDate, 'YYYY-MM-DD'),
      startTime: qDate.formatDate(startDate, 'HH:mm'),
      endDate: qDate.formatDate(endDate, 'YYYY-MM-DD'),
      endTime: qDate.formatDate(endDate, 'HH:mm'),
      allDay: props.initialAllDay,
      colorCode: '#2196F3',
      categoryId: null,
      visibility: 'private',
      recurrenceType: 'none',
      frequency: 1,
      byDay: [],
      until: '',
      count: null
    };
  }
};

const handleSubmit = async () => {
  if (!form.value.title) {
    $q.notify({
      type: 'negative',
      message: 'Please enter a title'
    });
    return;
  }

  loading.value = true;

  try {
    // Construct datetime strings
    const startDateTime = form.value.allDay
      ? new Date(`${form.value.startDate}T00:00:00`).toISOString()
      : new Date(`${form.value.startDate}T${form.value.startTime}:00`).toISOString();

    const endDateTime = form.value.allDay
      ? new Date(`${form.value.endDate}T23:59:59`).toISOString()
      : new Date(`${form.value.endDate}T${form.value.endTime}:00`).toISOString();

    const eventData = {
      title: form.value.title,
      description: form.value.description || null,
      location: form.value.location || null,
      startDateTime,
      endDateTime,
      allDay: form.value.allDay,
      colorCode: form.value.colorCode,
      categoryId: form.value.categoryId,
      visibility: form.value.visibility
    };

    if (isEditing.value) {
      await updateEvent(props.event.id, eventData);
      $q.notify({
        type: 'positive',
        message: 'Event updated successfully'
      });
      emit('updated', eventData);
    } else {
      const newEvent = await createEvent(eventData);
      $q.notify({
        type: 'positive',
        message: 'Event created successfully'
      });
      emit('created', newEvent);
    }

    showDialog.value = false;
  } catch (error) {
    console.error('Error saving event:', error);
    $q.notify({
      type: 'negative',
      message: 'Failed to save event'
    });
  } finally {
    loading.value = false;
  }
};

// Watchers
watch(() => props.modelValue, (val) => {
  showDialog.value = val;
  if (val) {
    initializeForm();
  }
});

watch(showDialog, (val) => {
  emit('update:modelValue', val);
});

// Lifecycle
onMounted(async () => {
  await fetchCategories();
  initializeForm();
});
</script>

<style lang="scss" scoped>
.event-dialog {
  display: flex;
  flex-direction: column;
  max-width: 600px;
  margin: auto;

  .dialog-header {
    background: white;
    padding: 16px;

    .header-content {
      display: flex;
      align-items: center;
      justify-content: space-between;

      .header-left {
        display: flex;
        align-items: center;
        gap: 12px;
      }
    }
  }

  .dialog-body {
    flex: 1;
    overflow-y: auto;
    padding: 24px;

    .event-form {
      .form-field {
        margin-bottom: 16px;

        &:last-child {
          margin-bottom: 0;
        }
      }

      .date-time-section {
        .date-time-row {
          display: flex;
          gap: 12px;
          margin-bottom: 12px;

          .date-input {
            flex: 1;
          }

          .time-input {
            width: 120px;
          }
        }

        .all-day-checkbox {
          margin-left: 4px;
        }
      }

      .color-picker-label {
        font-size: 0.875rem;
        color: rgba(0, 0, 0, 0.6);
        margin-bottom: 8px;
      }

      .color-picker-grid {
        display: grid;
        grid-template-columns: repeat(10, 1fr);
        gap: 8px;

        .color-option {
          aspect-ratio: 1;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.2s;
          border: 2px solid transparent;

          &:hover {
            transform: scale(1.1);
          }

          &.selected {
            border-color: rgba(0, 0, 0, 0.2);
            transform: scale(1.15);
          }
        }
      }

      .category-color-indicator {
        width: 16px;
        height: 16px;
        border-radius: 2px;
      }

      .recurrence-section {
        padding: 16px;

        .frequency-row {
          display: flex;
          align-items: center;
          gap: 12px;

          .frequency-label,
          .frequency-unit {
            font-size: 0.875rem;
            color: rgba(0, 0, 0, 0.6);
          }

          .frequency-input {
            width: 80px;
          }
        }

        .field-label {
          font-size: 0.875rem;
          color: rgba(0, 0, 0, 0.6);
          margin-bottom: 8px;
        }

        .days-of-week {
          display: flex;
          gap: 8px;

          .day-button {
            min-width: 40px;
            padding: 4px 8px;
          }
        }

        .recurrence-end {
          display: flex;
          flex-direction: column;
          gap: 12px;

          .until-input,
          .count-input {
            margin-left: 32px;
            max-width: 200px;
          }
        }
      }
    }
  }

  .dialog-actions {
    padding: 16px 24px;
    display: flex;
    justify-content: flex-end;
    border-top: 1px solid rgba(0, 0, 0, 0.08);
  }
}

// Mobile responsiveness
@media (max-width: 768px) {
  .event-dialog {
    .color-picker-grid {
      grid-template-columns: repeat(5, 1fr);
    }

    .date-time-row {
      flex-direction: column;

      .time-input {
        width: 100% !important;
      }
    }
  }
}
</style>
