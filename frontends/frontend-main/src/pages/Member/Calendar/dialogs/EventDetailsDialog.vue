<template>
  <q-dialog
    v-model="showDialog"
    transition-show="slide-up"
    transition-hide="slide-down"
  >
    <q-card class="event-details-dialog">
      <!-- Header with color indicator -->
      <div class="event-header" :style="{ borderLeftColor: event?.colorCode || '#2196F3' }">
        <div class="header-content">
          <div class="header-left">
            <div class="event-color-dot" :style="{ backgroundColor: event?.colorCode || '#2196F3' }"></div>
            <div>
              <div class="event-title">{{ event?.title || 'Event' }}</div>
              <div class="event-date-time">{{ formattedDateTime }}</div>
            </div>
          </div>
          <div class="header-actions">
            <q-btn
              flat
              round
              dense
              icon="edit"
              @click="handleEdit"
            >
              <q-tooltip>Edit</q-tooltip>
            </q-btn>
            <q-btn
              flat
              round
              dense
              icon="delete"
              @click="handleDelete"
            >
              <q-tooltip>Delete</q-tooltip>
            </q-btn>
            <q-btn
              flat
              round
              dense
              icon="close"
              v-close-popup
            />
          </div>
        </div>
      </div>

      <q-separator />

      <!-- Details -->
      <q-card-section class="event-details">
        <!-- Date & Time -->
        <div class="detail-row">
          <q-icon name="schedule" size="20px" class="detail-icon" />
          <div class="detail-content">
            <div class="detail-label">Time</div>
            <div class="detail-value">{{ formattedDateTimeRange }}</div>
          </div>
        </div>

        <!-- Location -->
        <div v-if="event?.location" class="detail-row">
          <q-icon name="location_on" size="20px" class="detail-icon" />
          <div class="detail-content">
            <div class="detail-label">Location</div>
            <div class="detail-value">{{ event.location }}</div>
          </div>
        </div>

        <!-- Category -->
        <div v-if="event?.category" class="detail-row">
          <q-icon name="label" size="20px" class="detail-icon" />
          <div class="detail-content">
            <div class="detail-label">Category</div>
            <div class="detail-value">
              <div class="category-badge">
                <div
                  class="category-color-indicator"
                  :style="{ backgroundColor: event.category.colorCode }"
                ></div>
                {{ event.category.name }}
              </div>
            </div>
          </div>
        </div>

        <!-- Description -->
        <div v-if="event?.description" class="detail-row">
          <q-icon name="notes" size="20px" class="detail-icon" />
          <div class="detail-content">
            <div class="detail-label">Description</div>
            <div class="detail-value description-text">{{ event.description }}</div>
          </div>
        </div>

        <!-- Visibility -->
        <div class="detail-row">
          <q-icon name="visibility" size="20px" class="detail-icon" />
          <div class="detail-content">
            <div class="detail-label">Visibility</div>
            <div class="detail-value">
              <q-chip dense size="sm" :color="event?.visibility === 'public' ? 'positive' : 'grey-5'">
                {{ event?.visibility === 'public' ? 'Public' : 'Private' }}
              </q-chip>
            </div>
          </div>
        </div>

        <!-- Recurrence -->
        <div v-if="event?.recurrence" class="detail-row">
          <q-icon name="repeat" size="20px" class="detail-icon" />
          <div class="detail-content">
            <div class="detail-label">Recurrence</div>
            <div class="detail-value">{{ formattedRecurrence }}</div>
          </div>
        </div>

        <!-- Created/Updated Info -->
        <div class="detail-row metadata-row">
          <q-icon name="info" size="20px" class="detail-icon" />
          <div class="detail-content">
            <div class="detail-label">Created</div>
            <div class="detail-value text-caption">
              {{ formatDate(event?.createdAt) }}
              <span v-if="event?.updatedAt && event.updatedAt !== event.createdAt">
                • Updated {{ formatDate(event.updatedAt) }}
              </span>
            </div>
          </div>
        </div>
      </q-card-section>

      <!-- Actions -->
      <q-card-actions align="right" class="dialog-actions">
        <q-btn
          flat
          label="Close"
          v-close-popup
        />
      </q-card-actions>
    </q-card>
  </q-dialog>

  <!-- Edit Dialog -->
  <CreateEventDialog
    v-if="showEditDialog"
    v-model="showEditDialog"
    :event="event"
    @updated="handleUpdated"
  />
</template>

<script setup lang="ts">
import { ref, computed, watch, defineAsyncComponent } from 'vue';
import { useQuasar, date as qDate } from 'quasar';
import { useCalendarEvents } from 'src/composables/calendar/useCalendarEvents';

// Lazy load CreateEventDialog
const CreateEventDialog = defineAsyncComponent(() =>
  import('./CreateEventDialog.vue')
);

// Props
interface Props {
  modelValue: boolean;
  event: any;
}

const props = defineProps<Props>();

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  'updated': [event: any];
  'deleted': [eventId: string];
}>();

// Composables
const $q = useQuasar();
const { deleteEvent } = useCalendarEvents();

// State
const showDialog = ref(props.modelValue);
const showEditDialog = ref(false);

// Computed
const formattedDateTime = computed(() => {
  if (!props.event) return '';

  const startDate = new Date(props.event.startDateTime);

  if (props.event.allDay) {
    return qDate.formatDate(startDate, 'MMMM D, YYYY');
  }

  return qDate.formatDate(startDate, 'MMMM D, YYYY [at] h:mm A');
});

const formattedDateTimeRange = computed(() => {
  if (!props.event) return '';

  const startDate = new Date(props.event.startDateTime);
  const endDate = new Date(props.event.endDateTime);

  if (props.event.allDay) {
    const isSameDay = qDate.isSameDate(startDate, endDate, 'day');
    if (isSameDay) {
      return qDate.formatDate(startDate, 'MMMM D, YYYY') + ' (All day)';
    }
    return `${qDate.formatDate(startDate, 'MMM D')} - ${qDate.formatDate(endDate, 'MMM D, YYYY')} (All day)`;
  }

  const isSameDay = qDate.isSameDate(startDate, endDate, 'day');
  if (isSameDay) {
    return `${qDate.formatDate(startDate, 'MMMM D, YYYY')} • ${qDate.formatDate(startDate, 'h:mm A')} - ${qDate.formatDate(endDate, 'h:mm A')}`;
  }

  return `${qDate.formatDate(startDate, 'MMM D, h:mm A')} - ${qDate.formatDate(endDate, 'MMM D, h:mm A')}`;
});

const formattedRecurrence = computed(() => {
  if (!props.event?.recurrence) return '';

  const rec = props.event.recurrence;
  let text = '';

  switch (rec.recurrenceType) {
    case 'daily':
      text = rec.frequency === 1 ? 'Daily' : `Every ${rec.frequency} days`;
      break;
    case 'weekly':
      text = rec.frequency === 1 ? 'Weekly' : `Every ${rec.frequency} weeks`;
      if (rec.byDay && rec.byDay.length > 0) {
        text += ` on ${rec.byDay.join(', ')}`;
      }
      break;
    case 'monthly':
      text = rec.frequency === 1 ? 'Monthly' : `Every ${rec.frequency} months`;
      break;
    case 'yearly':
      text = rec.frequency === 1 ? 'Yearly' : `Every ${rec.frequency} years`;
      break;
  }

  if (rec.until) {
    text += ` until ${qDate.formatDate(new Date(rec.until), 'MMM D, YYYY')}`;
  } else if (rec.count) {
    text += ` for ${rec.count} occurrences`;
  }

  return text;
});

// Methods
const formatDate = (dateString?: string): string => {
  if (!dateString) return 'N/A';
  return qDate.formatDate(new Date(dateString), 'MMM D, YYYY [at] h:mm A');
};

const handleEdit = () => {
  showEditDialog.value = true;
};

const handleDelete = () => {
  $q.dialog({
    title: 'Delete Event',
    message: 'Are you sure you want to delete this event? This action cannot be undone.',
    cancel: true,
    persistent: true,
    ok: {
      label: 'Delete',
      color: 'negative',
      unelevated: true
    }
  }).onOk(async () => {
    try {
      await deleteEvent(props.event.id);
      $q.notify({
        type: 'positive',
        message: 'Event deleted successfully'
      });
      emit('deleted', props.event.id);
      showDialog.value = false;
    } catch (error) {
      console.error('Error deleting event:', error);
      $q.notify({
        type: 'negative',
        message: 'Failed to delete event'
      });
    }
  });
};

const handleUpdated = (updatedEvent: any) => {
  emit('updated', updatedEvent);
  showEditDialog.value = false;
  showDialog.value = false;
};

// Watchers
watch(() => props.modelValue, (val) => {
  showDialog.value = val;
});

watch(showDialog, (val) => {
  emit('update:modelValue', val);
});
</script>

<style lang="scss" scoped>
.event-details-dialog {
  width: 100%;
  max-width: 500px;

  .event-header {
    background: white;
    padding: 20px;
    border-left: 4px solid #2196F3;

    .header-content {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;

      .header-left {
        display: flex;
        gap: 12px;
        flex: 1;

        .event-color-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          margin-top: 4px;
          flex-shrink: 0;
        }

        .event-title {
          font-size: 1.25rem;
          font-weight: 500;
          color: rgba(0, 0, 0, 0.87);
          margin-bottom: 4px;
        }

        .event-date-time {
          font-size: 0.875rem;
          color: rgba(0, 0, 0, 0.6);
        }
      }

      .header-actions {
        display: flex;
        gap: 4px;
      }
    }
  }

  .event-details {
    padding: 24px;

    .detail-row {
      display: flex;
      gap: 16px;
      margin-bottom: 20px;

      &:last-child {
        margin-bottom: 0;
      }

      &.metadata-row {
        margin-top: 24px;
        padding-top: 24px;
        border-top: 1px solid rgba(0, 0, 0, 0.08);
      }

      .detail-icon {
        color: rgba(0, 0, 0, 0.54);
        flex-shrink: 0;
        margin-top: 2px;
      }

      .detail-content {
        flex: 1;

        .detail-label {
          font-size: 0.75rem;
          font-weight: 500;
          color: rgba(0, 0, 0, 0.54);
          text-transform: uppercase;
          margin-bottom: 4px;
        }

        .detail-value {
          font-size: 0.875rem;
          color: rgba(0, 0, 0, 0.87);
          line-height: 1.5;

          &.description-text {
            white-space: pre-wrap;
          }
        }

        .category-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 4px 12px;
          background: rgba(0, 0, 0, 0.04);
          border-radius: 16px;

          .category-color-indicator {
            width: 12px;
            height: 12px;
            border-radius: 2px;
          }
        }
      }
    }
  }

  .dialog-actions {
    padding: 12px 24px;
    border-top: 1px solid rgba(0, 0, 0, 0.08);
  }
}

// Mobile responsiveness
@media (max-width: 768px) {
  .event-details-dialog {
    .event-header {
      .header-content {
        flex-direction: column;
        gap: 12px;

        .header-actions {
          align-self: flex-end;
        }
      }
    }
  }
}
</style>
