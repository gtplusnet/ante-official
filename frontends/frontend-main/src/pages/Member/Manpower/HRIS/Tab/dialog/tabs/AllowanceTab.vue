<template>
  <div class="allowance-tab">
    <!-- Summary Card -->
    <q-card class="md3-surface">
      <div class="row text-center">
        <div class="col-4">
          <div class="text-label-small text-grey-7">Total Allowances</div>
          <div class="text-title-medium text-primary">{{ summary.totalAllowances || 0 }}</div>
        </div>
        <div class="col-4">
          <div class="text-label-small text-grey-7">Monthly Total</div>
          <div class="text-title-medium text-positive">₱{{ formatAmount(summary.totalMonthlyAllowance) }}</div>
        </div>
        <div class="col-4">
          <div class="text-label-small text-grey-7">Last Updated</div>
          <div class="text-title-medium">{{ formatDate(lastUpdated) }}</div>
        </div>
      </div>
    </q-card>

    <!-- Allowance List -->
    <q-card class="md3-surface">
      <!-- Loading State -->
      <div v-if="isLoading" class="text-center q-pa-lg">
        <q-spinner-dots size="50px" color="primary" />
      </div>

      <!-- Empty State -->
      <div v-else-if="!allowances.length" class="text-center q-pa-lg">
        <q-icon name="payments" size="64px" color="grey-5" />
        <div class="text-h6 text-grey-7 q-mt-md">No allowances assigned</div>
        <div class="text-body2 text-grey-6">Click "Add Allowance" to assign allowances to this employee</div>
      </div>

      <!-- Allowance Items -->
      <q-list v-else separator>
        <q-item v-for="allowance in allowances" :key="allowance.id" class="allowance-item">
          <q-item-section avatar>
            <q-avatar color="primary" text-color="white" icon="payments" class="md3-avatar" />
          </q-item-section>

          <q-item-section>
            <q-item-label class="text-title-medium">{{ allowance.name }}</q-item-label>
            <q-item-label caption class="text-body-small">
              <q-chip size="sm" color="grey-3" text-color="grey-8" dense>
                {{ formatPeriod(allowance.deductionPeriod) }}
              </q-chip>
              <span class="q-ml-sm">• Since {{ formatDate(allowance.effectivityDate) }}</span>
            </q-item-label>
          </q-item-section>

          <q-item-section side>
            <div class="text-title-medium text-primary">₱{{ formatAmount(allowance.amount) }}</div>
          </q-item-section>

          <q-item-section side>
            <div class="row q-gutter-xs">
              <q-btn flat round icon="history" size="sm" @click="viewHistory(allowance)">
                <q-tooltip>View History</q-tooltip>
              </q-btn>
              <q-btn flat round icon="edit" size="sm" @click="editAllowance(allowance)">
                <q-tooltip>Edit Allowance</q-tooltip>
              </q-btn>
              <q-btn flat round icon="delete" size="sm" color="negative" @click="deleteAllowance(allowance)">
                <q-tooltip>Delete Allowance</q-tooltip>
              </q-btn>
            </div>
          </q-item-section>
        </q-item>
      </q-list>
    </q-card>
  </div>
</template>

<script>
import { defineComponent, ref, computed, onMounted, watch } from "vue";
import { api } from "src/boot/axios";
import { date } from "quasar";

export default defineComponent({
  name: "AllowanceTab",
  props: {
    employeeData: {
      type: Object,
      default: () => ({}),
    },
  },
  emits: ["cancel", "update"],
  setup(props, { emit }) {
    const isLoading = ref(false);
    const allowances = ref([]);
    const summary = ref({
      totalAllowances: 0,
      totalMonthlyAllowance: 0,
    });

    const isHistoryDialogOpen = ref(false);
    const isEditDialogOpen = ref(false);
    const isCreateDialogOpen = ref(false);
    const selectedAllowance = ref(null);

    const accountId = computed(() => props.employeeData?.data?.accountDetails?.id || "");
    const lastUpdated = computed(() => {
      if (!allowances.value.length) return new Date();
      const dates = allowances.value.map((a) => new Date(a.lastModified));
      return new Date(Math.max(...dates));
    });

    const formatAmount = (amount) => {
      return new Intl.NumberFormat("en-PH", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount || 0);
    };

    const formatDate = (dateValue) => {
      if (!dateValue) return "N/A";
      return date.formatDate(dateValue, "MMM DD, YYYY");
    };

    const formatPeriod = (period) => {
      const periodMap = {
        EVERY_PERIOD: "Every Period",
        MONTHLY: "Monthly",
        DAILY: "Daily",
        ONE_TIME: "One Time",
      };
      return periodMap[period] || period;
    };

    const fetchAllowanceData = async () => {
      if (!accountId.value) return;

      isLoading.value = true;
      try {
        const response = await api.get("/hris/employee/allowances", {
          params: { accountId: accountId.value },
        });

        if (response.data) {
          summary.value = response.data.summary || {};
          allowances.value = response.data.allowances || [];
        }
      } catch (error) {
        console.error("Error fetching allowance data:", error);
        api.$q.notify({
          type: "negative",
          message: "Failed to load allowance information",
        });
      } finally {
        isLoading.value = false;
      }
    };

    const addAllowance = () => {
      selectedAllowance.value = null;
      isCreateDialogOpen.value = true;
    };

    const viewHistory = (allowance) => {
      selectedAllowance.value = allowance;
      isHistoryDialogOpen.value = true;
    };

    const editAllowance = (allowance) => {
      selectedAllowance.value = allowance;
      isEditDialogOpen.value = true;
    };

    const deleteAllowance = (allowance) => {
      api.$q
        .dialog({
          title: "Confirm Delete",
          message: `Are you sure you want to delete the allowance "${allowance.name}"?`,
          cancel: true,
          persistent: true,
        })
        .onOk(async () => {
          try {
            await api.delete(`/hr-configuration/allowance/plan/${allowance.id}`);
            api.$q.notify({
              type: "positive",
              message: "Allowance deleted successfully",
            });
            refreshData();
          } catch (error) {
            api.$q.notify({
              type: "negative",
              message: "Failed to delete allowance",
            });
          }
        });
    };

    const refreshData = () => {
      fetchAllowanceData();
      emit("update");
    };

    onMounted(() => {
      fetchAllowanceData();
    });

    watch(
      () => props.employeeData,
      () => {
        fetchAllowanceData();
      },
      { deep: true }
    );

    return {
      isLoading,
      allowances,
      summary,
      accountId,
      lastUpdated,
      isHistoryDialogOpen,
      isEditDialogOpen,
      isCreateDialogOpen,
      selectedAllowance,
      formatAmount,
      formatDate,
      formatPeriod,
      fetchAllowanceData,
      addAllowance,
      viewHistory,
      editAllowance,
      deleteAllowance,
      refreshData,
    };
  },
});
</script>

<style lang="scss" scoped>
.allowance-tab {
  .md3-card {
    background: white;
    border-radius: 12px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    border: 1px solid #e0e0e0;
  }

  .md3-button {
    border-radius: 20px;
    text-transform: none;
    padding: 8px 24px;
  }

  .md3-avatar {
    border-radius: 12px;
  }

  .allowance-item {
    transition: all 0.3s ease;

    &:hover {
      background-color: #f8f9fa;
    }

    .q-item-section {
      padding: 16px 0;
    }
  }
}
</style>
