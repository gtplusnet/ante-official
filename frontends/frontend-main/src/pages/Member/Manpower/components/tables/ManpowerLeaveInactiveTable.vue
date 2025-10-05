<template>
  <div>
    <g-table :apiUrl="`hr-configuration/leave/plan/${leavePlanInformation.id}/employees/table`" tableKey="leaveTable" :isRowActionEnabled="true" :apiFilters="[{ isActive: false, leavePlanId: leavePlanInformation.id }]" ref="table">



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
              <div class="row q-pa-xs cursor-pointer" @click="activatePlan(props.data)">
                <div><q-icon name="radio_button_checked" color="grey" size="20px" class="q-py-xs" /></div>
                <div class="text-blue q-pa-xs text-label-medium">Activate</div>
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
  <ManpowerEmployeeLeavePlanHistory v-model="isLeavePlanHistoryDialogOpen" :employeeLeavePlanTagInformation="selectedPlan" />

  <!-- Edit Leave Credits Dialog -->
  <ManpowerEditEmployeeLeavePlanTagDialog v-model="isEditLeaveCreditsDialogOpen" :employeeLeavePlanTagInformation="selectedPlan" @saveDone="table?.refetch()" />
</template>

<script lang="ts">
import { LeavePlanResponse } from '@shared/response/leave-plan-response.interface';
import ManpowerEmployeeLeavePlanHistory from '../../dialogs/configuration/ManpowerEmployeeLeavePlanHistory.vue';
import { ref } from 'vue';
import { defineAsyncComponent } from 'vue';
import GTable from 'src/components/shared/display/GTable.vue';
import { useQuasar } from 'quasar';
import { api } from 'src/boot/axios';
import { handleAxiosError } from 'src/utility/axios.error.handler';

// Lazy-loaded dialogs (ALL dialogs must be lazy loaded - CLAUDE.md)
const ManpowerViewEmployeeLeavePlanTagDialog = defineAsyncComponent(() =>
  import('../../dialogs/configuration/ManpowerViewEmployeeLeavePlanTagDialog.vue')
);
const ManpowerEditEmployeeLeavePlanTagDialog = defineAsyncComponent(() =>
  import('../../dialogs/configuration/ManpowerEditEmployeeLeavePlanTagDialog.vue')
);

export default {
  name: 'ManpowerLeaveInactiveTable',
  components: {
    ManpowerViewEmployeeLeavePlanTagDialog,
    ManpowerEmployeeLeavePlanHistory,
    ManpowerEditEmployeeLeavePlanTagDialog,
    GTable,
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
    const isLeavePlanHistoryDialogOpen = ref(false);
    const isEditLeaveCreditsDialogOpen = ref(false);
    const selectedPlan = ref<object | null>(null);

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

    const activatePlan = (data: object) => {
      const planData = data as { employee: { name: string }; id: string | number };
      $q.dialog({
        title: 'Activate Leave Plan',
        message: `Are you sure you want to activate <b>${planData?.employee?.name}</b>?`,
        ok: 'Yes',
        cancel: 'No',
        html: true,
      }).onOk(() => {
        $q.loading.show();
        api
          .patch(`hr-configuration/leave/employee-plan/${planData?.id}/activate`)
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
      openViewPlanDetailsDialog,
      isViewPlanDetailsDialogOpen,
      isLeavePlanHistoryDialogOpen,
      isEditLeaveCreditsDialogOpen,
      selectedPlan,
      openLeavePlanHistoryDialog,
      openEditLeaveCreditsDialog,
      activatePlan,
    };
  },
};
</script>
