<template>
  <q-card class="settings-workflow-card q-pa-md">
    <q-card-section>
      <div class="row items-center q-mb-md">
        <div class="col">
          <div class="text-title-medium">Workflow Management</div>
          <div class="text-body-small text-grey-7 q-mt-sm">
            Configure and manage custom workflows for different processes in your organization
          </div>
        </div>
        <div class="col-auto">
          <q-btn
            label="Create Workflow"
            icon="add"
            color="primary"
            @click="showCreateDialog = true"
          />
        </div>
      </div>
    </q-card-section>

    <q-card-section>
      <workflow-list
        :workflows="workflows"
        :loading="loading"
        @edit="editWorkflow"
        @clone="cloneWorkflow"
        @delete="deleteWorkflow"
        @toggle="toggleWorkflow"
      />
    </q-card-section>

    <!-- Create Workflow Dialog -->
    <workflow-create-dialog
      v-model="showCreateDialog"
      @created="onWorkflowCreated"
    />

    <!-- Edit Workflow Dialog -->
    <workflow-builder-dialog
      v-model="showBuilderDialog"
      :workflow-id="selectedWorkflowId"
      @updated="loadWorkflows"
    />

    <!-- Clone Workflow Dialog -->
    <workflow-clone-dialog
      v-model="showCloneDialog"
      :source-workflow="workflowToClone"
      @cloned="onWorkflowCloned"
    />
  </q-card>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, defineAsyncComponent } from 'vue';
import { useQuasar } from 'quasar';
import axios from 'axios';
import WorkflowList from './components/WorkflowList.vue';

// Lazy-loaded dialogs (ALL dialogs must be lazy loaded - CLAUDE.md)
const WorkflowCreateDialog = defineAsyncComponent(() =>
  import('./dialogs/WorkflowCreateDialog.vue')
);
const WorkflowBuilderDialog = defineAsyncComponent(() =>
  import('./dialogs/WorkflowBuilderDialog.vue')
);
const WorkflowCloneDialog = defineAsyncComponent(() =>
  import('./dialogs/WorkflowCloneDialog.vue')
);

export default defineComponent({
  name: 'SettingsWorkflow',
  components: {
    WorkflowList,
    WorkflowCreateDialog,
    WorkflowBuilderDialog,
    WorkflowCloneDialog,
  },
  setup() {
    const $q = useQuasar();
    const workflows = ref([]);
    const loading = ref(false);
    const showCreateDialog = ref(false);
    const showBuilderDialog = ref(false);
    const showCloneDialog = ref(false);
    const selectedWorkflowId = ref<number | undefined>(undefined);
    const workflowToClone = ref<any>(null);

    const loadWorkflows = async () => {
      loading.value = true;
      try {
        const response = await axios.get('/workflow-template');
        workflows.value = response.data.workflowTemplates || [];
      } catch (error) {
        console.error('Failed to load workflows:', error);
        $q.notify({
          color: 'negative',
          message: 'Failed to load workflows',
          icon: 'report_problem'
        });
      } finally {
        loading.value = false;
      }
    };

    const editWorkflow = (workflow: any) => {
      selectedWorkflowId.value = workflow.id;
      showBuilderDialog.value = true;
    };

    const cloneWorkflow = (workflow: any) => {
      workflowToClone.value = workflow;
      showCloneDialog.value = true;
    };

    const deleteWorkflow = async (workflow: any) => {
      $q.dialog({
        title: 'Delete Workflow',
        message: `Are you sure you want to delete the workflow "${workflow.name}"? This action cannot be undone.`,
        cancel: true,
        persistent: true,
      }).onOk(async () => {
        try {
          await axios.delete(`/workflow-template/${workflow.id}`);
          $q.notify({
            type: 'positive',
            message: 'Workflow deleted successfully',
          });
          await loadWorkflows();
        } catch (error) {
          console.error('Failed to delete workflow:', error);
          $q.notify({
            color: 'negative',
            message: 'Failed to delete workflow',
            icon: 'report_problem'
          });
        }
      });
    };

    const toggleWorkflow = async (workflow: any) => {
      try {
        await axios.put(`/workflow-template/${workflow.id}/toggle`);
        $q.notify({
          type: 'positive',
          message: `Workflow ${workflow.isActive ? 'deactivated' : 'activated'} successfully`,
        });
        await loadWorkflows();
      } catch (error) {
        console.error('Failed to toggle workflow status:', error);
        $q.notify({
          color: 'negative',
          message: 'Failed to toggle workflow status',
          icon: 'report_problem'
        });
      }
    };

    const onWorkflowCreated = () => {
      showCreateDialog.value = false;
      loadWorkflows();
    };

    const onWorkflowCloned = () => {
      showCloneDialog.value = false;
      workflowToClone.value = null;
      loadWorkflows();
    };

    onMounted(() => {
      loadWorkflows();
    });

    return {
      workflows,
      loading,
      showCreateDialog,
      showBuilderDialog,
      showCloneDialog,
      selectedWorkflowId,
      workflowToClone,
      loadWorkflows,
      editWorkflow,
      cloneWorkflow,
      deleteWorkflow,
      toggleWorkflow,
      onWorkflowCreated,
      onWorkflowCloned,
    };
  },
});
</script>

<style lang="scss" scoped>
.settings-workflow-card {
  min-height: 500px;
}
</style>