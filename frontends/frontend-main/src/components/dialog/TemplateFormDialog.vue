<template>
  <q-dialog ref="dialog" persistent @hide="onDialogHide">
    <TemplateDialog minWidth="600px" scrollable="false">
      <template #DialogTitle>
        {{ selectedData ? 'Edit' : 'Create' }} Form
      </template>
      <template #DialogContent>
        <q-form @submit.prevent="submitRequest" class="q-pa-md">
          <div class="row q-col-gutter-md">
            <!-- field: first name -->
            <div class="col-12 col-sm-6">
              <g-input v-model="form.firstName" label="First Name" required />
            </div>

            <!-- field: last name -->
            <div class="col-12 col-sm-6">
              <g-input v-model="form.lastName" label="Last Name" required />
            </div>
          </div>

          <!-- actions -->
          <div class="row justify-end q-mt-lg">
            <q-btn no-caps class="q-mr-sm" outline label="Cancel" type="button" color="primary" @click="hideDialog" />
            <q-btn no-caps unelevated label="Save" type="submit" color="primary" :loading="isLoading" />
          </div>
        </q-form>
      </template>
    </TemplateDialog>
  </q-dialog>
</template>

<style scoped lang="scss">
// Custom styles if needed
</style>

<script lang="ts">
import { defineComponent, ref, watch, getCurrentInstance } from 'vue';
import { QDialog, useQuasar } from 'quasar';
import GInput from '@components/shared/form/GInput.vue';
import TemplateDialog from '@components/dialog/TemplateDialog.vue';
import { handleAxiosError } from 'src/utility/axios.error.handler';

interface Form {
  firstName: string;
  lastName: string;
}

export default defineComponent({
  name: 'TemplateFormDialog',
  components: {
    GInput,
    TemplateDialog,
  },
  props: {
    modelValue: {
      type: Boolean,
      required: true,
    },
    selectedData: {
      type: Object,
      default: null,
    },
  },
  emits: ['update:modelValue', 'saveDone', 'close'],
  setup(props, { emit }) {
    const $q = useQuasar();
    const dialog = ref<InstanceType<typeof QDialog>>();
    const instance = getCurrentInstance();
    const $api = instance?.proxy?.$api;
    const isLoading = ref(false);

    // Form data
    const form = ref<Form>({
      firstName: '',
      lastName: '',
    });

    // Initialize form
    const initForm = () => {
      if (props.selectedData) {
        // Edit mode - populate from props
        form.value.firstName = props.selectedData.firstName || '';
        form.value.lastName = props.selectedData.lastName || '';
      } else {
        // Create mode - set defaults
        form.value = {
          firstName: '',
          lastName: '',
        };
      }
    };

    // Watch for prop changes
    watch(() => props.selectedData, () => {
      initForm();
    }, { immediate: true });

    // Watch modelValue to show/hide dialog
    watch(() => props.modelValue, (val) => {
      if (val) {
        show();
      } else {
        hide();
      }
    });

    // Submit form
    const submitRequest = async () => {
      isLoading.value = true;
      try {
        const response = await $api?.post('/url-here', form.value);

        if (!response) {
          throw new Error('No response received from API');
        }

        $q.notify({
          color: 'positive',
          message: `Record ${props.selectedData ? 'updated' : 'created'} successfully`,
          position: 'top',
        });

        emit('saveDone', response.data);
        hideDialog();
      } catch (error) {
        if (error instanceof Error) {
          handleAxiosError($q, error as any);
        } else {
          handleAxiosError($q, new Error('An unknown error occurred') as any);
        }
      } finally {
        isLoading.value = false;
      }
    };

    // Dialog controls
    const show = () => {
      dialog.value?.show();
    };

    const hide = () => {
      dialog.value?.hide();
    };

    const hideDialog = () => {
      emit('update:modelValue', false);
      emit('close');
      hide();
    };

    const onDialogHide = () => {
      emit('update:modelValue', false);
      emit('close');
    };

    // Initialize on mount
    initForm();

    return {
      dialog,
      form,
      isLoading,
      submitRequest,
      hideDialog,
      onDialogHide,
    };
  },
});
</script>
