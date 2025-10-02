<template>
  <q-dialog v-model="dialogVisible" persistent>
    <q-card style="min-width: 400px">
      <q-card-section class="row items-center">
        <div class="text-h6">Add New Stage</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-separator />

      <q-form @submit="onSubmit" class="q-gutter-md">
        <q-card-section>
          <div class="q-gutter-md">
            <g-input
              v-model="formData.name"
              label="Stage Name"
              placeholder="e.g., Pending Approval"
              :rules="[(val: string) => !!val || 'Stage name is required']"
              @update:model-value="generateKey"
              required
              autofocus
            />

            <g-input
              v-model="formData.key"
              label="Stage Key"
              placeholder="e.g., PENDING_APPROVAL"
              hint="Unique identifier (uppercase with underscores)"
              :rules="[
                (val: string) => !!val || 'Key is required',
                (val: string) => /^[A-Z_]+$/.test(val) || 'Key must be uppercase with underscores only',
                (val: string) => !isDuplicateKey(val) || 'Key already exists'
              ]"
              required
            />

            <div class="text-caption text-grey-7">
              <q-icon name="info" size="xs" />
              The stage key is automatically generated from the stage name but you can modify it if needed.
            </div>
          </div>
        </q-card-section>

        <q-separator />

        <q-card-actions align="right">
          <q-btn label="Cancel" flat v-close-popup />
          <q-btn
            label="Add Stage"
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
import GInput from '../../../../components/shared/form/GInput.vue';

export default defineComponent({
  name: 'WorkflowAddStageDialog',
  components: {
    GInput,
  },
  props: {
    modelValue: {
      type: Boolean,
      required: true,
    },
    position: {
      type: Object,
      required: true,
    },
    existingStages: {
      type: Array,
      default: () => [],
    },
  },
  emits: ['update:modelValue', 'add-stage'],
  setup(props, { emit }) {
    const $q = useQuasar();
    const loading = ref(false);
    const formData = ref({
      name: '',
      key: '',
    });

    const dialogVisible = computed({
      get: () => props.modelValue,
      set: (value) => emit('update:modelValue', value),
    });

    const isDuplicateKey = (key: string) => {
      if (!key) return false;
      return props.existingStages.some((s: any) => s.key === key);
    };

    const generateKey = (name: string) => {
      if (!name) {
        formData.value.key = '';
        return;
      }

      // Convert name to uppercase and replace spaces/special chars with underscores
      const key = name
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, '_') // Replace non-alphanumeric with underscore
        .replace(/^_+|_+$/g, '') // Remove leading/trailing underscores
        .replace(/_+/g, '_'); // Replace multiple underscores with single

      formData.value.key = key;
    };

    const onSubmit = async () => {
      loading.value = true;
      try {
        // Generate a unique key if there's a duplicate
        let finalKey = formData.value.key;
        let suffix = 1;
        while (isDuplicateKey(finalKey)) {
          finalKey = `${formData.value.key}_${suffix}`;
          suffix++;
        }

        emit('add-stage', {
          name: formData.value.name,
          key: finalKey,
          position: props.position,
        });

        // Reset form and close dialog
        formData.value = {
          name: '',
          key: '',
        };
        dialogVisible.value = false;
      } catch (error) {
        console.error('Failed to add stage:', error);
        $q.notify({
          color: 'negative',
          message: 'Failed to add stage',
          icon: 'report_problem',
        });
      } finally {
        loading.value = false;
      }
    };

    // Reset form when dialog opens
    watch(
      dialogVisible,
      (newVal) => {
        if (newVal) {
          formData.value = {
            name: '',
            key: '',
          };
        }
      }
    );

    return {
      dialogVisible,
      loading,
      formData,
      isDuplicateKey,
      generateKey,
      onSubmit,
    };
  },
});
</script>