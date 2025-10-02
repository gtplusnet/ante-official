<template>
  <q-card class="workflow-management-card q-pa-md">
    <q-card-section>
      <div class="row items-center q-mb-md">
        <div class="col">
          <div class="text-title-medium">{{ title }}</div>
          <div class="text-body-small text-grey-7 q-mt-sm">
            {{ description }}
          </div>
        </div>
        <div class="col-auto" v-if="workflow">
          <q-btn
            label="Edit Workflow"
            icon="edit"
            color="primary"
            @click="editWorkflow"
          />
        </div>
      </div>
    </q-card-section>

    <q-card-section v-if="loading" class="text-center">
      <q-spinner size="50px" color="primary" />
      <div class="q-mt-md">Loading workflow configuration...</div>
    </q-card-section>

    <q-card-section v-else-if="!workflow">
      <div class="text-center q-pa-xl">
        <q-icon name="account_tree" size="64px" color="grey-5" />
        <div class="text-h6 q-mt-md q-mb-sm">No Workflow Configured</div>
        <div class="text-body-medium text-grey-7 q-mb-lg">
          Create a workflow to manage the {{ workflowName }} process
        </div>
        <q-btn
          label="Create Workflow"
          icon="add"
          color="primary"
          @click="createWorkflow"
        />
      </div>
    </q-card-section>

    <q-card-section v-else>
      <!-- Workflow Overview -->
      <div class="workflow-overview q-mb-lg">
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-6">
            <div class="text-subtitle2 text-grey-7">Workflow Status</div>
            <q-chip
              :label="workflow.isActive ? 'Active' : 'Inactive'"
              :color="workflow.isActive ? 'positive' : 'grey'"
              text-color="white"
            />
          </div>
          <div class="col-12 col-md-6">
            <div class="text-subtitle2 text-grey-7">Total Stages</div>
            <div class="text-h6">{{ workflow.stages?.length || 0 }}</div>
          </div>
        </div>
      </div>

      <!-- Workflow Visualization -->
      <div class="workflow-visual-section">
        <div class="text-subtitle1 q-mb-md">Workflow Stages</div>
        <workflow-canvas-preview
          :stages="workflow.stages || []"
          :transitions="transitions"
          :show-details="true"
        />
      </div>

      <!-- Actions -->
      <div class="q-mt-lg text-right">
        <q-btn
          label="Reset to Default"
          flat
          color="grey"
          @click="resetToDefault"
          class="q-mr-sm"
        />
        <q-btn
          :label="workflow.isActive ? 'Deactivate' : 'Activate'"
          flat
          :color="workflow.isActive ? 'negative' : 'positive'"
          @click="toggleWorkflow"
        />
      </div>
    </q-card-section>

    <!-- Workflow Builder Dialog -->
    <workflow-builder-dialog
      v-model="showBuilderDialog"
      :workflow-id="workflow?.id"
      @updated="loadWorkflow"
    />
  </q-card>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, computed, PropType, getCurrentInstance } from 'vue';
import { useQuasar } from 'quasar';
import WorkflowBuilderDialog from '../dialogs/WorkflowBuilderDialog.vue';
import WorkflowCanvasPreview from './WorkflowCanvasPreview.vue';

export default defineComponent({
  name: 'WorkflowManagement',
  components: {
    WorkflowBuilderDialog,
    WorkflowCanvasPreview,
  },
  props: {
    workflowCode: {
      type: String,
      required: true,
    },
    workflowName: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    defaultStages: {
      type: Array as PropType<any[]>,
      default: () => [],
    },
  },
  setup(props) {
    const $q = useQuasar();
    const instance = getCurrentInstance();
    const $api = instance?.appContext.config.globalProperties.$api;
    const workflow = ref<any>(null);
    const loading = ref(false);
    const showBuilderDialog = ref(false);

    const transitions = computed(() => {
      if (!workflow.value?.stages) return [];
      const allTransitions: any[] = [];
      workflow.value.stages.forEach((stage: any) => {
        if (stage.transitionsFrom) {
          allTransitions.push(...stage.transitionsFrom);
        }
      });
      return allTransitions;
    });

    // Convert Quasar color names to hex colors
    const convertToHexColor = (color: string): string => {
      const colorMap: { [key: string]: string } = {
        'red': '#F44336',
        'pink': '#E91E63',
        'purple': '#9C27B0',
        'deep-purple': '#673AB7',
        'indigo': '#3F51B5',
        'blue': '#2196F3',
        'light-blue': '#03A9F4',
        'cyan': '#00BCD4',
        'teal': '#009688',
        'green': '#4CAF50',
        'light-green': '#8BC34A',
        'lime': '#CDDC39',
        'yellow': '#FFEB3B',
        'amber': '#FFC107',
        'orange': '#FF9800',
        'deep-orange': '#FF5722',
        'brown': '#795548',
        'grey': '#9E9E9E',
        'blue-grey': '#607D8B',
        'white': '#FFFFFF',
        'black': '#000000',
        // Add variations
        'orange-6': '#FB8C00',
        'orange-9': '#E65100',
        'orange-10': '#BF360C',
      };
      
      // If it's already a hex color, return as is
      if (color.startsWith('#')) {
        return color;
      }
      
      // Otherwise, try to find it in the map
      return colorMap[color.toLowerCase()] || '#1976D2'; // Default to primary blue
    };

    const loadWorkflow = async () => {
      if (!$api) {
        $q.notify({
          color: 'negative',
          message: 'API service is not available',
          icon: 'report_problem',
        });
        return;
      }
      loading.value = true;
      try {
        const response = await $api.get(`/workflow-template/code/${props.workflowCode}`);
        workflow.value = response.data;
      } catch (error: any) {
        if (error.response?.status === 404) {
          // Workflow doesn't exist yet - auto-seed if default stages are provided
          if (props.defaultStages.length > 0) {
            await createWorkflowSilently();
          } else {
            workflow.value = null;
          }
        } else {
          $q.notify({
            color: 'negative',
            message: error.response?.data?.message || 'Failed to load workflow configuration',
            icon: 'report_problem',
            caption: 'Please try again later',
          });
        }
      } finally {
        loading.value = false;
      }
    };

    const createWorkflowSilently = async () => {
      if (!$api) {
        return;
      }
      try {
        // Create workflow with default stages
        const response = await $api.post('/workflow-template', {
          name: props.workflowName,
          code: props.workflowCode,
          description: `Workflow configuration for ${props.workflowName}`,
          isActive: true,
        });

        const workflowId = response.data.id;

        // Add default stages if provided
        if (props.defaultStages.length > 0) {
          for (let i = 0; i < props.defaultStages.length; i++) {
            const stage = props.defaultStages[i];
            await $api.post('/workflow-stage', {
              workflowId,
              name: stage.label,
              key: stage.key,
              color: convertToHexColor(stage.color || '#1976D2'),
              textColor: convertToHexColor(stage.textColor || '#FFFFFF'),
              sequence: i + 1,
              isInitial: i === 0,
              isFinal: i === props.defaultStages.length - 1,
            });
          }

          // Add default transitions with buttons
          const stagesResponse = await $api.get(`/workflow-stage?workflowId=${workflowId}`);
          const stages = stagesResponse.data;
          
          // For liquidation workflow, add specific transitions with buttons
          if (props.workflowCode === 'petty_cash_liquidation' && stages.length >= 3) {
            const pendingStage = stages.find((s: any) => s.key === 'PENDING');
            const approvedStage = stages.find((s: any) => s.key === 'APPROVED');
            const rejectedStage = stages.find((s: any) => s.key === 'REJECTED');
            
            if (pendingStage && approvedStage) {
              // Create Approve transition with button
              await $api.post('/workflow-stage/transition', {
                fromStageId: pendingStage.id,
                toStageId: approvedStage.id,
                type: 'APPROVE',
                buttonName: 'Approve',
                buttonLabel: 'Approve',
                buttonColor: convertToHexColor('green'),
                buttonIcon: 'check',
                dialogType: 'liquidation_approval',
                confirmationRequired: true,
                confirmationTitle: 'Approve Liquidation',
                confirmationMessage: 'Review the liquidation details and approve to record to petty cash',
              });
            }
            
            if (pendingStage && rejectedStage) {
              // Create Reject transition with button
              await $api.post('/workflow-stage/transition', {
                fromStageId: pendingStage.id,
                toStageId: rejectedStage.id,
                type: 'REJECT',
                buttonName: 'Reject',
                buttonLabel: 'Reject',
                buttonColor: convertToHexColor('red'),
                buttonIcon: 'close',
                dialogType: 'reason_dialog',
                confirmationRequired: true,
                confirmationTitle: 'Reject Liquidation',
                confirmationMessage: 'Are you sure you want to reject this liquidation?',
                requireRemarks: true,
              });
            }
          } else {
            // Default sequential transitions for other workflows
            for (let i = 0; i < stages.length - 1; i++) {
              await $api.post('/workflow-stage/transition', {
                fromStageId: stages[i].id,
                toStageId: stages[i + 1].id,
                dialogType: 'reason_dialog',
                buttonName: 'Next',
                buttonLabel: 'Next',
                buttonColor: convertToHexColor('blue'),
              });
            }
          }
        }

        // Reload workflow data
        const reloadResponse = await $api.get(`/workflow-template/code/${props.workflowCode}`);
        workflow.value = reloadResponse.data;
      } catch (error: any) {
        // Silent failure - don't show notification for auto-seed
        workflow.value = null;
      }
    };

    const createWorkflow = async () => {
      if (!$api) {
        $q.notify({
          color: 'negative',
          message: 'API service is not available',
          icon: 'report_problem',
        });
        return;
      }
      try {
        // Create workflow with default stages
        const response = await $api.post('/workflow-template', {
          name: props.workflowName,
          code: props.workflowCode,
          description: `Workflow configuration for ${props.workflowName}`,
          isActive: true,
        });

        const workflowId = response.data.id;

        // Add default stages if provided
        if (props.defaultStages.length > 0) {
          for (let i = 0; i < props.defaultStages.length; i++) {
            const stage = props.defaultStages[i];
            await $api.post('/workflow-stage', {
              workflowId,
              name: stage.label,
              key: stage.key,
              color: convertToHexColor(stage.color || '#1976D2'),
              textColor: convertToHexColor(stage.textColor || '#FFFFFF'),
              sequence: i + 1,
              isInitial: i === 0,
              isFinal: i === props.defaultStages.length - 1,
            });
          }

          // Add default transitions with buttons
          const stagesResponse = await $api.get(`/workflow-stage?workflowId=${workflowId}`);
          const stages = stagesResponse.data;
          
          // For liquidation workflow, add specific transitions with buttons
          if (props.workflowCode === 'petty_cash_liquidation' && stages.length >= 3) {
            const pendingStage = stages.find((s: any) => s.key === 'PENDING');
            const approvedStage = stages.find((s: any) => s.key === 'APPROVED');
            const rejectedStage = stages.find((s: any) => s.key === 'REJECTED');
            
            if (pendingStage && approvedStage) {
              // Create Approve transition with button
              await $api.post('/workflow-stage/transition', {
                fromStageId: pendingStage.id,
                toStageId: approvedStage.id,
                type: 'APPROVE',
                buttonName: 'Approve',
                buttonLabel: 'Approve',
                buttonColor: convertToHexColor('green'),
                buttonIcon: 'check',
                dialogType: 'liquidation_approval',
                confirmationRequired: true,
                confirmationTitle: 'Approve Liquidation',
                confirmationMessage: 'Review the liquidation details and approve to record to petty cash',
              });
            }
            
            if (pendingStage && rejectedStage) {
              // Create Reject transition with button
              await $api.post('/workflow-stage/transition', {
                fromStageId: pendingStage.id,
                toStageId: rejectedStage.id,
                type: 'REJECT',
                buttonName: 'Reject',
                buttonLabel: 'Reject',
                buttonColor: convertToHexColor('red'),
                buttonIcon: 'close',
                dialogType: 'reason_dialog',
                confirmationRequired: true,
                confirmationTitle: 'Reject Liquidation',
                confirmationMessage: 'Are you sure you want to reject this liquidation?',
                requireRemarks: true,
              });
            }
          } else {
            // Default sequential transitions for other workflows
            for (let i = 0; i < stages.length - 1; i++) {
              await $api.post('/workflow-stage/transition', {
                fromStageId: stages[i].id,
                toStageId: stages[i + 1].id,
                dialogType: 'reason_dialog',
                buttonName: 'Next',
                buttonLabel: 'Next',
                buttonColor: convertToHexColor('blue'),
              });
            }
          }
        }

        $q.notify({
          type: 'positive',
          message: 'Workflow created successfully',
        });

        await loadWorkflow();
        showBuilderDialog.value = true;
      } catch (error: any) {
        $q.notify({
          color: 'negative',
          message: error.response?.data?.message || 'Failed to create workflow',
          icon: 'report_problem',
          caption: 'Please check your input and try again',
        });
      }
    };

    const editWorkflow = () => {
      showBuilderDialog.value = true;
    };

    const toggleWorkflow = async () => {
      if (!workflow.value || !$api) return;

      try {
        await $api.put(`/workflow-template/${workflow.value.id}/toggle`);
        $q.notify({
          type: 'positive',
          message: `Workflow ${workflow.value.isActive ? 'deactivated' : 'activated'} successfully`,
        });
        await loadWorkflow();
      } catch (error: any) {
        $q.notify({
          color: 'negative',
          message: error.response?.data?.message || 'Failed to toggle workflow status',
          icon: 'report_problem',
        });
      }
    };

    const resetToDefault = () => {
      $q.dialog({
        title: 'Reset to Default',
        message: 'Are you sure you want to reset this workflow to the default configuration? All custom stages and transitions will be lost.',
        cancel: true,
        persistent: true,
      }).onOk(async () => {
        if (!workflow.value || !$api) return;

        loading.value = true;
        try {
          // Delete existing workflow
          await $api.delete(`/workflow-template/${workflow.value.id}`);
          
          // Recreate with defaults silently (no dialog)
          await createWorkflowSilently();
          
          $q.notify({
            type: 'positive',
            message: 'Workflow reset to default configuration',
          });
        } catch (error: any) {
          $q.notify({
            color: 'negative',
            message: error.response?.data?.message || 'Failed to reset workflow',
            icon: 'report_problem',
          });
        } finally {
          loading.value = false;
        }
      });
    };

    onMounted(() => {
      loadWorkflow();
    });

    return {
      workflow,
      loading,
      showBuilderDialog,
      transitions,
      loadWorkflow,
      createWorkflow,
      editWorkflow,
      toggleWorkflow,
      resetToDefault,
    };
  },
});
</script>

<style lang="scss" scoped>
.workflow-management-card {
  min-height: 400px;
}

.workflow-overview {
  background-color: #f5f5f5;
  padding: 16px;
  border-radius: 8px;
}

.workflow-visual-section {
  background-color: #fafafa;
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
}
</style>