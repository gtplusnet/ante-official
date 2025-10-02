<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    persistent
  >
    <q-card style="width: 500px; max-width: 90vw;">
      <!-- Header -->
      <q-card-section class="row items-center bg-negative text-white">
        <q-icon :name="action?.button?.icon || 'cancel'" size="28px" class="q-mr-sm" />
        <div class="text-h6">{{ dialogTitle }}</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup :disable="loading" />
      </q-card-section>

      <!-- Content -->
      <q-card-section>
        <!-- Confirmation Message -->
        <div class="confirmation-message q-mb-md">
          <q-icon name="error_outline" size="24px" color="negative" class="q-mr-sm" />
          <span class="text-body1">{{ confirmationMessage }}</span>
        </div>

        <!-- Action Details -->
        <div v-if="action" class="action-details q-pa-md bg-grey-2 rounded-borders">
          <div class="row q-col-gutter-sm">
            <div class="col-12">
              <div class="text-caption text-grey-7">Action:</div>
              <div class="text-weight-medium text-negative">{{ action.button.label }}</div>
            </div>
            <div class="col-12" v-if="action.toStage">
              <div class="text-caption text-grey-7">Will move to:</div>
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

        <!-- Required Rejection Reason -->
        <div class="q-mt-md">
          <q-input
            v-model="rejectionReason"
            label="Rejection Reason *"
            type="textarea"
            rows="4"
            outlined
            :disable="loading"
            :error="!isValidReason && touched"
            error-message="Please provide a reason for rejection (minimum 10 characters)"
            placeholder="Please provide a detailed reason for rejection..."
            @blur="touched = true"
            counter
            maxlength="500"
          >
            <template v-slot:prepend>
              <q-icon name="comment" color="negative" />
            </template>
          </q-input>
        </div>

        <!-- Common Rejection Reasons (Quick Select) -->
        <div v-if="commonReasons.length > 0" class="q-mt-md">
          <div class="text-caption text-grey-7 q-mb-xs">Quick select reason:</div>
          <div class="row q-gutter-xs">
            <q-chip
              v-for="(reason, index) in commonReasons"
              :key="index"
              clickable
              color="grey-3"
              text-color="grey-8"
              size="sm"
              @click="selectReason(reason)"
            >
              {{ reason }}
            </q-chip>
          </div>
        </div>

        <!-- Additional Remarks -->
        <div v-if="showAdditionalRemarks" class="q-mt-md">
          <q-input
            v-model="additionalRemarks"
            label="Additional Comments (Optional)"
            type="textarea"
            rows="2"
            outlined
            :disable="loading"
            placeholder="Any additional comments..."
          />
        </div>

        <!-- Warning Message -->
        <div class="warning-message q-mt-md q-pa-sm bg-negative text-white rounded-borders">
          <q-icon name="warning" size="20px" class="q-mr-xs" />
          <span class="text-body2">
            {{ action?.button?.warningMessage || 'This action cannot be undone. The request will be rejected and moved back for revision.' }}
          </span>
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
          color="negative"
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
  name: 'WorkflowRejectionDialog',
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
    showAdditionalRemarks: {
      type: Boolean,
      default: false
    },
    minReasonLength: {
      type: Number,
      default: 10
    }
  },
  emits: ['update:modelValue', 'confirm', 'cancel'],
  setup(props, { emit }) {
    const rejectionReason = ref('');
    const additionalRemarks = ref('');
    const touched = ref(false);

    // Common rejection reasons (can be customized per workflow type)
    const commonReasons = ref([
      'Incomplete documentation',
      'Missing receipts',
      'Incorrect amount',
      'Not authorized expense',
      'Requires additional approval'
    ]);

    // Computed properties
    const dialogTitle = computed(() => {
      return props.action?.button?.confirmationTitle || 
             props.action?.button?.label || 
             'Reject Request';
    });

    const confirmationMessage = computed(() => {
      return props.action?.button?.confirmationMessage || 
             'Please provide a reason for rejecting this request:';
    });

    const confirmButtonLabel = computed(() => {
      return props.action?.button?.confirmButtonText || 
             'Reject';
    });

    const isValidReason = computed(() => {
      return rejectionReason.value.trim().length >= props.minReasonLength;
    });

    const canConfirm = computed(() => {
      return isValidReason.value && !props.loading;
    });

    // Methods
    const selectReason = (reason) => {
      rejectionReason.value = reason;
      touched.value = true;
    };

    const handleConfirm = () => {
      touched.value = true;
      
      if (!canConfirm.value) {
        return;
      }

      const data = {
        reason: rejectionReason.value.trim(),
        remarks: additionalRemarks.value.trim() || undefined
      };
      
      emit('confirm', data);
    };

    const handleCancel = () => {
      resetForm();
      emit('cancel');
      emit('update:modelValue', false);
    };

    const resetForm = () => {
      rejectionReason.value = '';
      additionalRemarks.value = '';
      touched.value = false;
    };

    // Reset form when dialog opens
    watch(() => props.modelValue, (newVal) => {
      if (newVal) {
        resetForm();
      }
    });

    // Load custom rejection reasons if provided by action
    watch(() => props.action, (newAction) => {
      if (newAction?.button?.rejectionReasons) {
        commonReasons.value = newAction.button.rejectionReasons;
      }
    }, { immediate: true });

    return {
      rejectionReason,
      additionalRemarks,
      touched,
      commonReasons,
      dialogTitle,
      confirmationMessage,
      confirmButtonLabel,
      isValidReason,
      canConfirm,
      selectReason,
      handleConfirm,
      handleCancel
    };
  }
});
</script>

<style lang="scss" scoped>
.confirmation-message {
  display: flex;
  align-items: flex-start;
  padding: 12px;
  background-color: #ffebee;
  border: 1px solid #f44336;
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

:deep(.q-field__counter) {
  font-size: 0.75rem;
}
</style>