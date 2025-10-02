<template>
  <workflow-management
    workflow-code="delivery_status"
    workflow-name="Delivery Status"
    title="Delivery Status Workflow"
    description="Configure the status workflow for delivery tracking and management"
    :default-stages="defaultStages"
  />
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import WorkflowManagement from './components/WorkflowManagement.vue';
import deliveryStatusReference from '../../../reference/delivery-status.reference';

export default defineComponent({
  name: 'SettingsDeliveryWorkflow',
  components: {
    WorkflowManagement,
  },
  setup() {
    // Convert reference data to default stages
    const defaultStages = deliveryStatusReference
      .sort((a, b) => a.level - b.level)
      .map((status) => ({
        label: status.label,
        key: status.key,
        color: status.color,
        textColor: status.textColor,
        level: status.level,
      }));

    return {
      defaultStages,
    };
  },
});
</script>