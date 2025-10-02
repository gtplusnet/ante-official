<template>
  <div class="deduction-tab">
    <!-- Loading State -->
    <div v-if="isLoading" class="text-center q-pa-lg">
      <q-spinner-dots size="50px" color="primary" />
    </div>

    <!-- Content -->
    <div v-else class="row q-col-gutter-md">
      <!-- Regular Deductions -->
      <div class="col-12 col-md-6">
        <q-card class="md3-surface">
          <div class="text-title-medium q-mb-md">Regular Deductions</div>

          <!-- Empty State -->
          <div v-if="!regularDeductions.length" class="text-center q-pa-md">
            <q-icon name="remove_circle_outline" size="48px" color="grey-5" />
            <div class="text-body2 text-grey-6 q-mt-sm">No regular deductions</div>
          </div>

          <!-- Deduction List -->
          <q-list v-else>
            <q-item v-for="deduction in regularDeductions" :key="deduction.id" class="deduction-item">
              <q-item-section>
                <q-item-label class="text-body-medium">{{ deduction.name }}</q-item-label>
                <q-item-label caption>
                  <q-chip size="sm" color="grey-3" text-color="grey-8" dense>
                    {{ formatPeriod(deduction.deductionPeriod) }}
                  </q-chip>
                </q-item-label>
              </q-item-section>
              <q-item-section side>
                <div class="text-label-large text-negative">-₱{{ formatAmount(deduction.amount) }}</div>
              </q-item-section>
              <q-item-section side>
                <q-btn flat round icon="more_vert" size="sm">
                  <q-menu>
                    <q-list style="min-width: 150px">
                      <q-item clickable v-close-popup @click="editDeduction(deduction)">
                        <q-item-section>Edit</q-item-section>
                      </q-item>
                      <q-item clickable v-close-popup @click="viewHistory(deduction)">
                        <q-item-section>History</q-item-section>
                      </q-item>
                      <q-item clickable v-close-popup @click="deleteDeduction(deduction)">
                        <q-item-section>Delete</q-item-section>
                      </q-item>
                    </q-list>
                  </q-menu>
                </q-btn>
              </q-item-section>
            </q-item>
          </q-list>

          <!-- Total -->
          <q-separator v-if="regularDeductions.length" class="q-my-md" />
          <div v-if="regularDeductions.length" class="row justify-between items-center">
            <div class="text-body-medium text-weight-medium">Total</div>
            <div class="text-body-medium text-negative text-weight-medium">
              -₱{{ formatAmount(totalRegularDeductions) }}
            </div>
          </div>
        </q-card>
      </div>

      <!-- Loans -->
      <div class="col-12 col-md-6">
        <q-card class="md3-surface">
          <div class="text-title-medium q-mb-md">Loans</div>

          <!-- Empty State -->
          <div v-if="!loans.length" class="text-center q-pa-md">
            <q-icon name="account_balance" size="48px" color="grey-5" />
            <div class="text-body2 text-grey-6 q-mt-sm">No active loans</div>
          </div>

          <!-- Loan List -->
          <q-list v-else>
            <q-item v-for="loan in loans" :key="loan.id" class="loan-item">
              <q-item-section>
                <q-item-label class="text-body-medium">{{ loan.name }}</q-item-label>
                <q-item-label caption> Balance: ₱{{ formatAmount(loan.balance) }} </q-item-label>
                <q-linear-progress
                  :value="loan.paidPercentage / 100"
                  :color="loan.paidPercentage > 80 ? 'positive' : 'primary'"
                  class="q-mt-xs"
                  style="height: 4px"
                />
                <q-item-label caption class="q-mt-xs">
                  {{ loan.paidPercentage.toFixed(1) }}% paid (₱{{ formatAmount(loan.totalPaid) }} of ₱{{
                    formatAmount(loan.totalAmount)
                  }})
                </q-item-label>
              </q-item-section>
              <q-item-section side top>
                <div class="text-center">
                  <div class="text-caption text-grey-7">Monthly</div>
                  <div class="text-label-medium text-negative">-₱{{ formatAmount(loan.monthlyPayment) }}</div>
                </div>
              </q-item-section>
              <q-item-section side top>
                <q-btn flat round icon="info" size="sm" @click="viewLoanDetails(loan)">
                  <q-tooltip>View Details</q-tooltip>
                </q-btn>
              </q-item-section>
            </q-item>
          </q-list>

          <!-- Summary -->
          <q-separator v-if="loans.length" class="q-my-md" />
          <div v-if="loans.length" class="loan-summary">
            <div class="row justify-between items-center q-mb-sm">
              <div class="text-body-small text-grey-7">Total Loan Balance</div>
              <div class="text-body-medium text-weight-medium">₱{{ formatAmount(summary.totalLoanBalance) }}</div>
            </div>
            <div class="row justify-between items-center">
              <div class="text-body-small text-grey-7">Monthly Payment</div>
              <div class="text-body-medium text-negative text-weight-medium">
                -₱{{ formatAmount(totalMonthlyLoanPayment) }}
              </div>
            </div>
          </div>
        </q-card>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, computed, onMounted, watch } from "vue";
import { api } from "src/boot/axios";

export default defineComponent({
  name: "DeductionTab",
  props: {
    employeeData: {
      type: Object,
      default: () => ({}),
    },
  },
  emits: ["cancel", "update"],
  setup(props, { emit }) {
    const isLoading = ref(false);
    const regularDeductions = ref([]);
    const loans = ref([]);
    const summary = ref({
      totalDeductions: 0,
      totalLoans: 0,
      totalLoanBalance: 0,
    });

    const isHistoryDialogOpen = ref(false);
    const isEditDialogOpen = ref(false);
    const isCreateDialogOpen = ref(false);
    const isLoanDetailsDialogOpen = ref(false);
    const selectedDeduction = ref(null);
    const selectedLoan = ref(null);

    const accountId = computed(() => props.employeeData?.data?.accountDetails?.id || "");

    const totalRegularDeductions = computed(() => {
      return regularDeductions.value.reduce((sum, d) => sum + d.amount, 0);
    });

    const totalMonthlyLoanPayment = computed(() => {
      return loans.value.reduce((sum, l) => sum + l.monthlyPayment, 0);
    });

    const formatAmount = (amount) => {
      return new Intl.NumberFormat("en-PH", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount || 0);
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

    const fetchDeductionData = async () => {
      if (!accountId.value) return;

      isLoading.value = true;
      try {
        const response = await api.get("/hris/employee/deductions", {
          params: { accountId: accountId.value },
        });

        if (response.data) {
          regularDeductions.value = response.data.regularDeductions || [];
          loans.value = response.data.loans || [];
          summary.value = response.data.summary || {};
        }
      } catch (error) {
        console.error("Error fetching deduction data:", error);
        api.$q.notify({
          type: "negative",
          message: "Failed to load deduction information",
        });
      } finally {
        isLoading.value = false;
      }
    };

    const addDeduction = () => {
      selectedDeduction.value = null;
      isCreateDialogOpen.value = true;
    };

    const viewHistory = (deduction) => {
      selectedDeduction.value = deduction;
      isHistoryDialogOpen.value = true;
    };

    const editDeduction = (deduction) => {
      selectedDeduction.value = deduction;
      isEditDialogOpen.value = true;
    };

    const deleteDeduction = (deduction) => {
      api.$q
        .dialog({
          title: "Confirm Delete",
          message: `Are you sure you want to delete the deduction "${deduction.name}"?`,
          cancel: true,
          persistent: true,
        })
        .onOk(async () => {
          try {
            await api.delete(`/hr-configuration/deduction/plan/${deduction.id}`);
            api.$q.notify({
              type: "positive",
              message: "Deduction deleted successfully",
            });
            refreshData();
          } catch (error) {
            api.$q.notify({
              type: "negative",
              message: "Failed to delete deduction",
            });
          }
        });
    };

    const viewLoanDetails = (loan) => {
      selectedLoan.value = loan;
      isLoanDetailsDialogOpen.value = true;
    };

    const refreshData = () => {
      fetchDeductionData();
      emit("update");
    };

    onMounted(() => {
      fetchDeductionData();
    });

    watch(
      () => props.employeeData,
      () => {
        fetchDeductionData();
      },
      { deep: true }
    );

    return {
      isLoading,
      regularDeductions,
      loans,
      summary,
      accountId,
      totalRegularDeductions,
      totalMonthlyLoanPayment,
      isHistoryDialogOpen,
      isEditDialogOpen,
      isCreateDialogOpen,
      isLoanDetailsDialogOpen,
      selectedDeduction,
      selectedLoan,
      formatAmount,
      formatPeriod,
      addDeduction,
      viewHistory,
      editDeduction,
      deleteDeduction,
      viewLoanDetails,
      refreshData,
    };
  },
});
</script>

<style lang="scss" scoped>
.deduction-tab {
  .md3-card {
    background: white;
    border-radius: 12px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    border: 1px solid #e0e0e0;
    transition: all 0.3s ease;

    &:hover {
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.12);
    }
  }

  .md3-button {
    border-radius: 20px;
    text-transform: none;
    padding: 8px 24px;
  }

  .deduction-item,
  .loan-item {
    padding: 12px 0;
    transition: all 0.3s ease;

    &:hover {
      background-color: #f8f9fa;
    }

    & + & {
      border-top: 1px solid #e0e0e0;
    }
  }

  .loan-summary {
    background-color: #f5f5f5;
    padding: 12px;
    border-radius: 8px;
  }

  .full-height {
    height: 100%;
  }
}
</style>
