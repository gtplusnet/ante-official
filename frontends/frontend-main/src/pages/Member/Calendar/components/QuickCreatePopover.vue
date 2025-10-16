<template>
  <q-menu
    v-model="showPopover"
    anchor="top middle"
    self="center middle"
    :offset="[0, 10]"
    @hide="resetForm"
  >
    <q-card style="min-width: 400px; max-width: 500px">
      <q-card-section class="q-pb-none">
        <div class="text-subtitle1 text-weight-medium">
          <q-icon name="event" size="20px" color="primary" class="q-mr-xs" />
          Quick Create Event
        </div>
      </q-card-section>

      <q-card-section>
        <q-form @submit.prevent="handleCreate" class="q-gutter-md">
          <!-- Title -->
          <q-input
            ref="titleInputRef"
            v-model="form.title"
            label="Event title *"
            outlined
            dense
            autofocus
            :rules="[val => !!val || 'Title is required']"
            @keydown.esc="showPopover = false"
          >
            <template v-slot:prepend>
              <q-icon name="edit" size="18px" />
            </template>
          </q-input>

          <!-- Date & Time Row -->
          <div class="row q-col-gutter-sm">
            <div class="col-7">
              <q-input
                v-model="form.date"
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
                v-model="form.time"
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
            v-model="form.categoryId"
            :options="categoryOptions"
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
                v-if="form.categoryId"
                class="color-indicator"
                :style="{ backgroundColor: selectedCategoryColor }"
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
            v-model="form.allDay"
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
              @click="openFullDialog"
            />
            <q-btn
              unelevated
              label="Create"
              color="primary"
              type="submit"
              size="sm"
              :loading="loading"
            />
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-menu>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue';
import { useQuasar, date as qDate } from 'quasar';
import { useCalendarEvents } from 'src/composables/calendar/useCalendarEvents';
import { useCalendarCategories } from 'src/composables/calendar/useCalendarCategories';

// Props
interface Props {
  modelValue: boolean;
  initialDate?: Date;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  initialDate: () => new Date()
});

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  'created': [event: any];
  'openFullDialog': [formData: any];
}>();

// Composables
const $q = useQuasar();
const { createEvent } = useCalendarEvents();
const { categories, fetchCategories } = useCalendarCategories();

// State
const showPopover = ref(props.modelValue);
const loading = ref(false);
const titleInputRef = ref<any>(null);

// Form
const form = ref({
  title: '',
  date: qDate.formatDate(props.initialDate, 'YYYY-MM-DD'),
  time: qDate.formatDate(new Date(), 'HH:00'), // Round to nearest hour
  categoryId: null as number | null,
  allDay: false
});

// Computed
const categoryOptions = computed(() => categories.value);

const selectedCategoryColor = computed(() => {
  const category = categories.value.find(c => c.id === form.value.categoryId);
  return category?.colorCode || '#2196F3';
});

// Methods
const resetForm = () => {
  form.value = {
    title: '',
    date: qDate.formatDate(props.initialDate, 'YYYY-MM-DD'),
    time: qDate.formatDate(new Date(), 'HH:00'),
    categoryId: null,
    allDay: false
  };
};

const handleCreate = async () => {
  if (!form.value.title || !form.value.date) {
    $q.notify({
      type: 'negative',
      message: 'Please fill in required fields'
    });
    return;
  }

  loading.value = true;

  try {
    // Build datetime
    const startDateTime = form.value.allDay
      ? new Date(`${form.value.date}T00:00:00`).toISOString()
      : new Date(`${form.value.date}T${form.value.time || '09:00'}:00`).toISOString();

    const endDateTime = form.value.allDay
      ? new Date(`${form.value.date}T23:59:59`).toISOString()
      : qDate.addToDate(new Date(startDateTime), { hours: 1 }).toISOString();

    const eventData = {
      title: form.value.title,
      startDateTime,
      endDateTime,
      allDay: form.value.allDay,
      colorCode: selectedCategoryColor.value,
      categoryId: form.value.categoryId,
      visibility: 'private'
    };

    const newEvent = await createEvent(eventData);

    if (newEvent) {
      $q.notify({
        type: 'positive',
        message: 'Event created successfully',
        icon: 'check_circle'
      });

      emit('created', newEvent);
      showPopover.value = false;
      resetForm();
    }
  } catch (error) {
    console.error('Error creating event:', error);
    $q.notify({
      type: 'negative',
      message: 'Failed to create event'
    });
  } finally {
    loading.value = false;
  }
};

const openFullDialog = () => {
  // Pass current form data to full dialog
  const formData = {
    title: form.value.title,
    date: form.value.date,
    time: form.value.time,
    categoryId: form.value.categoryId,
    allDay: form.value.allDay
  };

  emit('openFullDialog', formData);
  showPopover.value = false;
};

// Watchers
watch(() => props.modelValue, (val) => {
  showPopover.value = val;
  if (val) {
    // Focus title input when popover opens
    nextTick(() => {
      titleInputRef.value?.focus();
    });
  }
});

watch(showPopover, (val) => {
  emit('update:modelValue', val);
});

watch(() => props.initialDate, (newDate) => {
  form.value.date = qDate.formatDate(newDate, 'YYYY-MM-DD');
});

// Load categories on mount
fetchCategories();
</script>

<style scoped>
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
