<template>
  <q-dialog
    v-model="dialogModel"
    :maximized="$q.screen.lt.md"
    transition-show="slide-up"
    transition-hide="slide-down"
  >
    <q-card class="task-filter-dialog md3-dialog-dense">
      <!-- Dialog Header -->
      <q-card-section class="dialog-header">
        <div class="row items-center no-wrap">
          <div class="text-h6">Filter Tasks</div>
          <q-space />
          <q-btn
            icon="close"
            flat
            dense
            round
            @click="handleCancel"
          />
        </div>
      </q-card-section>

      <q-separator />

      <!-- Filter Content -->
      <q-card-section class="dialog-content q-pt-md">
        <div class="filter-grid">
          <!-- Priority Filter -->
          <div class="filter-item">
            <div class="filter-label">Priority</div>
            <q-select
              v-model="localFilters.priority"
              :options="priorityOptions"
              emit-value
              map-options
              outlined
              dense
              use-input
              input-debounce="0"
              class="filter-select"
            >
              <template v-slot:prepend>
                <q-icon name="flag" size="18px" />
              </template>
            </q-select>
          </div>

          <!-- Status Filter -->
          <div class="filter-item">
            <div class="filter-label">Status</div>
            <q-select
              v-model="localFilters.status"
              :options="statusOptions"
              emit-value
              map-options
              outlined
              dense
              use-input
              input-debounce="0"
              class="filter-select"
            >
              <template v-slot:prepend>
                <q-icon name="pending_actions" size="18px" />
              </template>
            </q-select>
          </div>

          <!-- Goal Filter -->
          <div class="filter-item">
            <div class="filter-label">Goal</div>
            <q-select
              v-model="localFilters.goal"
              :options="goalOptions"
              emit-value
              map-options
              outlined
              dense
              use-input
              input-debounce="0"
              class="filter-select"
            >
              <template v-slot:prepend>
                <q-icon name="emoji_events" size="18px" />
              </template>
            </q-select>
          </div>

          <!-- Assignee Filter -->
          <div class="filter-item">
            <div class="filter-label">Assignee</div>
            <q-select
              v-model="localFilters.assignee"
              :options="assigneeOptions"
              emit-value
              map-options
              outlined
              dense
              use-input
              input-debounce="0"
              class="filter-select"
            >
              <template v-slot:prepend>
                <q-icon name="person" size="18px" />
              </template>
            </q-select>
          </div>

          <!-- Project Filter -->
          <div class="filter-item">
            <div class="filter-label">Project</div>
            <q-select
              v-model="localFilters.project"
              :options="projectOptions"
              emit-value
              map-options
              outlined
              dense
              use-input
              input-debounce="0"
              class="filter-select"
            >
              <template v-slot:prepend>
                <q-icon name="folder" size="18px" />
              </template>
            </q-select>
          </div>

          <!-- Due Date Filter -->
          <div class="filter-item">
            <div class="filter-label">Due Date</div>
            <q-select
              v-model="localFilters.dueDate"
              :options="dueDateOptions"
              emit-value
              map-options
              outlined
              dense
              use-input
              input-debounce="0"
              class="filter-select"
            >
              <template v-slot:prepend>
                <q-icon name="event" size="18px" />
              </template>
            </q-select>
          </div>
        </div>

        <!-- Preview Count -->
        <div v-if="previewCount !== null" class="preview-count q-mt-md">
          <q-icon name="info" size="18px" class="q-mr-xs" />
          <span>{{ previewCount }} task{{ previewCount !== 1 ? 's' : '' }} match your filters</span>
        </div>
      </q-card-section>

      <q-separator />

      <!-- Dialog Actions -->
      <q-card-actions class="dialog-actions">
        <q-btn
          flat
          dense
          label="Clear All"
          color="negative"
          @click="handleClearAll"
        />
        <q-space />
        <q-btn
          flat
          dense
          label="Cancel"
          @click="handleCancel"
        />
        <q-btn
          unelevated
          dense
          label="Apply"
          color="primary"
          @click="handleApply"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useQuasar } from 'quasar';

// Props
interface Props {
  modelValue: boolean;
  currentFilters: {
    priority: string;
    status: string;
    goal: string | number;
    assignee: string;
    project: string | number;
    dueDate: string;
  };
  priorityOptions: Array<{ label: string; value: string }>;
  statusOptions: Array<{ label: string; value: string }>;
  goalOptions: Array<{ label: string; value: string | number }>;
  assigneeOptions: Array<{ label: string; value: string }>;
  projectOptions: Array<{ label: string; value: string | number }>;
  dueDateOptions: Array<{ label: string; value: string }>;
  previewCount?: number | null;
}

const props = withDefaults(defineProps<Props>(), {
  previewCount: null
});

// Emits
const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'apply', filters: typeof localFilters.value): void;
  (e: 'clear'): void;
}>();

// Composables
const $q = useQuasar();

// Dialog model
const dialogModel = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
});

// Local filter state (copy of current filters)
const localFilters = ref({
  priority: props.currentFilters.priority,
  status: props.currentFilters.status,
  goal: props.currentFilters.goal,
  assignee: props.currentFilters.assignee,
  project: props.currentFilters.project,
  dueDate: props.currentFilters.dueDate
});

// Watch for external filter changes
watch(() => props.currentFilters, (newFilters) => {
  localFilters.value = {
    priority: newFilters.priority,
    status: newFilters.status,
    goal: newFilters.goal,
    assignee: newFilters.assignee,
    project: newFilters.project,
    dueDate: newFilters.dueDate
  };
}, { deep: true });

// Methods
const handleApply = () => {
  emit('apply', localFilters.value);
  dialogModel.value = false;
};

const handleCancel = () => {
  // Reset to current filters
  localFilters.value = {
    priority: props.currentFilters.priority,
    status: props.currentFilters.status,
    goal: props.currentFilters.goal,
    assignee: props.currentFilters.assignee,
    project: props.currentFilters.project,
    dueDate: props.currentFilters.dueDate
  };
  dialogModel.value = false;
};

const handleClearAll = () => {
  localFilters.value = {
    priority: 'none',
    status: 'ongoing',
    goal: 'none',
    assignee: 'none',
    project: 'none',
    dueDate: 'none'
  };
};
</script>

<style lang="scss" scoped>
// Material Design 3 - Flat Dialog Pattern
.task-filter-dialog {
  width: 100%;
  max-width: 800px;

  // Dialog header
  .dialog-header {
    padding: 12px 16px;
    background: var(--surface-container-low, #f5f5f5);

    .text-h6 {
      font-size: 18px;
      font-weight: 500;
    }
  }

  // Dialog content
  .dialog-content {
    padding: 16px;
    max-height: 60vh;
    overflow-y: auto;

    // Mobile: fullscreen dialog needs more space
    @media (max-width: 768px) {
      max-height: none;
    }
  }

  // Filter grid
  .filter-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;

    // Mobile: single column
    @media (max-width: 768px) {
      grid-template-columns: 1fr;
    }

    .filter-item {
      .filter-label {
        font-size: 13px;
        font-weight: 500;
        color: var(--on-surface-variant, #666);
        margin-bottom: 6px;
      }

      .filter-select {
        :deep(.q-field__control) {
          height: 40px;
          font-size: 14px;
        }

        :deep(.q-field__prepend) {
          padding-right: 8px;
        }
      }
    }
  }

  // Preview count
  .preview-count {
    display: flex;
    align-items: center;
    padding: 10px 12px;
    background: var(--surface-container-low, #f5f5f5);
    border: 1px solid var(--outline-variant, #e0e0e0);
    border-radius: 4px;
    font-size: 13px;
    color: var(--on-surface-variant, #666);
  }

  // Dialog actions
  .dialog-actions {
    padding: 10px 16px;
    background: var(--surface-container-low, #f5f5f5);

    .q-btn {
      font-size: 13px;
      padding: 6px 16px;
    }
  }
}
</style>
