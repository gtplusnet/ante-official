<template>
  <q-dialog v-model="dialogVisible" persistent>
    <q-card class="md3-dialog-dense" style="min-width: 450px">
      <!-- Header -->
      <q-card-section class="dialog-header q-pb-sm">
        <div class="text-h6">{{ isEdit ? 'Edit' : 'Add' }} Task Phase</div>
      </q-card-section>

      <!-- Content -->
      <q-card-section class="dialog-content q-pt-none">
        <div class="q-gutter-md">
          <!-- Phase Name -->
          <q-input
            v-model="formData.name"
            label="Phase Name"
            outlined
            dense
            :rules="[val => !!val || 'Phase name is required']"
            class="q-mb-sm"
          />

          <!-- Description -->
          <q-input
            v-model="formData.description"
            label="Description"
            type="textarea"
            outlined
            dense
            rows="3"
            class="q-mb-sm"
          />

          <!-- Date Range -->
          <div class="row q-col-gutter-sm">
            <div class="col-6">
              <q-input
                v-model="formData.startDate"
                label="Start Date"
                type="date"
                outlined
                dense
              />
            </div>
            <div class="col-6">
              <q-input
                v-model="formData.endDate"
                label="End Date"
                type="date"
                outlined
                dense
                :rules="[
                  val => !val || !formData.startDate || val >= formData.startDate || 'End date must be after start date'
                ]"
              />
            </div>
          </div>

          <!-- Status (only shown in edit mode) -->
          <div v-if="isEdit" class="q-mb-sm">
            <q-select
              v-model="formData.status"
              label="Status"
              :options="statusOptions"
              outlined
              dense
              emit-value
              map-options
            />
          </div>
        </div>
      </q-card-section>

      <!-- Actions -->
      <q-card-actions align="right" class="q-px-md q-pb-md">
        <q-btn
          flat
          label="Cancel"
          color="grey-7"
          @click="closeDialog"
        />
        <q-btn
          unelevated
          :label="isEdit ? 'Save Changes' : 'Create Phase'"
          color="primary"
          :loading="loading"
          @click="savePhase"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script lang="ts">
import { defineComponent, ref, computed, watch } from 'vue';
import { useTaskPhaseStore } from 'src/stores/taskPhase';
import { useQuasar } from 'quasar';

interface TaskPhaseFormData {
  name: string;
  description: string;
  startDate: string | null;
  endDate: string | null;
  status: 'DRAFT' | 'ACTIVE' | 'COMPLETED';
}

export default defineComponent({
  name: 'AddEditTaskPhaseDialog',
  props: {
    modelValue: {
      type: Boolean,
      default: false
    },
    projectId: {
      type: [Number, String],
      required: true
    },
    phaseId: {
      type: Number,
      default: null
    },
    phase: {
      type: Object,
      default: null
    }
  },
  emits: ['update:modelValue', 'saved'],
  setup(props, { emit }) {
    const $q = useQuasar();
    const taskPhaseStore = useTaskPhaseStore();
    const dialogVisible = ref(props.modelValue);
    const loading = ref(false);

    // Form data
    const formData = ref<TaskPhaseFormData>({
      name: '',
      description: '',
      startDate: null,
      endDate: null,
      status: 'DRAFT'
    });

    // Status options for edit mode
    const statusOptions = [
      { label: 'Draft', value: 'DRAFT' },
      { label: 'Active', value: 'ACTIVE' },
      { label: 'Completed', value: 'COMPLETED' }
    ];

    // Computed
    const isEdit = computed(() => !!props.phaseId || !!props.phase);

    // Initialize form data when editing
    const initializeFormData = () => {
      if (props.phase) {
        formData.value = {
          name: props.phase.name || '',
          description: props.phase.description || '',
          startDate: props.phase.startDate ? props.phase.startDate.split('T')[0] : null,
          endDate: props.phase.endDate ? props.phase.endDate.split('T')[0] : null,
          status: props.phase.status || 'DRAFT'
        };
      } else {
        // Reset form for new phase
        formData.value = {
          name: '',
          description: '',
          startDate: null,
          endDate: null,
          status: 'DRAFT'
        };
      }
    };

    // Save phase
    const savePhase = async () => {
      // Validate required fields
      if (!formData.value.name) {
        $q.notify({
          type: 'negative',
          message: 'Phase name is required'
        });
        return;
      }

      // Validate dates
      if (formData.value.startDate && formData.value.endDate) {
        if (formData.value.endDate < formData.value.startDate) {
          $q.notify({
            type: 'negative',
            message: 'End date must be after start date'
          });
          return;
        }
      }

      loading.value = true;

      try {
        const projectId = typeof props.projectId === 'string'
          ? parseInt(props.projectId)
          : props.projectId;

        const phaseData = {
          name: formData.value.name,
          description: formData.value.description || null,
          startDate: formData.value.startDate ? new Date(formData.value.startDate).toISOString() : null,
          endDate: formData.value.endDate ? new Date(formData.value.endDate).toISOString() : null,
          status: formData.value.status
        };

        if (isEdit.value) {
          // Update existing phase
          const phaseId = props.phaseId || props.phase?.id;
          await taskPhaseStore.updatePhase(projectId, phaseId, phaseData);

          $q.notify({
            type: 'positive',
            message: 'Task phase updated successfully'
          });
        } else {
          // Create new phase
          await taskPhaseStore.createPhase(projectId, phaseData);

          $q.notify({
            type: 'positive',
            message: 'Task phase created successfully'
          });
        }

        emit('saved');
        closeDialog();
      } catch (error: any) {
        console.error('Error saving task phase:', error);
        $q.notify({
          type: 'negative',
          message: error.message || 'Failed to save task phase'
        });
      } finally {
        loading.value = false;
      }
    };

    // Close dialog
    const closeDialog = () => {
      dialogVisible.value = false;
    };

    // Watchers
    watch(() => props.modelValue, (newVal) => {
      dialogVisible.value = newVal;
      if (newVal) {
        initializeFormData();
      }
    });

    watch(dialogVisible, (newVal) => {
      emit('update:modelValue', newVal);
    });

    // Initialize on mount if dialog is open
    if (props.modelValue) {
      initializeFormData();
    }

    return {
      dialogVisible,
      loading,
      formData,
      statusOptions,
      isEdit,
      savePhase,
      closeDialog
    };
  }
});
</script>

<style lang="scss" scoped>
// Material Design 3 Dialog Styles
.md3-dialog-dense {
  border-radius: 12px;
  overflow: hidden;

  .dialog-header {
    background: var(--md3-surface-container-high);
    border-bottom: 1px solid var(--md3-outline-variant);
    padding: 16px 24px;

    .text-h6 {
      font-size: 18px;
      font-weight: 500;
      margin: 0;
      color: var(--md3-on-surface);
    }
  }

  .dialog-content {
    padding: 16px 24px;
    max-height: 60vh;
    overflow-y: auto;
  }

  // Flat input fields (Material Design 3)
  :deep(.q-field--outlined) {
    .q-field__control {
      &:before {
        border-color: var(--md3-outline);
      }

      &:hover:before {
        border-color: var(--md3-on-surface);
      }
    }

    &.q-field--focused {
      .q-field__control:before {
        border-color: var(--md3-primary);
        border-width: 2px;
      }
    }
  }
}
</style>