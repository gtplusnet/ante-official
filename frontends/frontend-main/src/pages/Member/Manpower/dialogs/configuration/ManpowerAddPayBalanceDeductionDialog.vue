<template>
  <q-dialog ref="dialog" @before-show="fetchData">
    <TemplateDialog>
      <template #DialogIcon>
        <q-icon size="24px" :name="dialogMode == 'Add' ? 'add' : 'paid'" />
      </template>
      <template #DialogTitle>
        <div>{{ dialogMode == 'Add' ? 'Add' : 'Pay' }} Balance Deduction</div>
      </template>
      <template #DialogContent>
        <q-form @submit.prevent="save" class="q-pa-md">
          <!-- Amount -->
          <div class="col-12">
            <label class="text-label-large">Amount</label>
            <q-input class="q-pt-xs q-pb-md text-body-medium" type="number" min="0" dense outlined v-model="form.amount" />
          </div>

          <!-- Remarks -->
          <div class="col-12">
            <GInput type="textarea" label="Remarks" v-model="form.remarks" />
          </div>

          <div class="col-12 text-right q-mt-md q-gutter-sm">
            <GButton class="text-label-large" variant="outline" label="Close" type="button" color="primary" v-close-popup />
            <GButton class="text-label-large" label="Save" type="submit" color="primary" />
          </div>
        </q-form>
      </template>
    </TemplateDialog>
  </q-dialog>
</template>

<style scoped lang="scss">
.dialog-card {
  max-width: 500px;
  min-height: 350px;
}
</style>

<script lang="ts">
import { QDialog, useQuasar } from 'quasar';
import { api } from 'src/boot/axios';
import GInput from "../../../../../components/shared/form/GInput.vue";
import { handleAxiosError } from "../../../../../utility/axios.error.handler";
import { ref, PropType } from 'vue';
import { defineAsyncComponent } from 'vue';
import { DeductionPlanConfigurationDataResponse } from '@shared/response';
import GButton from 'src/components/shared/buttons/GButton.vue';

// Lazy-loaded dialogs (ALL dialogs must be lazy loaded - CLAUDE.md)
const TemplateDialog = defineAsyncComponent(() =>
  import('src/components/dialog/TemplateDialog.vue')
);

export default {
  name: 'AddDeductMoneyDialog',
  components: {
    GInput,
    TemplateDialog,
    GButton,
  },
  props: {
    dialogMode: {
      type: String as PropType<string | null>,
      required: true,
    },
    localEmployeeDeductionData: {
      type: Object as PropType<DeductionPlanConfigurationDataResponse>,
      required: true,
    },
  },

  setup(props, { emit }) {
    const $q = useQuasar();
    const dialog = ref<InstanceType<typeof QDialog> | null>(null);
    const form = ref({
      amount: '',
      remarks: '',
    });


    const save = () => {
      $q.loading.show();

      if (props.dialogMode === 'Add') {
        const addParams = {
          deductionPlanId: props.localEmployeeDeductionData?.id,
          amount: Number(form.value.amount),
          remarks: form.value.remarks,
        };
        api
          .post('hr-configuration/deduction/plan/add-balance', addParams)
          .then(() => {
            if (dialog.value) {
              dialog.value.hide();
            }
            emit('saveDone');
          })
          .catch((error) => {
            handleAxiosError($q, error);
          })
          .finally(() => {
            $q.loading.hide();
          });
      } else {
        const payParams = {
          deductionPlanId: props.localEmployeeDeductionData?.id,
          amount: Number(form.value.amount),
          remarks: form.value.remarks,
        };
        api
          .post('hr-configuration/deduction/plan/pay-balance', payParams)
          .then(() => {
            if (dialog.value) {
              dialog.value.hide();
            }
            emit('saveDone');
          })
          .catch((error) => {
            handleAxiosError($q, error);
          })
          .finally(() => {
            $q.loading.hide();
          });
      }
    };

    const fetchData = () => {
      $q.loading.show();
      form.value = {
        amount: '',
        remarks: '',
      };
      $q.loading.hide();
    };

    return {
      dialog,
      form,
      fetchData,
      save,
    };
  },
};
</script>
