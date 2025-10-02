<template>
  <g-table
    :isRowActionEnabled="true"
    tableKey="allowanceTable"
    :apiFilters="[{ isActive: true, allowanceConfigurationId: allowanceInformation.id }]"
    apiUrl="hr-configuration/allowance/plan/table"
    ref="table"
  >
    <!-- Slot Action -->
    <template v-slot:row-actions="props">
      <q-btn color="grey-7" round flat icon="more_horiz">
        <q-menu auto-close>
          <div class="q-pa-sm">
            <div clickable @click="viewHistoryAllowance(props.data)" class="row q-pa-xs cursor-pointer">
              <div><q-icon name="history" color="grey" size="20px" class="q-py-xs" /></div>
              <div class="text-blue q-pa-xs text-label-medium">History</div>
            </div>
            <div clickable @click="editAllowance(props.data)" class="row q-pa-xs cursor-pointer">
              <div><q-icon name="edit" color="grey" size="20px" class="q-py-xs" /></div>
              <div class="text-blue q-pa-xs text-label-medium">Edit</div>
            </div>
            <div clickable @click="deactivatedAllowance(props.data)" class="row q-pa-xs cursor-pointer">
              <div><q-icon name="do_not_disturb_on" color="grey" size="20px" class="q-py-xs" /></div>
              <div class="text-blue q-pa-xs text-label-medium">Deactivate</div>
            </div>
          </div>
        </q-menu>
      </q-btn>
    </template>
  </g-table>

  <!-- History Allowance Dialog -->
  <AllowanceHistoryDialog v-model="isAllowanceHistoryDialogOpen" :employeeAllowanceData="employeeAllowanceData" />
  <!-- Edit Allowance Dialog -->
  <AddEditAllowanceDialog v-model="isEditAllowanceDialogOpen" @saveDone="table?.refetch()" :employeeAllowanceData="employeeAllowanceData" />
</template>

<script lang="ts">
import { useQuasar } from 'quasar';
import { PropType, ref } from 'vue';
import GTable from "../../../../../components/shared/display/GTable.vue";
import { AllowanceConfigurationDataResponse, AllowancePlanDataResponse } from "@shared/response";
import { api } from 'src/boot/axios';
import { handleAxiosError } from "../../../../../utility/axios.error.handler";
import AllowanceHistoryDialog from '../../dialogs/configuration/ManpowerAllowanceHistoryDialog.vue';
import AddEditAllowanceDialog from '../../dialogs/configuration/ManpowerAddEditAllowanceDialog.vue';

export default {
  name: 'AllowanceActiveTable',
  components: {
    AllowanceHistoryDialog,
    AddEditAllowanceDialog,
    GTable,
  },
  props: {
    allowanceInformation: {
      type: Object as PropType<AllowanceConfigurationDataResponse>,
      required: true,
    },
  },
  setup() {
    const $q = useQuasar();
    const table = ref<{ refetch: () => void } | null>(null);
    const isAllowanceHistoryDialogOpen = ref(false);
    const isEditAllowanceDialogOpen = ref(false);
    const employeeAllowanceData = ref<AllowancePlanDataResponse | null>(null);

    const viewHistoryAllowance = (data: AllowancePlanDataResponse) => {
      isAllowanceHistoryDialogOpen.value = true;
      employeeAllowanceData.value = data;
    };

    const editAllowance = (data: AllowancePlanDataResponse) => {
      employeeAllowanceData.value = data;
      isEditAllowanceDialogOpen.value = true;
    };

    const deactivatedAllowance = (data: AllowancePlanDataResponse) => {
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
      console.log(id);
      api
        .post('hr-configuration/allowance/plan/deactivate', { id })
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
      $q,
      table,
      employeeAllowanceData,
      isAllowanceHistoryDialogOpen,
      isEditAllowanceDialogOpen,
      viewHistoryAllowance,
      editAllowance,
      deactivatedAllowance,
    };
  },
};
</script>
