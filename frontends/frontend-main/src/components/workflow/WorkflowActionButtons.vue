<template>
  <div class="workflow-action-buttons">
    <!-- Loading State -->
    <div v-if="loading" class="flex items-center">
      <q-spinner-dots size="30px" color="primary" />
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="text-negative text-caption">
      <q-icon name="error" size="sm" class="q-mr-xs" />
      Failed to load actions
      <q-btn 
        flat 
        dense 
        size="sm" 
        label="Retry" 
        color="primary" 
        @click="loadWorkflowData"
        class="q-ml-sm"
      />
    </div>

    <!-- Action Buttons -->
    <div v-else-if="availableTransitions.length > 0" class="flex items-center q-gutter-xs">
      <q-btn
        v-for="transition in availableTransitions"
        :key="transition.id"
        :label="transition.buttonLabel || transition.buttonName || transition.type"
        :style="getButtonStyle(transition.buttonColor)"
        :loading="actionLoading === transition.id"
        :disable="actionLoading !== null"
        unelevated
        no-caps
        class="action-button primary"
        @click="handleTransition(transition)"
      >
        <q-tooltip v-if="transition.description" :delay="300">
          {{ transition.description }}
        </q-tooltip>
      </q-btn>
    </div>

    <!-- No Actions Available -->
    <div v-else-if="!loading && !error" class="text-grey-6 text-caption">
      No actions available
    </div>

    <!-- Dynamic Dialog Based on Dialog Type -->
    <q-dialog v-model="showDialog" persistent>
      <q-card style="min-width: 400px" class="md3-dialog">
        <q-card-section class="row items-center q-pb-none">
          <span class="text-h6 text-weight-regular">{{ getDialogTitle() }}</span>
        </q-card-section>

        <q-card-section>
          <!-- Confirmation Message -->
          <div v-if="currentTransition?.confirmationMessage" class="q-mb-md">
            {{ currentTransition.confirmationMessage }}
          </div>
          
          <!-- Default Message -->
          <div v-else class="q-mb-md">
            Are you sure you want to {{ currentTransition?.buttonLabel?.toLowerCase() || 'proceed' }}?
          </div>

          <!-- Reason/Remarks Input (for reason_dialog or when requireRemarks is true) -->
          <q-input
            v-if="showReasonInput"
            v-model="dialogData.reason"
            :label="getReasonLabel()"
            type="textarea"
            outlined
            :rules="[val => (val && val.length >= 10) || 'Please provide at least 10 characters']"
            class="q-mt-md"
            autofocus
          />

          <!-- Attachment Upload (for attach_file_dialog) -->
          <q-file
            v-if="currentTransition?.dialogType === 'attach_file_dialog'"
            v-model="dialogData.attachment"
            label="Attach File"
            outlined
            class="q-mt-md"
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
          >
            <template v-slot:prepend>
              <q-icon name="attach_file" />
            </template>
          </q-file>

          <!-- Additional Fields Based on Custom Dialog Config -->
          <div v-if="currentTransition?.customDialogConfig?.fields" class="q-mt-md">
            <component
              v-for="field in currentTransition.customDialogConfig.fields"
              :key="field.name"
              :is="getFieldComponent(field.type)"
              v-model="dialogData[field.name]"
              :label="field.label"
              :options="field.options"
              outlined
              class="q-mb-sm"
            />
          </div>
        </q-card-section>

        <q-separator />

        <q-card-actions align="right" class="q-pa-md">
          <q-btn 
            flat 
            rounded
            dense
            label="Cancel" 
            color="grey" 
            no-caps
            @click="cancelDialog" 
            :disable="dialogLoading"
          />
          <q-btn 
            unelevated 
            no-caps
            :label="currentTransition?.buttonLabel || 'Confirm'" 
            :style="getButtonStyle(currentTransition?.buttonColor)"
            class="action-button primary"
            @click="confirmDialog"
            :loading="dialogLoading"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Liquidation Approval Dialog -->
    <liquidation-approval-dialog
      v-if="workflowInstanceLiquidationId"
      v-model="showLiquidationApprovalDialog"
      :liquidation-id="workflowInstanceLiquidationId"
      :transition="currentTransition"
      @approved="onLiquidationApproved"
      @cancelled="onLiquidationApprovalCancelled"
    />
  </div>
</template>

<script>
import { defineComponent, ref, onMounted, watch, computed } from 'vue';
import { defineAsyncComponent } from 'vue';
import { useQuasar } from 'quasar';
import { api } from 'src/boot/axios';

// Lazy-loaded dialogs (ALL dialogs must be lazy loaded - CLAUDE.md)
const LiquidationApprovalDialog = defineAsyncComponent(() =>
  import('./dialogs/LiquidationApprovalDialog.vue')
);

export default defineComponent({
  name: 'WorkflowActionButtons',
  components: {
    LiquidationApprovalDialog
  },
  props: {
    workflowInstanceId: {
      type: [Number, String],
      required: true
    }
  },
  emits: ['action-performed', 'error'],
  setup(props, { emit }) {
    const $q = useQuasar();
    
    // State
    const loading = ref(false);
    const error = ref(false);
    const actionLoading = ref(null);
    const dialogLoading = ref(false);
    const showDialog = ref(false);
    const showLiquidationApprovalDialog = ref(false);
    
    // Data
    const workflowInstance = ref(null);
    const availableTransitions = ref([]);
    const currentTransition = ref(null);
    const workflowInstanceLiquidationId = ref(null);
    const dialogData = ref({
      reason: '',
      attachment: null
    });

    // Material Design Color Mapping
    const getMaterialColor = (color) => {
      if (!color) return 'primary';
      
      // If it's a hex color, check if it matches known colors
      if (color.startsWith('#')) {
        const colorMap = {
          '#4CAF50': 'green',
          '#66BB6A': 'green',
          '#F44336': 'red',
          '#EF5350': 'red',
          '#2196F3': 'blue',
          '#FFC107': 'amber',
          '#FF9800': 'orange',
          '#9E9E9E': 'grey'
        };
        return colorMap[color.toUpperCase()] || 'primary';
      }
      
      // Direct color mapping
      const directMap = {
        'positive': 'green',
        'negative': 'red',
        'warning': 'orange',
        'info': 'blue',
        'success': 'green',
        'danger': 'red'
      };
      
      return directMap[color.toLowerCase()] || color.toLowerCase();
    };

    // Material Design Icon Mapping
    const getMaterialIcon = (icon) => {
      if (!icon) return null;
      
      // Map common icons to Material Design icons
      const iconMap = {
        'check': 'check_circle',
        'close': 'cancel',
        'approve': 'check_circle',
        'reject': 'cancel',
        'forward': 'arrow_forward',
        'back': 'arrow_back',
        'send': 'send',
        'save': 'save',
        'edit': 'edit',
        'delete': 'delete'
      };
      
      return iconMap[icon.toLowerCase()] || icon;
    };

    // Computed: Check if reason input should be shown
    const showReasonInput = computed(() => {
      if (!currentTransition.value) return false;
      return currentTransition.value.dialogType === 'reason_dialog' || 
             currentTransition.value.requireRemarks === true ||
             currentTransition.value.type === 'REJECT';
    });

    // Get field component based on type
    const getFieldComponent = (type) => {
      const componentMap = {
        'text': 'q-input',
        'number': 'q-input',
        'select': 'q-select',
        'date': 'q-date',
        'checkbox': 'q-checkbox'
      };
      return componentMap[type] || 'q-input';
    };

    // Load workflow data and available transitions
    const loadWorkflowData = async () => {
      if (!props.workflowInstanceId) return;

      loading.value = true;
      error.value = false;

      try {
        // Fetch workflow instance details
        const instanceResponse = await api.get(`/workflow-instance/${props.workflowInstanceId}`);
        workflowInstance.value = instanceResponse.data;

        // Fetch available transitions/actions
        const transitionsResponse = await api.get(`/workflow-instance/${props.workflowInstanceId}/available-transitions`);
        availableTransitions.value = transitionsResponse.data || [];
      } catch (err) {
        console.error('Error loading workflow data:', err);
        error.value = true;
        
        // Try alternate endpoint for actions
        try {
          const actionsResponse = await api.get(`/workflow-instance/${props.workflowInstanceId}/actions`);
          availableTransitions.value = actionsResponse.data || [];
          error.value = false;
        } catch (err2) {
          console.error('Error loading workflow actions:', err2);
          emit('error', err2);
        }
      } finally {
        loading.value = false;
      }
    };

    // Handle transition button click
    const handleTransition = async (transition) => {
      currentTransition.value = transition;
      
      // Handle liquidation approval dialog specially
      if (transition.dialogType === 'liquidation_approval') {
        try {
          // Get the liquidation ID from the workflow instance
          await loadWorkflowInstanceDetails();
          
          // Only show dialog if we have a valid liquidation ID
          if (workflowInstanceLiquidationId.value) {
            showLiquidationApprovalDialog.value = true;
          } else {
            console.error('No liquidation ID found for this workflow instance');
            $q.notify({
              type: 'negative',
              message: 'Unable to load liquidation details. This workflow may not be associated with a petty cash liquidation.',
              icon: 'error'
            });
          }
        } catch (err) {
          console.error('Failed to load workflow instance details:', err);
          $q.notify({
            type: 'negative',
            message: 'Failed to load liquidation details',
            icon: 'error'
          });
        }
        return;
      }
      
      // Check if dialog is needed for other dialog types
      if (transition.dialogType || transition.confirmationRequired || transition.requireRemarks) {
        showDialog.value = true;
        // Reset dialog data
        dialogData.value = {
          reason: '',
          attachment: null
        };
      } else {
        // Execute transition directly
        executeTransition(transition);
      }
    };

    // Get dialog configuration
    const getDialogIcon = () => {
      if (!currentTransition.value) return 'help';
      return getMaterialIcon(currentTransition.value.buttonIcon) || 
             (currentTransition.value.type === 'REJECT' ? 'cancel' : 'check_circle');
    };

    const getDialogColor = () => {
      if (!currentTransition.value) return 'primary';
      return getMaterialColor(currentTransition.value.buttonColor);
    };

    const getDialogTitle = () => {
      if (!currentTransition.value) return 'Confirm Action';
      return currentTransition.value.confirmationTitle || 
             currentTransition.value.buttonLabel || 
             'Confirm Action';
    };

    const getReasonLabel = () => {
      if (!currentTransition.value) return 'Reason';
      if (currentTransition.value.type === 'REJECT') return 'Rejection Reason';
      return currentTransition.value.remarkPrompt || 'Remarks';
    };

    // Get button style with background color
    const getButtonStyle = (color) => {
      if (!color) {
        return {
          backgroundColor: '#1976D2',
          color: '#FFFFFF'
        };
      }
      
      // If it's a hex color, use it directly
      if (color.startsWith('#')) {
        return {
          backgroundColor: color,
          color: '#FFFFFF'
        };
      }
      
      // Convert named colors to hex
      const colorMap = {
        'green': '#4CAF50',
        'red': '#F44336',
        'blue': '#2196F3',
        'orange': '#FF9800',
        'amber': '#FFC107',
        'grey': '#9E9E9E',
        'primary': '#1976D2',
        'positive': '#4CAF50',
        'negative': '#F44336',
        'warning': '#FF9800',
        'info': '#2196F3'
      };
      
      const hexColor = colorMap[color.toLowerCase()] || '#1976D2';
      return {
        backgroundColor: hexColor,
        color: '#FFFFFF'
      };
    };

    // Cancel dialog
    const cancelDialog = () => {
      showDialog.value = false;
      currentTransition.value = null;
      dialogData.value = {
        reason: '',
        attachment: null
      };
    };

    // Confirm dialog and execute transition
    const confirmDialog = async () => {
      // Validate required fields
      if (showReasonInput.value && (!dialogData.value.reason || dialogData.value.reason.length < 10)) {
        $q.notify({
          type: 'negative',
          message: 'Please provide a valid reason',
          icon: 'warning'
        });
        return;
      }

      dialogLoading.value = true;
      await executeTransition(currentTransition.value, dialogData.value);
      dialogLoading.value = false;
      showDialog.value = false;
    };

    // Execute workflow transition
    const executeTransition = async (transition, additionalData = {}) => {
      actionLoading.value = transition.id;

      try {
        // Prepare transition data
        const transitionData = {
          action: transition.buttonName || transition.action || transition.type,
          transitionId: transition.id,
          toStageId: transition.toStageId,
          type: transition.type,
          ...additionalData
        };

        // Add reason/remarks if provided
        if (additionalData.reason) {
          transitionData.remarks = additionalData.reason;
          transitionData.reason = additionalData.reason;
        }

        // Add attachment if provided
        if (additionalData.attachment) {
          // Handle file upload separately if needed
          transitionData.attachmentId = await uploadFile(additionalData.attachment);
        }

        // Execute transition
        const response = await api.post(
          `/workflow-instance/${props.workflowInstanceId}/transition`,
          transitionData
        );

        // Show success notification (skip for liquidation approvals - handled by LiquidationApprovalDialog)
        const isLiquidationApproval = transition.dialogType === 'liquidation_approval';
        if (!isLiquidationApproval) {
          $q.notify({
            type: 'positive',
            message: transition.successMessage || `${transition.buttonLabel || 'Action'} completed successfully`,
            icon: 'check_circle'
          });
        }

        // Emit success event
        emit('action-performed', {
          transition,
          response: response.data
        });

        // Reload available transitions
        await loadWorkflowData();
      } catch (error) {
        console.error('Error executing transition:', error);
        
        // Show error notification
        $q.notify({
          type: 'negative',
          message: error.response?.data?.message || `Failed to ${transition.buttonLabel || 'complete action'}`,
          icon: 'error'
        });

        emit('error', error);
      } finally {
        actionLoading.value = null;
        currentTransition.value = null;
      }
    };

    // Upload file helper
    const uploadFile = async (file) => {
      const formData = new FormData();
      formData.append('file', file);
      
      try {
        const response = await api.post('/upload/workflow-attachment', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        return response.data.id;
      } catch (error) {
        console.error('Error uploading file:', error);
        throw error;
      }
    };

    // Load workflow instance details to get liquidation ID
    const loadWorkflowInstanceDetails = async () => {
      try {
        const response = await api.get(`/workflow-instance/${props.workflowInstanceId}`);
        workflowInstance.value = response.data;
        
        // Extract liquidation ID from source ID if it's a petty cash liquidation
        if (response.data.sourceModule === 'petty_cash_liquidation') {
          workflowInstanceLiquidationId.value = response.data.sourceId;
        }
      } catch (error) {
        console.error('Failed to load workflow instance details:', error);
        throw error;
      }
    };

    // Handle liquidation approval
    const onLiquidationApproved = async (approvalData) => {
      try {
        // The LiquidationApprovalDialog now handles its own API calls and notifications
        // We just need to emit the success event and reload workflow data
        
        // Don't show notification here - the dialog already shows it

        // Emit success event
        emit('action-performed', {
          transition: currentTransition.value,
          response: approvalData.response || { success: true }
        });

        // Reload available transitions
        await loadWorkflowData();
      } catch (error) {
        console.error('Failed to process liquidation approval:', error);
        $q.notify({
          type: 'negative',
          message: 'Failed to refresh workflow data after approval',
          icon: 'error'
        });
        emit('error', error);
      } finally {
        showLiquidationApprovalDialog.value = false;
        currentTransition.value = null;
      }
    };

    // Handle liquidation approval cancellation
    const onLiquidationApprovalCancelled = () => {
      showLiquidationApprovalDialog.value = false;
      currentTransition.value = null;
    };

    // Lifecycle
    onMounted(() => {
      loadWorkflowData();
    });

    // Watch for workflow instance changes
    watch(() => props.workflowInstanceId, () => {
      loadWorkflowData();
    });

    return {
      loading,
      error,
      actionLoading,
      dialogLoading,
      showDialog,
      showLiquidationApprovalDialog,
      availableTransitions,
      currentTransition,
      workflowInstanceLiquidationId,
      dialogData,
      showReasonInput,
      getMaterialColor,
      getMaterialIcon,
      getFieldComponent,
      getButtonStyle,
      loadWorkflowData,
      handleTransition,
      getDialogIcon,
      getDialogColor,
      getDialogTitle,
      getReasonLabel,
      cancelDialog,
      confirmDialog,
      onLiquidationApproved,
      onLiquidationApprovalCancelled
    };
  }
});
</script>

<style lang="scss" scoped>
.workflow-action-buttons {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

// Material Design 3 button styling (matching TaskInformationForm)
.action-button {
  font-weight: 500;
  letter-spacing: 0.1px;
  padding: 0 24px;
  height: 40px;
  border-radius: 20px;
  transition: all 0.2s ease;

  @media (max-width: 768px) {
    padding: 0 16px;
    height: 36px;
    font-size: 13px;

    .q-icon {
      font-size: 18px !important;
    }
  }

  // Primary filled button
  &.primary {
    // No shadow effects
    &:hover:not([disabled]) {
      filter: brightness(0.92);
    }
  }

  // Icon adjustments
  .q-icon {
    font-size: 20px;
  }

  // Loading state
  &.q-btn--loading {
    .q-btn__content {
      opacity: 0;
    }
  }
}

// Flat button styling for Cancel
.q-btn--flat {
  font-weight: 500;
  
  &:hover:not(:disabled) {
    background-color: rgba(0, 0, 0, 0.04);
  }
  
  &:focus:not(:disabled) {
    background-color: rgba(0, 0, 0, 0.08);
  }
  
  &:active:not(:disabled) {
    background-color: rgba(0, 0, 0, 0.12);
  }
}

// Dialog styling for MD3
:deep(.md3-dialog) {
  border-radius: 28px;
  overflow: hidden;
  
  .q-card-section:first-child {
    padding: 24px;
    padding-bottom: 16px;
  }
  
  .q-card-section {
    padding: 24px;
  }
  
  .q-card-actions {
    padding: 24px;
    padding-top: 16px;
  }
  
  // MD3 Avatar styling
  .md3-avatar {
    background: linear-gradient(135deg, var(--q-color-primary) 0%, var(--q-color-primary-dark) 100%);
  }
  
  // Input field styling
  .q-input, .q-file {
    :deep(.q-field__control) {
      border-radius: 4px;
    }
  }
}
</style>