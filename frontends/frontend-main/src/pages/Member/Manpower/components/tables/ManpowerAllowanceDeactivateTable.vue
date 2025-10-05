<template>
  <g-table
    :isRowActionEnabled="true"
    tableKey="allowanceTable"
    :apiFilters="[{ isActive: false, allowanceConfigurationId: allowanceInformation.id }]"
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
            <div clickable v-if="props.data.isActive == true" @click="editAllowance(props.data)" class="row q-pa-xs cursor-pointer">
              <div><q-icon name="edit" color="grey" size="20px" class="q-py-xs" /></div>
              <div class="text-blue q-pa-xs text-label-medium">Edit</div>
            </div>
            <div clickable @click="activatedAllowance(props.data)" class="row q-pa-xs cursor-pointer">
              <div><q-icon name="radio_button_checked" color="grey" size="20px" class="q-py-xs" /></div>
              <div class="text-blue q-pa-xs text-label-medium">Activate</div>
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
import { AllowanceConfigurationDataResponse, AllowancePlanDataResponse } from "@shared/response";
import { useQuasar } from 'quasar';
import { api } from 'src/boot/axios';
import { handleAxiosError } from "../../../../../utility/axios.error.handler";
import { PropType, ref } from 'vue';
import { defineAsyncComponent } from 'vue';
import GTable from "../../../../../components/shared/display/GTable.vue";

// Lazy-loaded dialogs (ALL dialogs must be lazy loaded - CLAUDE.md)
const AllowanceHistoryDialog = defineAsyncComponent(() =>
  import('../../dialogs/configuration/ManpowerAllowanceHistoryDialog.vue')
);
const AddEditAllowanceDialog = defineAsyncComponent(() =>
  import('../../dialogs/configuration/ManpowerAddEditAllowanceDialog.vue')
);

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
    const isAllowanceHistoryDialogOpen = ref(false);
    const isEditAllowanceDialogOpen = ref(false);
    const table = ref<InstanceType<typeof GTable> | null>(null);
    const employeeAllowanceData = ref<AllowancePlanDataResponse | null>(null);

    const viewHistoryAllowance = (data: AllowancePlanDataResponse) => {
      employeeAllowanceData.value = data;
      isAllowanceHistoryDialogOpen.value = true;
    };

    const editAllowance = (data: AllowancePlanDataResponse) => {
      employeeAllowanceData.value = data;
      isEditAllowanceDialogOpen.value = true;
    };

    const activatedAllowance = (data: AllowancePlanDataResponse) => {
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
      api
        .post('hr-configuration/allowance/plan/activate', { id })
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
      isAllowanceHistoryDialogOpen,
      isEditAllowanceDialogOpen,
      employeeAllowanceData,
      viewHistoryAllowance,
      editAllowance,
      activatedAllowance,
    };
  },
};
</script>
