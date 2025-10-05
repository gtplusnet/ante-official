<template>
  <g-table
    :isRowActionEnabled="true"
    tableKey="deductionTable"
    :apiFilters="[{ isActive: false, deductionConfigurationId: deductionInformation.id }]"
    apiUrl="hr-configuration/deduction/plan"
    ref="table"
  >

    <!-- Slot Action -->
    <template v-slot:row-actions="props">
      <q-btn color="grey-7" round flat icon="more_horiz">
        <q-menu auto-close>
          <div class="q-pa-sm">
            <div clickable @click="viewHistoryDeduct(props.data)" class="row q-pa-xs cursor-pointer">
              <div><q-icon name="history" color="grey" size="20px" class="q-py-xs" /></div>
              <div class="text-blue q-pa-xs text-label-medium">History</div>
            </div>
            <div clickable @click="activatedDeduct(props.data)" class="row q-pa-xs cursor-pointer">
              <div><q-icon name="radio_button_checked" color="grey" size="20px" class="q-py-xs" /></div>
              <div class="text-blue q-pa-xs text-label-medium">Activate</div>
            </div>
          </div>
        </q-menu>
      </q-btn>
    </template>
  </g-table>

  <!-- History Dialog -->
  <DeductionHistoryDialog v-model="isDeductionHistoryOpen" @refreshDeductionPlanTable="table?.refetch()" :employeeDeductionData="employeeDeductionData" />
</template>

<style scoped src="../../Configuration/Deduction/DeductionMenuPage.scss"></style>

<script lang="ts">
import { DeductionConfigurationDataResponse, DeductionPlanConfigurationDataResponse } from "@shared/response";
import { useQuasar } from 'quasar';
import { api } from 'src/boot/axios';
import { handleAxiosError } from "../../../../../utility/axios.error.handler";
import { PropType, ref } from 'vue';
import { defineAsyncComponent } from 'vue';
import GTable from "../../../../../components/shared/display/GTable.vue";

// Lazy-loaded dialogs (ALL dialogs must be lazy loaded - CLAUDE.md)
const DeductionHistoryDialog = defineAsyncComponent(() =>
  import('../../dialogs/configuration/ManpowerDeductionHistoryDialog.vue')
);

export default {
  name: 'DeductionActiveTable',
  components: {
    DeductionHistoryDialog,
    GTable,
  },
  props: {
    deductionInformation: {
      type: Object as PropType<DeductionConfigurationDataResponse>,
      required: true,
    },
  },
  setup() {
    const $q = useQuasar();
    const isDeductionHistoryOpen = ref(false);

    const table = ref<InstanceType<typeof GTable> | null>(null);
    const employeeDeductionData = ref<DeductionPlanConfigurationDataResponse | null>(null);

    const viewHistoryDeduct = (data: DeductionPlanConfigurationDataResponse) => {
      employeeDeductionData.value = data;
      isDeductionHistoryOpen.value = true;
    };


    const activatedDeduct = (data: DeductionPlanConfigurationDataResponse) => {
      $q.dialog({
        title: 'Activate',
        message: `Are you sure you want to activate <b>${data.accountInformation.fullName}</b>?`,
        ok: 'Yes',
        cancel: 'No',
        html: true,
      }).onOk(() => {
        activateData(data.id);
      });
    };

    const activateData = (id: number) => {
      $q.loading.show();
      const params = {
        id: id,
      };

      api
        .post('hr-configuration/deduction/plan/activate', params)
        .then(() => {
          table.value?.refetch();
        })
        .catch((error) => {
          handleAxiosError($q, error);
        })
        .finally(() => {
          $q.loading.hide();
        });
    };

    return {
      table,
      isDeductionHistoryOpen,
      employeeDeductionData,
      viewHistoryDeduct,
      activatedDeduct,
    };
  },
};
</script>
