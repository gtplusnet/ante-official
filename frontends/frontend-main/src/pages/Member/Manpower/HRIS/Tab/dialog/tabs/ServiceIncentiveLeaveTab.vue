<template>
  <div class="service-leave-tab">
    <!-- Summary Cards -->
    <div class="md3-surface">
      <h3 class="md3-title-large">
        <q-icon name="event_available" class="q-mr-sm" color="primary" />
        Leave Balance Summary
      </h3>
      <div class="md3-body-medium text-grey-7 q-mb-md">
        Current available leave credits and balances for this employee.
      </div>

      <div class="row q-col-gutter-md">
        <div class="col-12 col-md-4">
          <div class="md3-surface-variant">
            <div class="md3-label-large text-grey-7">Total Leave Types</div>
            <div class="md3-headline-large text-primary">{{ leaveSummary.totalTypes || 0 }}</div>
          </div>
        </div>
        <div class="col-12 col-md-4">
          <div class="md3-surface-variant">
            <div class="md3-label-large text-grey-7">Available Balance</div>
            <div class="md3-headline-large text-positive">{{ leaveSummary.totalBalance || 0 }}</div>
          </div>
        </div>
        <div class="col-12 col-md-4">
          <div class="md3-surface-variant">
            <div class="md3-label-large text-grey-7">Used This Year</div>
            <div class="md3-headline-large text-orange">{{ leaveSummary.usedThisYear || 0 }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Leave Details Table -->
    <q-card class="md3-surface">
      <div class="text-title-large q-mb-md">Leave Balances</div>

      <!-- Loading State -->
      <div v-if="isLoading" class="text-center q-pa-lg">
        <q-spinner-dots size="50px" color="primary" />
      </div>

      <!-- Empty State -->
      <div v-else-if="!leaveBalances.length" class="text-center q-pa-lg">
        <q-icon name="beach_access" size="64px" color="grey-5" />
        <div class="text-h6 text-grey-7 q-mt-md">No leave plans assigned</div>
        <div class="text-body2 text-grey-6">Contact HR to assign leave plans for this employee</div>
      </div>

      <!-- Data Table -->
      <q-table
        v-else
        flat
        :rows="leaveBalances"
        :columns="leaveColumns"
        row-key="id"
        class="md3-table"
        :pagination="{ rowsPerPage: 10 }"
      >
        <template v-slot:body-cell-leaveType="props">
          <q-td :props="props">
            <div class="text-body-medium text-weight-medium">{{ props.row.leaveType }}</div>
            <div class="text-body-small text-grey-7">{{ props.row.planName }}</div>
          </q-td>
        </template>

        <template v-slot:body-cell-balance="props">
          <q-td :props="props">
            <div class="balance-cell">
              <div class="text-body-medium">{{ props.row.currentBalance.toFixed(1) }} days</div>
              <q-linear-progress
                :value="getBalancePercentage(props.row)"
                :color="getBalanceColor(props.row)"
                class="q-mt-xs"
                style="height: 4px"
              />
            </div>
          </q-td>
        </template>

        <template v-slot:body-cell-actions="props">
          <q-td :props="props">
            <q-btn flat round icon="history" size="sm" @click="viewHistory(props.row)">
              <q-tooltip>View History</q-tooltip>
            </q-btn>
            <q-btn flat round icon="edit" size="sm" @click="adjustCredits(props.row)">
              <q-tooltip>Adjust Credits</q-tooltip>
            </q-btn>
          </q-td>
        </template>
      </q-table>
    </q-card>

    <!-- Dialogs -->
    <ManpowerEmployeeLeavePlanHistory v-model="isHistoryDialogOpen" :employeeLeavePlanTagInformation="selectedPlan" />

    <ManpowerAdjustLeaveCreditsDialog
      v-model="isAdjustCreditsDialogOpen"
      :employeeLeavePlanTagInformation="selectedPlan"
      @saveDone="refreshData"
    />
  </div>
</template>

<script>
import { defineComponent, ref, onMounted, watch } from "vue";
import { api } from "src/boot/axios";
import ManpowerEmployeeLeavePlanHistory from "../../../../dialogs/configuration/ManpowerEmployeeLeavePlanHistory.vue";
import ManpowerAdjustLeaveCreditsDialog from "../../../../dialogs/configuration/ManpowerAdjustLeaveCreditsDialog.vue";

export default defineComponent({
  name: "ServiceIncentiveLeaveTab",
  components: {
    ManpowerEmployeeLeavePlanHistory,
    ManpowerAdjustLeaveCreditsDialog,
  },
  props: {
    employeeData: {
      type: Object,
      default: () => ({}),
    },
  },
  emits: ["cancel", "update"],
  setup(props, { emit }) {
    const isLoading = ref(false);
    const leaveBalances = ref([]);
    const leaveSummary = ref({
      totalTypes: 0,
      totalBalance: 0,
      usedThisYear: 0,
    });

    const isHistoryDialogOpen = ref(false);
    const isAdjustCreditsDialogOpen = ref(false);
    const selectedPlan = ref(null);

    const leaveColumns = [
      {
        name: "leaveType",
        label: "Leave Type",
        field: "leaveType",
        align: "left",
        sortable: true,
      },
      {
        name: "totalCredits",
        label: "Total Credits",
        field: "totalCredits",
        align: "center",
        format: (val) => `${val.toFixed(1)}`,
      },
      {
        name: "used",
        label: "Used",
        field: "usedCredits",
        align: "center",
        format: (val) => `${val.toFixed(1)}`,
      },
      {
        name: "balance",
        label: "Current Balance",
        field: "currentBalance",
        align: "center",
      },
      {
        name: "actions",
        label: "Actions",
        field: "actions",
        align: "center",
      },
    ];

    const getBalancePercentage = (row) => {
      if (row.totalCredits === 0) return 0;
      return row.currentBalance / row.totalCredits;
    };

    const getBalanceColor = (row) => {
      const percentage = getBalancePercentage(row);
      if (percentage > 0.5) return "positive";
      if (percentage > 0.2) return "warning";
      return "negative";
    };

    const fetchLeaveData = async () => {
      if (!props.employeeData?.data?.accountDetails?.id) return;

      isLoading.value = true;
      try {
        const response = await api.get("/hris/employee/leave-summary", {
          params: { accountId: props.employeeData.data.accountDetails.id },
        });

        if (response.data) {
          leaveSummary.value = response.data.summary || {};
          leaveBalances.value = response.data.leaveBalances || [];
        }
      } catch (error) {
        console.error("Error fetching leave data:", error);
        api.$q.notify({
          type: "negative",
          message: "Failed to load leave information",
        });
      } finally {
        isLoading.value = false;
      }
    };

    const viewHistory = (plan) => {
      selectedPlan.value = plan;
      isHistoryDialogOpen.value = true;
    };

    const adjustCredits = (plan) => {
      selectedPlan.value = plan;
      isAdjustCreditsDialogOpen.value = true;
    };

    const refreshData = () => {
      fetchLeaveData();
      emit("update");
    };

    onMounted(() => {
      fetchLeaveData();
    });

    watch(
      () => props.employeeData,
      () => {
        fetchLeaveData();
      },
      { deep: true }
    );

    return {
      isLoading,
      leaveBalances,
      leaveSummary,
      leaveColumns,
      isHistoryDialogOpen,
      isAdjustCreditsDialogOpen,
      selectedPlan,
      getBalancePercentage,
      getBalanceColor,
      viewHistory,
      adjustCredits,
      refreshData,
    };
  },
});
</script>

<style lang="scss" scoped>
.service-leave-tab {
  .md3-card {
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    border: 1px solid #e0e0e0;
  }

  .summary-card {
    height: 100%;
    transition: all 0.3s ease;

    &:hover {
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
      transform: translateY(-2px);
    }

    .q-card-section {
      text-align: center;
    }
  }

  .md3-table {
    border-radius: 8px;
    overflow: hidden;

    :deep(.q-table__top) {
      padding: 0;
    }

    :deep(thead) {
      background-color: #f5f5f5;
    }

    :deep(tbody tr:hover) {
      background-color: #f8f9fa;
    }
  }

  .balance-cell {
    min-width: 120px;
  }
}
</style>
