<template>
  <workflow-management
    workflow-code="purchase_request"
    workflow-name="Purchase Request"
    title="Purchase Request Workflow"
    description="Configure the approval and processing workflow for purchase requests"
    :default-stages="defaultStages"
  />
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import WorkflowManagement from './components/WorkflowManagement.vue';
import purchaseRequestStatusReference from '../../../reference/purchase-request-status.reference';

export default defineComponent({
  name: 'SettingsPurchaseRequestWorkflow',
  components: {
    WorkflowManagement,
  },
  setup() {
    // Convert reference data to default stages
    const defaultStages = purchaseRequestStatusReference.map((status) => ({
      label: status.label,
      key: status.key,
      color: status.color,
      textColor: status.textColor,
      nextStage: status.nextStage,
      nextStageLabel: status.nextStageLabel,
    }));

    return {
      defaultStages,
    };
  },
});
</script>