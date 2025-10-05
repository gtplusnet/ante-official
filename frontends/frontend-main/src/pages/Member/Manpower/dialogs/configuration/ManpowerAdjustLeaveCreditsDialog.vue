<template>
  <q-dialog ref="dialog" @before-show="fetchData">
    <TemplateDialog minWidth="500px">
      <template #DialogTitle>
        <div>Adjust Leave Creditsssss</div>
      </template>
      <template #DialogContent>
        <form @submit.prevent="save" class="q-gutter-y-md q-pa-md">
          <div>
            <label class="text-label-large">Amount</label>
            <q-input outlined dense class="q-mt-xxs" type="number" :min="0" v-model="formData.amount" />
          </div>

          <div>
            <label class="text-label-large">Transaction Type</label>
            <q-select outlined dense class="q-mt-xxs" :options="transactionTypes" emit-value map-options v-model="formData.transactionType" />
          </div>

          <div>
            <label class="text-label-large">Reason</label>
            <q-input outlined dense class="q-mt-xxs" type="textarea" v-model="formData.reason" />
          </div>

          <div class="row items-center q-mt-md q-gutter-x-sm justify-end">
            <GButton variant="outline" class="text-label-large" label="Cancel" color="primary" v-close-popup />
            <GButton class="text-label-large" label="Save" type="submit" color="primary" />
          </div>
        </form>
      </template>
    </TemplateDialog>
  </q-dialog>
</template>

<script lang="ts">
import { ref } from 'vue';
import { defineAsyncComponent } from 'vue';
import { useQuasar } from 'quasar';
import { api } from 'src/boot/axios';
import { handleAxiosError } from 'src/utility/axios.error.handler';
import { QDialog } from 'quasar';
import GButton from 'src/components/shared/buttons/GButton.vue';

// Lazy-loaded dialogs (ALL dialogs must be lazy loaded - CLAUDE.md)
const TemplateDialog = defineAsyncComponent(() =>
  import('src/components/dialog/TemplateDialog.vue')
);

export default {
  name: 'ManpowerAdjustLeaveCreditsDialog',
  components: {
    QDialog,
    TemplateDialog,
    GButton,
  },
  props: {
    employeeLeavePlanTagInformation: {
      type: [Object, null],
      default: () => ({}),
    },
  },

  setup(props, { emit }) {
    const $q = useQuasar();
    const dialog = ref<InstanceType<typeof QDialog> | null>(null);
    const formData = ref({
      amount: null,
      transactionType: '',
      reason: '',
    });

    const transactionTypes = ref([
      { label: 'Add', value: 'CREDIT' },
      { label: 'Deduct', value: 'DEBIT' },
    ]);

    const save = () => {
      $q.loading.show();
      const params = {
        amount: formData.value.amount,
        transactionType: formData.value.transactionType,
        reason: formData.value.reason,
      };
      api
        .post(`hr-configuration/leave/employee-plan/${props.employeeLeavePlanTagInformation?.id}/adjust-credits`, params)
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

    const fetchData = () => {
      formData.value = {
        amount: null,
        transactionType: 'CREDIT',
        reason: '',
      };
    }

    return {
      dialog,
      transactionTypes,
      formData,
      fetchData,
      save,
    };
  },
};
</script>
