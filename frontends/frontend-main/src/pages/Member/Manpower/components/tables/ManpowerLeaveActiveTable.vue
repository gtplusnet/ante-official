<template>
  <div>
    <g-table :apiUrl="`hr-configuration/leave/plan/${leavePlanInformation.id}/employees/table`" tableKey="leaveTable" :isRowActionEnabled="true" :apiFilters="[{ isActive: true, leavePlanId: leavePlanInformation.id }]" ref="table">

      <template v-slot:employeeName="props">
        <div>{{ formatName(props.data.employee.name) }}</div>
      </template>

      <!-- Slot Action -->
      <template v-slot:row-actions="props">
        <q-btn color="grey-7" round flat icon="more_horiz">
          <q-menu anchor="bottom right" self="top right" auto-close>
            <div class="q-pa-sm">
              <div class="row q-pa-xs cursor-pointer" @click="openViewPlanDetailsDialog(props.data)">
                <div><q-icon name="visibility" color="grey" size="20px" class="q-py-xs" /></div>
                <div class="text-blue q-pa-xs text-label-medium">View full details</div>
              </div>
              <div class="row q-pa-xs cursor-pointer" @click="openLeavePlanHistoryDialog(props.data)">
                <div><q-icon name="history" color="grey" size="20px" class="q-py-xs" /></div>
                <div class="text-blue q-pa-xs text-label-medium">History</div>
              </div>
              <div class="row q-pa-xs cursor-pointer" @click="openEditLeaveCreditsDialog(props.data)">
                <div><q-icon name="edit" color="grey" size="20px" class="q-py-xs" /></div>
                <div class="text-blue q-pa-xs text-label-medium">Edit</div>
              </div>
              <div class="row q-pa-xs cursor-pointer" @click="deactivatePlan(props.data)">
                <div><q-icon name="radio_button_checked" color="grey" size="20px" class="q-py-xs" /></div>
                <div class="text-blue q-pa-xs text-label-medium">De-activate</div>
              </div>
            </div>
          </q-menu>
        </q-btn>
      </template>
    </g-table>
  </div>

  <!-- View Full Details Dialog -->
  <ManpowerViewEmployeeLeavePlanTagDialog v-model="isViewPlanDetailsDialogOpen" :employeeLeavePlanTagInformation="selectedPlan" />

  <!-- Leave Plan History Dialog -->
  <ManpowerEmployeeLeavePlanHistory v-model="isLeavePlanHistoryDialogOpen" :employeeLeavePlanTagInformation="selectedPlan"/>

  <!-- Edit Leave Credits Dialog -->
  <ManpowerEditEmployeeLeavePlanTagDialog v-model="isEditLeaveCreditsDialogOpen" :employeeLeavePlanTagInformation="selectedPlan" @saveDone="table?.refetch()"/>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import GTable from 'src/components/shared/display/GTable.vue';
import { LeavePlanResponse } from '@shared/response/leave-plan-response.interface';
import ManpowerViewEmployeeLeavePlanTagDialog from '../../dialogs/configuration/ManpowerViewEmployeeLeavePlanTagDialog.vue';
import ManpowerEmployeeLeavePlanHistory from '../../dialogs/configuration/ManpowerEmployeeLeavePlanHistory.vue';
import ManpowerEditEmployeeLeavePlanTagDialog from '../../dialogs/configuration/ManpowerEditEmployeeLeavePlanTagDialog.vue';
import { useQuasar } from 'quasar';
import { api } from 'src/boot/axios';
import { handleAxiosError } from 'src/utility/axios.error.handler';
import { formatName } from 'src/utility/formatter';

export default defineComponent({
  name: 'ManpowerLeaveActiveTable',
  components: {
    GTable,
    ManpowerViewEmployeeLeavePlanTagDialog,
    ManpowerEmployeeLeavePlanHistory,
    ManpowerEditEmployeeLeavePlanTagDialog,
  },
  props: {
    leavePlanInformation: {
      type: Object as () => LeavePlanResponse,
      required: true,
    },
  },
  setup() {
    const $q = useQuasar();
    const table = ref<{ refetch: () => void } | null>(null);
    const isViewPlanDetailsDialogOpen = ref(false);
    const selectedPlan = ref<object | null>(null);
    const isLeavePlanHistoryDialogOpen = ref(false);
    const isEditLeaveCreditsDialogOpen = ref(false);

    const openViewPlanDetailsDialog = (data: object) => {
      selectedPlan.value = data;
      isViewPlanDetailsDialogOpen.value = true;
    };

    const openLeavePlanHistoryDialog = (data: object) => {
      selectedPlan.value = data;
      isLeavePlanHistoryDialogOpen.value = true;
    };

    const openEditLeaveCreditsDialog = (data: object) => {
      selectedPlan.value = data;
      isEditLeaveCreditsDialogOpen.value = true;
    };

    const deactivatePlan = (data: unknown) => {
      const planData = data as { employee: { name: string }; id: string | number };
      $q.dialog({
        title: 'Deactivate Leave Plan',
        message: `Are you sure you want to deactivate <b>${planData?.employee?.name}</b>?`,
        ok: 'Yes',
        cancel: 'No',
        html: true,
      }).onOk(() => {
        $q.loading.show();
        api
          .delete(`hr-configuration/leave/employee-plan/${planData?.id}`)
          .then(() => {
            table.value?.refetch();
          })
          .catch((error) => {
            handleAxiosError($q, error);
          })
          .finally(() => {
            $q.loading.hide();
          });
      });
    };

    return {
      table,
      isViewPlanDetailsDialogOpen,
      selectedPlan,
      isLeavePlanHistoryDialogOpen,
      isEditLeaveCreditsDialogOpen,
      openViewPlanDetailsDialog,
      openLeavePlanHistoryDialog,
      openEditLeaveCreditsDialog,
      deactivatePlan,
      formatName,
    };
  },
});
</script>
