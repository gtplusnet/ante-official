<template>
  <q-dialog ref="dialog" @hide="fetchData">
  <TemplateDialog>
    <template #DialogTitle>
      {{ allowanceInformation ? 'Edit' : 'Add' }} Allowance Type
    </template>
    <template #DialogContent>
      <q-form @submit.prevent="save" class="q-pa-md">
          <div>
            <div>
              <g-input required type="text" label="Allowance Type" v-model="formData.allowanceType" />
            </div>
          </div>

          <div>
            <label class="label text-label-large">Allowance Category</label>
            <q-select
              outlined
              dense
              v-model="formData.allowanceCategory"
              :options="allowanceCategoryList"
              option-value="value"
              option-label="label"
              emit-value
              map-options
              class="full-width q-pt-xs text-body-medium"
              required
            />
          </div>
          <div class="row items-center q-mt-md q-gutter-sm justify-end">
            <GButton
              label="Cancel"
              color="primary"
              variant="outline"
              v-close-popup
              class="text-label-large"
            />
            <GButton
              :label="allowanceInformation ? 'Update' : 'Save'"
              type="submit"
              color="primary"
              class="text-label-large"
            />
          </div>
      </q-form>
    </template>
  </TemplateDialog>
</q-dialog>
</template>

<script lang="ts">
import { QDialog, useQuasar } from 'quasar';
import { api } from 'src/boot/axios';
import GInput from "../../../../../components/shared/form/GInput.vue";
import { handleAxiosError } from "../../../../../utility/axios.error.handler";
import { onMounted, reactive, ref, PropType } from 'vue';
import { defineAsyncComponent } from 'vue';
import { AllowanceConfigurationDataResponse } from '@shared/response';
import GButton from "src/components/shared/buttons/GButton.vue";

// Lazy-loaded dialogs (ALL dialogs must be lazy loaded - CLAUDE.md)
const TemplateDialog = defineAsyncComponent(() =>
  import('src/components/dialog/TemplateDialog.vue')
);

export default {
  name: 'AddEditAllowanceTypeDialog',
  components: {
    GInput,
    TemplateDialog,
    GButton,
  },
  props: {
    allowanceInformation: {
      type: Object as PropType<AllowanceConfigurationDataResponse | null>,
      default: null,
    },
  },

  setup(props, { emit }) {
    const $q = useQuasar();
    const dialog = ref<InstanceType<typeof QDialog> | null>(null);
    const allowanceCategoryList = ref<{ label: string; value: string }[]>([]);
    const formData = reactive({
      allowanceType: '',
      allowanceCategory: '',
    });

    onMounted(() => {
      fetchAllowanceCategoryList();
    });

    const fetchAllowanceCategoryList = () => {
      $q.loading.show();
      api
        .get('hr-configuration/allowance/categories')
        .then((response) => {
          if (response.data) {
            allowanceCategoryList.value = (response.data || []).map((item: { value: string; key: string }) => ({
              label: item.value,
              value: item.key,
            }));
          }
        })
        .catch((error) => {
          handleAxiosError($q, error);
        })
        .finally(() => {
          $q.loading.hide();
        });
    };

    const save = async () => {
      if (props.allowanceInformation) {
        await apiUpdate();
      } else {
        await apiSave();
      }
    };

    const apiSave = () => {
      $q.loading.show();
      const params = {
        name: formData.allowanceType,
        allowanceCategory: formData.allowanceCategory,
      };
      api
        .post('hr-configuration/allowance', params)
        .then((response) => {
          
          if(dialog.value){
            dialog.value.hide()
          }
          // Return the newly created allowance data
          const newAllowanceData = {
            id: response.data?.id,
            name: formData.allowanceType,
            value: response.data?.id
          };
          emit('saveDone', newAllowanceData);
        })
        .catch((error) => {
          handleAxiosError($q, error);
        })
        .finally(() => {
          $q.loading.hide();
        });
    };

    const apiUpdate = () => {
      $q.loading.show();
      const updateParams = {
        id: props.allowanceInformation?.id,
        name: formData.allowanceType,
        allowanceCategory: formData.allowanceCategory,
      };
      api
        .patch('hr-configuration/allowance', updateParams)
        .then(() => {
          if(dialog.value){
            dialog.value.hide()
          }
          emit('saveDone');
        })
        .catch((error) => {
          handleAxiosError($q, error);
        })
        .finally(() => {
          $q.loading.hide();
        });
    };

    const fetchData = () => {
      $q.loading.show();
      if (props.allowanceInformation) {
        formData.allowanceType = props.allowanceInformation.name;
        formData.allowanceCategory = props.allowanceInformation.category.key;
      } else {
        formData.allowanceType = '';
        formData.allowanceCategory = 'NON_TAXABLE';
      }
      $q.loading.hide();
    };

    return {
      dialog,
      formData,
      allowanceCategoryList,
      save,
      fetchData,
    };
  },
};
</script>
