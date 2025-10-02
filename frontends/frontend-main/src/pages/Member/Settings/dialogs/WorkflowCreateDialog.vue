<template>
  <q-dialog v-model="dialogVisible" persistent>
    <q-card style="min-width: 500px">
      <q-card-section class="row items-center">
        <div class="text-h6">Create New Workflow</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-separator />

      <q-form @submit="onSubmit" class="q-gutter-md">
        <q-card-section>
          <div class="q-gutter-md">
            <g-input
              v-model="formData.name"
              label="Workflow Name"
              :rules="[(val: string) => !!val || 'Name is required']"
              required
            />

            <g-input
              v-model="formData.code"
              label="Workflow Code"
              hint="Lowercase with underscores only (e.g., purchase_request)"
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

            <q-toggle
              v-model="formData.isActive"
              label="Active"
              hint="Active workflows can be used in the system"
            />
          </div>
        </q-card-section>

        <q-separator />

        <q-card-actions align="right">
          <q-btn label="Cancel" flat v-close-popup />
          <q-btn
            label="Create"
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
import { defineComponent, ref, computed } from 'vue';
import { useQuasar } from 'quasar';
import axios from 'axios';
import GInput from '../../../../components/shared/form/GInput.vue';

export default defineComponent({
  name: 'WorkflowCreateDialog',
  components: {
    GInput,
  },
  props: {
    modelValue: {
      type: Boolean,
      required: true,
    },
  },
  emits: ['update:modelValue', 'created'],
  setup(props, { emit }) {
    const $q = useQuasar();
    const loading = ref(false);
    const formData = ref({
      name: '',
      code: '',
      description: '',
      isActive: true,
    });

    const dialogVisible = computed({
      get: () => props.modelValue,
      set: (value) => emit('update:modelValue', value),
    });

    const onSubmit = async () => {
      loading.value = true;
      try {
        const response = await axios.post('/workflow-template', formData.value);
        $q.notify({
          type: 'positive',
          message: 'Workflow created successfully',
        });
        emit('created', response.data.workflowTemplate);
        dialogVisible.value = false;
        resetForm();
      } catch (error) {
        console.error('Failed to create workflow:', error);
        $q.notify({
          color: 'negative',
          message: 'Failed to create workflow',
          icon: 'report_problem'
        });
      } finally {
        loading.value = false;
      }
    };

    const resetForm = () => {
      formData.value = {
        name: '',
        code: '',
        description: '',
        isActive: true,
      };
    };

    return {
      dialogVisible,
      loading,
      formData,
      onSubmit,
    };
  },
});
</script>