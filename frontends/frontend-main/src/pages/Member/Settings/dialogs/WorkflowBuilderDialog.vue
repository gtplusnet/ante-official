<template>
  <q-dialog v-model="dialogVisible" persistent maximized>
    <q-card class="workflow-builder-card">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Edit Workflow: {{ workflow?.name }}</div>
        <q-space />
        <q-btn icon="close" flat round dense @click="closeDialog" />
      </q-card-section>

      <q-separator />

      <q-card-section class="workflow-builder-content q-pa-none">
        <workflow-canvas
          v-if="workflowId"
          :workflow-id="workflowId"
          @updated="onWorkflowUpdated"
        />
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script lang="ts">
import { defineComponent, ref, computed, watch, getCurrentInstance } from 'vue';
import { useQuasar } from 'quasar';
import WorkflowCanvas from '../components/WorkflowCanvas.vue';

export default defineComponent({
  name: 'WorkflowBuilderDialog',
  components: {
    WorkflowCanvas,
  },
  props: {
    modelValue: {
      type: Boolean,
      required: true,
    },
    workflowId: {
      type: Number,
      default: null,
    },
  },
  emits: ['update:modelValue', 'updated'],
  setup(props, { emit }) {
    const $q = useQuasar();
    const instance = getCurrentInstance();
    const $api = instance?.appContext.config.globalProperties.$api;
    const workflow = ref<any>(null);

    const dialogVisible = computed({
      get: () => props.modelValue,
      set: (value) => emit('update:modelValue', value),
    });

    const loadWorkflow = async () => {
      if (!props.workflowId || !$api) return;

      try {
        const response = await $api.get(`/workflow-template/${props.workflowId}`);
        workflow.value = response.data;
      } catch (error) {
        console.error('Failed to load workflow:', error);
        $q.notify({
          color: 'negative',
          message: 'Failed to load workflow',
          icon: 'report_problem'
        });
      }
    };

    const onWorkflowUpdated = () => {
      emit('updated');
      loadWorkflow();
    };

    const closeDialog = () => {
      dialogVisible.value = false;
    };

    watch(
      () => props.workflowId,
      (newId) => {
        if (newId && dialogVisible.value) {
          loadWorkflow();
        }
      },
      { immediate: true }
    );

    watch(
      dialogVisible,
      (newVal) => {
        if (newVal && props.workflowId) {
          loadWorkflow();
        }
      }
    );

    return {
      dialogVisible,
      workflow,
      onWorkflowUpdated,
      closeDialog,
    };
  },
});
</script>

<style lang="scss" scoped>
.workflow-builder-card {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.workflow-builder-content {
  flex: 1;
  overflow: auto;
}

.workflow-visual-container {
  height: 100%;
  min-height: 500px;
}

.cursor-move {
  cursor: move;
}
</style>