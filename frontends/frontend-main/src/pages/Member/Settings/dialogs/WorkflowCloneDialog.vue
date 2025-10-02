<template>
  <q-dialog v-model="dialogVisible" persistent>
    <q-card style="min-width: 500px">
      <q-card-section class="row items-center">
        <div class="text-h6">Clone Workflow</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-separator />

      <q-form @submit="onSubmit" class="q-gutter-md">
        <q-card-section>
          <div class="q-mb-md" v-if="sourceWorkflow">
            <div class="text-caption text-grey-7">Cloning from:</div>
            <div class="text-body-medium">{{ sourceWorkflow.name }}</div>
          </div>

          <div class="q-gutter-md">
            <g-input
              v-model="formData.name"
              label="New Workflow Name"
              :rules="[(val: string) => !!val || 'Name is required']"
              required
            />

            <g-input
              v-model="formData.code"
              label="New Workflow Code"
              hint="Lowercase with underscores only (e.g., purchase_request_v2)"
              :rules="[
                (val: string) => !!val || 'Code is required',
                (val: string) => /^[a-z_]+$/.test(val) || 'Code must be lowercase with underscores only'
              ]"
              required
            />

            <g-input
              v-model="formData.description"
              label="Description"
              type="textarea"
              rows="3"
            />
          </div>
        </q-card-section>

        <q-separator />

        <q-card-actions align="right">
          <q-btn label="Cancel" flat v-close-popup />
          <q-btn
            label="Clone"
            type="submit"
            color="primary"
            :loading="loading"
          />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script lang="ts">
import { defineComponent, ref, computed, watch } from 'vue';
import { useQuasar } from 'quasar';
import axios from 'axios';
import GInput from '../../../../components/shared/form/GInput.vue';

export default defineComponent({
  name: 'WorkflowCloneDialog',
  components: {
    GInput,
  },
  props: {
    modelValue: {
      type: Boolean,
      required: true,
    },
    sourceWorkflow: {
      type: Object,
      default: null,
    },
  },
  emits: ['update:modelValue', 'cloned'],
  setup(props, { emit }) {
    const $q = useQuasar();
    const loading = ref(false);
    const formData = ref({
      sourceWorkflowId: null as number | null,
      name: '',
      code: '',
      description: '',
    });

    const dialogVisible = computed({
      get: () => props.modelValue,
      set: (value) => emit('update:modelValue', value),
    });

    const onSubmit = async () => {
      if (!props.sourceWorkflow) return;

      loading.value = true;
      try {
        const response = await axios.post('/workflow-template/clone', {
          ...formData.value,
          sourceWorkflowId: props.sourceWorkflow.id,
        });
        $q.notify({
          type: 'positive',
          message: 'Workflow cloned successfully',
        });
        emit('cloned', response.data.workflowTemplate);
        dialogVisible.value = false;
        resetForm();
      } catch (error) {
        console.error('Failed to clone workflow:', error);
        $q.notify({
          color: 'negative',
          message: 'Failed to clone workflow',
          icon: 'report_problem'
        });
      } finally {
        loading.value = false;
      }
    };

    const resetForm = () => {
      formData.value = {
        sourceWorkflowId: null,
        name: '',
        code: '',
        description: '',
      };
    };

    watch(
      () => props.sourceWorkflow,
      (workflow) => {
        if (workflow) {
          formData.value.name = `${workflow.name} (Copy)`;
          formData.value.code = `${workflow.code}_copy`;
          formData.value.description = workflow.description || '';
        }
      }
    );

    return {
      dialogVisible,
      loading,
      formData,
      onSubmit,
    };
  },
});
</script>