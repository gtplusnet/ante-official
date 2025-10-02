<template>
  <q-dialog :modelValue="modelValue" @update:modelValue="$emit('update:modelValue', $event)">
    <q-card style="width: 900px; max-width: 95vw;">
      <!-- Header -->
      <q-card-section class="row items-center">
        <div class="text-h6">Liquidation Details</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>
      
      <q-separator />
      
      <!-- Content -->
      <q-card-section style="max-height: 70vh; overflow-y: auto;" class="q-pa-md">
        <div v-if="!liquidationData" class="text-center q-pa-xl text-grey-6">
          No data available
        </div>
        
        <!-- Use the shared LiquidationDetails component -->
        <liquidation-details 
          v-else
          :liquidation-data="liquidationData"
          :show-status="true"
          @view-image="openFullScreenImage"
        />
      </q-card-section>
      
      <!-- Actions - Hide entire footer for the person who submitted the liquidation -->
      <template v-if="!isSubmittedByCurrentUser">
        <q-separator />
        <q-card-actions align="right">
          <!-- Workflow Action Buttons -->
          <workflow-action-buttons
            v-if="liquidationData?.workflowInstanceId"
            :workflow-instance-id="liquidationData.workflowInstanceId"
            @action-performed="handleWorkflowAction"
          />
        </q-card-actions>
      </template>
    </q-card>
  </q-dialog>
</template>

<script>
import { defineComponent, computed } from 'vue';
import { useAuthStore } from '../../../../stores/auth';
import LiquidationDetails from '../components/LiquidationDetails.vue';
import WorkflowActionButtons from '../../../../components/workflow/WorkflowActionButtons.vue';

export default defineComponent({
  name: 'PettyCashLiquidationDetailsDialog',
  components: {
    LiquidationDetails,
    WorkflowActionButtons
  },
  props: {
    modelValue: {
      type: Boolean,
      default: false
    },
    liquidationData: {
      type: Object,
      default: () => ({})
    }
  },
  emits: ['update:modelValue', 'openFullScreenImage', 'workflow-action-performed'],
  setup(props, { emit }) {
    const authStore = useAuthStore();

    // Check if the current user is the one who submitted the liquidation
    const isSubmittedByCurrentUser = computed(() => {
      if (!props.liquidationData) return false;
      
      // Get current user from auth store
      const currentUserId = authStore.accountInformation?.id;
      
      if (!currentUserId) return false;
      
      // Check various possible fields for the submitter ID
      const submitterId = props.liquidationData.requestedById || 
                         props.liquidationData.createdById || 
                         props.liquidationData.requestedBy?.id ||
                         props.liquidationData.createdBy?.id;
      
      console.log('Current User ID:', currentUserId);
      console.log('Submitter ID:', submitterId);
      console.log('Liquidation Data:', props.liquidationData);
      
      return submitterId === currentUserId;
    });

    const openFullScreenImage = (image) => {
      // Pass the image or liquidation data to parent for full screen viewing
      emit('openFullScreenImage', image || props.liquidationData);
    };

    const handleWorkflowAction = (event) => {
      // Emit event to parent to refresh data
      emit('workflow-action-performed', event);
      
      // Don't show notification here - it's already shown by the approval dialog
      
      // Close dialog after successful action
      emit('update:modelValue', false);
    };

    return {
      isSubmittedByCurrentUser,
      openFullScreenImage,
      handleWorkflowAction
    };
  }
});
</script>

<style scoped lang="scss">
// Dialog-specific styles only
// Component styles are handled by LiquidationDetails component
</style>