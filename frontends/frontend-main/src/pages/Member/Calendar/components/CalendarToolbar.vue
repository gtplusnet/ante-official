<template>
  <div class="calendar-toolbar">
    <div class="toolbar-section toolbar-left">
      <!-- Menu Toggle -->
      <q-btn
        flat
        round
        dense
        icon="menu"
        size="md"
        class="q-mr-sm"
        @click="$emit('toggle-sidebar')"
      />

      <!-- Today Button -->
      <q-btn
        flat
        dense
        label="Today"
        class="today-btn"
        @click="goToToday"
      />

      <!-- Navigation -->
      <div class="navigation-controls q-ml-md">
        <q-btn
          flat
          round
          dense
          icon="chevron_left"
          size="sm"
          @click="navigatePrevious"
        />
        <q-btn
          flat
          round
          dense
          icon="chevron_right"
          size="sm"
          @click="navigateNext"
        />
      </div>

      <!-- Current Date Display -->
      <div class="current-date q-ml-md">
        <span class="text-h6">{{ formattedDate }}</span>
      </div>
    </div>

    <div class="toolbar-section toolbar-center">
      <!-- Search -->
      <q-input
        v-model="searchQuery"
        dense
        outlined
        rounded
        placeholder="Search events..."
        class="search-input"
        @update:model-value="handleSearch"
      >
        <template v-slot:prepend>
          <q-icon name="search" />
        </template>
      </q-input>
    </div>

    <div class="toolbar-section toolbar-right">
      <!-- View Selector -->
      <q-btn-dropdown
        flat
        dense
        :label="currentViewLabel"
        class="view-selector"
      >
        <q-list dense>
          <q-item
            v-for="view in viewOptions"
            :key="view.value"
            clickable
            v-close-popup
            @click="changeView(view.value)"
            :class="{ 'bg-primary-subtle': currentView === view.value }"
          >
            <q-item-section>
              <q-item-label>{{ view.label }}</q-item-label>
            </q-item-section>
            <q-item-section side v-if="currentView === view.value">
              <q-icon name="check" size="sm" />
            </q-item-section>
          </q-item>
        </q-list>
      </q-btn-dropdown>

      <!-- Settings -->
      <q-btn
        flat
        round
        dense
        icon="settings"
        size="md"
        class="q-ml-sm"
        @click="$emit('open-settings')"
      >
        <q-tooltip>Settings</q-tooltip>
      </q-btn>

      <!-- Create Event -->
      <q-btn
        unelevated
        rounded
        color="primary"
        label="Create"
        icon="add"
        class="q-ml-md create-btn"
        @click="$emit('create-event')"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { date } from 'quasar';

// Props
interface Props {
  modelValue: string; // Current view
  date: Date; // Current date
}

const props = defineProps<Props>();

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: string];
  'update:date': [value: Date];
  'toggle-sidebar': [];
  'open-settings': [];
  'create-event': [];
  'search': [query: string];
}>();

// Local state
const currentView = ref(props.modelValue);
const currentDate = ref(props.date);
const searchQuery = ref('');

// View options
const viewOptions = [
  { label: 'Day', value: 'timeGridDay' },
  { label: 'Week', value: 'timeGridWeek' },
  { label: 'Month', value: 'dayGridMonth' },
  { label: '4 Days', value: 'timeGrid4Day' },
  { label: 'Year', value: 'multiMonthYear' },
  { label: 'Schedule', value: 'listWeek' }
];

// Current view label
const currentViewLabel = computed(() => {
  const view = viewOptions.find(v => v.value === currentView.value);
  return view?.label || 'Month';
});

// Formatted date display
const formattedDate = computed(() => {
  const format = currentView.value === 'dayGridMonth'
    ? 'MMMM YYYY'
    : currentView.value === 'multiMonthYear'
    ? 'YYYY'
    : 'MMMM D, YYYY';
  return date.formatDate(currentDate.value, format);
});

// Methods
const goToToday = () => {
  const today = new Date();
  currentDate.value = today;
  emit('update:date', today);
};

const navigatePrevious = () => {
  let newDate = new Date(currentDate.value);

  switch (currentView.value) {
    case 'timeGridDay':
      newDate = date.subtractFromDate(newDate, { days: 1 });
      break;
    case 'timeGridWeek':
    case 'listWeek':
      newDate = date.subtractFromDate(newDate, { days: 7 });
      break;
    case 'dayGridMonth':
      newDate = date.subtractFromDate(newDate, { months: 1 });
      break;
    case 'multiMonthYear':
      newDate = date.subtractFromDate(newDate, { years: 1 });
      break;
    case 'timeGrid4Day':
      newDate = date.subtractFromDate(newDate, { days: 4 });
      break;
  }

  currentDate.value = newDate;
  emit('update:date', newDate);
};

const navigateNext = () => {
  let newDate = new Date(currentDate.value);

  switch (currentView.value) {
    case 'timeGridDay':
      newDate = date.addToDate(newDate, { days: 1 });
      break;
    case 'timeGridWeek':
    case 'listWeek':
      newDate = date.addToDate(newDate, { days: 7 });
      break;
    case 'dayGridMonth':
      newDate = date.addToDate(newDate, { months: 1 });
      break;
    case 'multiMonthYear':
      newDate = date.addToDate(newDate, { years: 1 });
      break;
    case 'timeGrid4Day':
      newDate = date.addToDate(newDate, { days: 4 });
      break;
  }

  currentDate.value = newDate;
  emit('update:date', newDate);
};

const changeView = (view: string) => {
  currentView.value = view;
  emit('update:modelValue', view);
};

const handleSearch = (query: string) => {
  emit('search', query);
};

// Watchers
watch(() => props.modelValue, (newVal) => {
  currentView.value = newVal;
});

watch(() => props.date, (newVal) => {
  currentDate.value = newVal;
});
</script>

<style lang="scss" scoped>
.calendar-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: white;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  min-height: 64px;

  .toolbar-section {
    display: flex;
    align-items: center;

    &.toolbar-left {
      flex: 0 0 auto;
    }

    &.toolbar-center {
      flex: 1;
      justify-content: center;
      padding: 0 16px;
    }

    &.toolbar-right {
      flex: 0 0 auto;
    }
  }

  .today-btn {
    padding: 6px 12px;
    font-weight: 500;
    border: 1px solid rgba(0, 0, 0, 0.12);

    &:hover {
      background: rgba(0, 0, 0, 0.04);
    }
  }

  .navigation-controls {
    display: flex;
    gap: 4px;
  }

  .current-date {
    font-weight: 400;
    color: rgba(0, 0, 0, 0.87);
  }

  .search-input {
    width: 300px;
    max-width: 100%;

    :deep(.q-field__control) {
      height: 36px;
    }
  }

  .view-selector {
    border: 1px solid rgba(0, 0, 0, 0.12);
    padding: 6px 12px;
    font-weight: 500;
    min-width: 100px;

    &:hover {
      background: rgba(0, 0, 0, 0.04);
    }
  }

  .create-btn {
    padding: 6px 16px;
    font-weight: 500;
  }
}

// Material Design 3 styling
.bg-primary-subtle {
  background: rgba(33, 150, 243, 0.08);
}

// Mobile responsiveness
@media (max-width: 768px) {
  .calendar-toolbar {
    flex-wrap: wrap;
    padding: 8px;

    .toolbar-section {
      &.toolbar-center {
        order: 3;
        width: 100%;
        padding: 8px 0 0;
      }

      &.toolbar-right {
        .view-selector {
          min-width: auto;
        }
      }
    }

    .search-input {
      width: 100%;
    }

    .current-date .text-h6 {
      font-size: 1rem;
    }
  }
}
</style>