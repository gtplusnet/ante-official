<template>
  <workflow-management
    workflow-code="petty_cash_liquidation"
    workflow-name="Petty Cash Liquidation"
    title="Petty Cash Liquidation Workflow"
    description="Configure the approval and rejection workflow for petty cash liquidations"
    :default-stages="defaultStages"
  />
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import WorkflowManagement from './components/WorkflowManagement.vue';
import pettyCashLiquidationStatusReference from '../../../reference/petty-cash-liquidation-status.reference';

export default defineComponent({
  name: 'SettingsLiquidationWorkflow',
  components: {
    WorkflowManagement,
  },
  setup() {
    // Convert reference data to default stages
    const defaultStages = pettyCashLiquidationStatusReference.map((status) => ({
      label: status.label,
      key: status.key,
      color: status.color,
      textColor: status.textColor,
      nextStage: status.nextStage,
      nextStageLabel: status.nextStageLabel,
      isInitial: status.isInitial || false,
      isFinal: status.isFinal || false,
    }));

    return {
      defaultStages,
    };
  },
});
</script>