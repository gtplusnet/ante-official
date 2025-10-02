<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    persistent
  >
    <q-card style="width: 500px; max-width: 90vw;">
      <!-- Header -->
      <q-card-section class="row items-center bg-primary text-white">
        <q-icon :name="action?.button?.icon || 'check_circle'" size="28px" class="q-mr-sm" />
        <div class="text-h6">{{ dialogTitle }}</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup :disable="loading" />
      </q-card-section>

      <!-- Content -->
      <q-card-section>
        <!-- Confirmation Message -->
        <div class="confirmation-message q-mb-md">
          <q-icon name="help_outline" size="24px" color="warning" class="q-mr-sm" />
          <span class="text-body1">{{ confirmationMessage }}</span>
        </div>

        <!-- Action Details -->
        <div v-if="action" class="action-details q-pa-md bg-grey-2 rounded-borders">
          <div class="row q-col-gutter-sm">
            <div class="col-12">
              <div class="text-caption text-grey-7">Action:</div>
              <div class="text-weight-medium">{{ action.button.label }}</div>
            </div>
            <div class="col-12" v-if="action.toStage">
              <div class="text-caption text-grey-7">Next Stage:</div>
              <workflow-status-badge
                :stage="action.toStage"
                size="sm"
                dense
              />
            </div>
            <div class="col-12" v-if="action.description">
              <div class="text-caption text-grey-7">Description:</div>
              <div class="text-body2">{{ action.description }}</div>
            </div>
          </div>
        </div>

        <!-- Optional Remarks -->
        <div v-if="showRemarks" class="q-mt-md">
          <q-input
            v-model="remarks"
            label="Remarks (Optional)"
            type="textarea"
            rows="3"
            outlined
            :disable="loading"
            placeholder="Enter any additional comments..."
          />
        </div>

        <!-- Warning Message -->
        <div v-if="action?.button?.warningMessage" class="warning-message q-mt-md q-pa-sm bg-warning text-white rounded-borders">
          <q-icon name="warning" size="20px" class="q-mr-xs" />
          <span class="text-body2">{{ action.button.warningMessage }}</span>
        </div>
      </q-card-section>

      <!-- Actions -->
      <q-card-actions align="right" class="q-px-md q-pb-md">
        <q-btn
          label="Cancel"
          flat
          color="grey"
          @click="handleCancel"
          :disable="loading"
        />
        <q-btn
          :label="confirmButtonLabel"
          :color="confirmButtonColor"
          unelevated
          @click="handleConfirm"
          :loading="loading"
          :disable="!canConfirm"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script>
import { defineComponent, ref, computed, watch } from 'vue';
import WorkflowStatusBadge from './WorkflowStatusBadge.vue';

export default defineComponent({
  name: 'WorkflowApprovalDialog',
  components: {
    WorkflowStatusBadge
  },
  props: {
    modelValue: {
      type: Boolean,
      required: true
    },
    action: {
      type: Object,
      default: null
    },
    workflowInstanceId: {
      type: [Number, String],
      default: null
    },
    loading: {
      type: Boolean,
      default: false
    },
    showRemarks: {
      type: Boolean,
      default: true
    }
  },
  emits: ['update:modelValue', 'confirm', 'cancel'],
  setup(props, { emit }) {
    const remarks = ref('');

    // Computed properties
    const dialogTitle = computed(() => {
      return props.action?.button?.confirmationTitle || 
             props.action?.button?.label || 
             'Confirm Action';
    });

    const confirmationMessage = computed(() => {
      return props.action?.button?.confirmationMessage || 
             `Are you sure you want to ${props.action?.button?.label?.toLowerCase() || 'perform this action'}?`;
    });

    const confirmButtonLabel = computed(() => {
      return props.action?.button?.confirmButtonText || 
             props.action?.button?.label || 
             'Confirm';
    });

    const confirmButtonColor = computed(() => {
      const color = props.action?.button?.color;
      const colorMap = {
        'green': 'positive',
        'red': 'negative',
        'blue': 'primary',
        'orange': 'warning'
      };
      return colorMap[color] || color || 'primary';
    });

    const canConfirm = computed(() => {
      // Add any validation logic here if needed
      return true;
    });

    // Methods
    const handleConfirm = () => {
      const data = {
        remarks: remarks.value || undefined
      };
      emit('confirm', data);
    };

    const handleCancel = () => {
      remarks.value = '';
      emit('cancel');
      emit('update:modelValue', false);
    };

    // Reset form when dialog opens
    watch(() => props.modelValue, (newVal) => {
      if (newVal) {
        remarks.value = '';
      }
    });

    return {
      remarks,
      dialogTitle,
      confirmationMessage,
      confirmButtonLabel,
      confirmButtonColor,
      canConfirm,
      handleConfirm,
      handleCancel
    };
  }
});
</script>

<style lang="scss" scoped>
.confirmation-message {
  display: flex;
  align-items: center;
  padding: 12px;
  background-color: #fff3cd;
  border: 1px solid #ffc107;
  border-radius: 4px;
}

.action-details {
  border: 1px solid #e0e0e0;
}

.warning-message {
  display: flex;
  align-items: center;
}

.rounded-borders {
  border-radius: 8px;
}
</style>