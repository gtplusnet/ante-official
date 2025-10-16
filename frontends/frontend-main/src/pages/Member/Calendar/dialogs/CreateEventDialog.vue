<template>
  <q-dialog
    v-model="showDialog"
    persistent
    transition-show="scale"
    transition-hide="scale"
  >
    <q-card class="event-dialog" style="min-width: 600px; max-width: 800px">
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
              <template v-slot:append>
                <div
                  v-if="form.categoryId"
                  class="event-color-preview"
                  :style="{ backgroundColor: form.colorCode }"
                  title="Event color (auto-assigned from category)"
                ></div>
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

          <!-- Description -->
          <div class="form-field">
            <q-input
              v-model="form.description"
              label="Description"
              outlined
              dense
              type="textarea"
              rows="3"
              class="full-width"
            >
              <template v-slot:prepend>
                <q-icon name="notes" size="20px" />
              </template>
            </q-input>
          </div>

          <!-- Advanced Options (Collapsible) -->
          <q-expansion-item
            class="advanced-options"
            dense
            dense-toggle
            expand-separator
            icon="tune"
            label="Advanced options"
            header-class="text-grey-7"
          >
            <q-card flat>
              <q-card-section class="q-pt-md">
                <!-- Recurrence -->
                <div class="form-field">
                  <RecurrenceSelector
                    v-model="form.recurrence"
                    :event-start-date="eventStartDate"
                  />
                </div>

                <!-- Visibility -->
                <div class="form-field q-mb-none">
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
              </q-card-section>
            </q-card>
          </q-expansion-item>
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
import RecurrenceSelector from '../components/RecurrenceSelector.vue';

// Props
interface Props {
  modelValue: boolean;
  event?: any;
  initialDate?: Date;
  initialEndDate?: Date | null;
  initialAllDay?: boolean;
  prefillData?: any; // Data from quick create
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  event: null,
  initialDate: () => new Date(),
  initialEndDate: null,
  initialAllDay: false,
  prefillData: null
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
  recurrence: null as any // Recurrence data from RecurrenceSelector
});

// Computed
const isEditing = computed(() => !!props.event);

const categoryOptions = computed(() => categories.value);

const eventStartDate = computed(() => {
  if (!form.value.startDate) return new Date();
  return new Date(`${form.value.startDate}T${form.value.startTime || '09:00'}:00`);
});

const visibilityOptions = [
  { label: 'Private', value: 'private' },
  { label: 'Public', value: 'public' }
];

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
      recurrence: event.recurrence || null
    };
  } else if (props.prefillData) {
    // Prefill from quick create
    const startDate = new Date(props.prefillData.date);
    const endDate = qDate.addToDate(startDate, { hours: 1 });

    form.value = {
      title: props.prefillData.title || '',
      description: '',
      location: '',
      startDate: props.prefillData.date,
      startTime: props.prefillData.time || qDate.formatDate(startDate, 'HH:mm'),
      endDate: qDate.formatDate(endDate, 'YYYY-MM-DD'),
      endTime: qDate.formatDate(qDate.addToDate(new Date(`${props.prefillData.date}T${props.prefillData.time || '09:00'}`), { hours: 1 }), 'HH:mm'),
      allDay: props.prefillData.allDay || false,
      colorCode: '#2196F3',
      categoryId: props.prefillData.categoryId || null,
      visibility: 'private',
      recurrence: null
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
      recurrence: null
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

    const eventData: any = {
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

    // Add recurrence data if provided
    if (form.value.recurrence) {
      eventData.recurrence = form.value.recurrence;
    }

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

// Auto-assign color when category changes
watch(() => form.value.categoryId, (newCategoryId) => {
  if (newCategoryId) {
    const selectedCategory = categories.value.find(c => c.id === newCategoryId);
    if (selectedCategory) {
      form.value.colorCode = selectedCategory.colorCode;
    }
  } else {
    // Default color when no category selected
    form.value.colorCode = '#2196F3';
  }
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

  .dialog-header {
    background: white;
    padding: 16px 24px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.08);

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
    max-height: 70vh;
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

      .category-color-indicator {
        width: 16px;
        height: 16px;
        border-radius: 2px;
      }

      .event-color-preview {
        width: 20px;
        height: 20px;
        border-radius: 50%;
        border: 2px solid rgba(0, 0, 0, 0.1);
      }

      .advanced-options {
        margin-top: 8px;
        border: 1px solid rgba(0, 0, 0, 0.08);
        border-radius: 4px;
        background: #fafafa;

        :deep(.q-item) {
          padding: 8px 12px;
          min-height: 40px;
        }

        :deep(.q-card) {
          background: white;
        }
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
    .date-time-row {
      flex-direction: column;

      .time-input {
        width: 100% !important;
      }
    }
  }
}
</style>
