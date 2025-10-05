<template>
  <g-table
    :isRowActionEnabled="true"
    tableKey="deductionTable"
    :apiFilters="[{ isActive: true, deductionConfigurationId: deductionInformation.id }]"
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
            <div clickable @click="editDeduct(props.data)" class="row q-pa-xs cursor-pointer">
              <div><q-icon name="edit" color="grey" size="20px" class="q-py-xs" /></div>
              <div class="text-blue q-pa-xs text-label-medium">Edit</div>
            </div>
            <div clickable @click="deactivatedDeduct(props.data)" class="row q-pa-xs cursor-pointer">
              <div><q-icon name="do_not_disturb_on" color="grey" size="20px" class="q-py-xs" /></div>
              <div class="text-blue q-pa-xs text-label-medium">Deactivate</div>
            </div>
          </div>
        </q-menu>
      </q-btn>
    </template>
  </g-table>

  <!-- History Dialog -->
  <DeductionHistoryDialog v-model="isDeductionHistoryOpen" @refreshDeductionPlanTable="table?.refetch()" :employeeDeductionData="employeeDeductionData" />
  <!-- Edit Deduction Dialog -->
  <AddEditDeductionDialog @saveDone="table?.refetch()" v-model="isAddEditDeductionOpen" :employeeDeductionData="employeeDeductionData" />
</template>

<style scoped src="../../Configuration/Deduction/DeductionMenuPage.scss"></style>

<script lang="ts">
import { useQuasar } from 'quasar';
import { PropType, ref } from 'vue';
import { defineAsyncComponent } from 'vue';
import GTable from "../../../../../components/shared/display/GTable.vue";
import { DeductionConfigurationDataResponse, DeductionPlanConfigurationDataResponse } from "@shared/response";
import { api } from 'src/boot/axios';
import { handleAxiosError } from "../../../../../utility/axios.error.handler";

// Lazy-loaded dialogs (ALL dialogs must be lazy loaded - CLAUDE.md)
const DeductionHistoryDialog = defineAsyncComponent(() =>
  import('../../dialogs/configuration/ManpowerDeductionHistoryDialog.vue')
);
const AddEditDeductionDialog = defineAsyncComponent(() =>
  import('../../dialogs/configuration/ManpowerAddEditDeductionDialog.vue')
);

export default {
  name: 'DeductionActiveTable',
  components: {
    DeductionHistoryDialog,
    AddEditDeductionDialog,
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
    const table = ref<{ refetch: () => void } | null>(null);
    const isDeductionHistoryOpen = ref(false);
    const isAddEditDeductionOpen = ref(false);
    const employeeDeductionData = ref<DeductionPlanConfigurationDataResponse | null>(null);

    const viewHistoryDeduct = (data: DeductionPlanConfigurationDataResponse) => {
      employeeDeductionData.value = data;
      isDeductionHistoryOpen.value = true;
    };

    const editDeduct = (deduction: DeductionPlanConfigurationDataResponse) => {
      employeeDeductionData.value = deduction;
      isAddEditDeductionOpen.value = true;
    };

    const deactivatedDeduct = (data: DeductionPlanConfigurationDataResponse) => {
      $q.dialog({
        title: 'Deactivate',
        message: `Are you sure you want to deactivate <b>${data.accountInformation.fullName}</b>?`,
        ok: 'Yes',
        cancel: 'No',
        html: true,
      }).onOk(() => {
        deactivateData(data.id);
      });
    };

    const deactivateData = (id: number) => {
      $q.loading.show();
      const params = {
        id: id,
      };

      api
        .post('hr-configuration/deduction/plan/deactivate', params)
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
      isAddEditDeductionOpen,
      employeeDeductionData,
      viewHistoryDeduct,
      editDeduct,
      deactivatedDeduct,
    };
  },
};
</script>
