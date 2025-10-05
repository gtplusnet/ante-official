<template>
  <div class="card-items q-py-sm">
    <!-- Loading State -->
    <div v-if="loading" class="q-pa-md text-center">
      <q-spinner-dots size="40px" color="primary" />
      <div class="q-mt-sm">Loading pending approvals...</div>
    </div>

    <!-- Empty State -->
    <div v-else-if="!pendingApprovals.length" class="q-pa-xl text-center text-grey-6">
      <q-icon name="task_alt" size="80px" class="q-mb-md" />
      <div class="text-h6">No Pending Approvals</div>
      <div class="text-body2">All payrolls have been reviewed</div>
    </div>

    <!-- List Item Card -->
    <div
      v-for="(item, index) in pendingApprovals"
      :key="index"
      class="process-item q-pa-md q-my-sm cursor-pointer"
      @click="showPayrollApprovalDialog(item)"
    >
      <!-- Left -->
      <div class="column items-start justify-center">
        <span class="text-label-large">
          {{ formatDateRange(item.startDate, item.endDate) }}
        </span>
        <span class="q-py-xs text-body-medium">{{ item.payrollGroup }} - {{ item.employeeCount }} employees</span>
        <div class="row items-center q-gutter-xs text-body-medium">
          <q-chip
            dense
            size="sm"
            color="orange"
            text-color="white"
          >
            Level {{ item.approvalLevel }} of {{ item.maxApprovalLevel }}
          </q-chip>
        </div>
      </div>

      <!-- Right -->
      <div class="column">
        <div class="column text-right">
          <span class="text-body-medium">
            ₱{{ formatAmount(item.totalNetPay) }}
          </span>
          <span class="text-grey-7 text-body-medium">Total Net Pay</span>
        </div>
      </div>
    </div>
  </div>

  <!-- Payroll Approval Dialog -->
  <PayrollApprovalDialog
    v-model="openApprovalDialog"
    :payrollData="selectedPayroll"
    @approved="handleApproved"
    @rejected="handleRejected"
  />
</template>

<script lang="ts">
import { onMounted, ref, watch, defineAsyncComponent } from 'vue';
import { api } from 'src/boot/axios';
import { useQuasar } from 'quasar';
import { handleAxiosError } from '../../../../../../utility/axios.error.handler';
import { AxiosError } from 'axios';

// Lazy-loaded dialogs (ALL dialogs must be lazy loaded - CLAUDE.md)
const PayrollApprovalDialog = defineAsyncComponent(() =>
  import('../../../dialogs/payroll/PayrollApprovalDialog.vue')
);

interface PendingApproval {
  taskId: string;
  cutoffId: string;
  payrollGroup: string;
  startDate: string;
  endDate: string;
  processingDate: string;
  employeeCount: number;
  totalNetPay: number;
  totalGrossPay: number;
  totalDeductions: number;
  totalGovernmentContributions: number;
  approvalLevel: number;
  maxApprovalLevel: number;
}

export default {
  name: 'PayrollApprove',
  components: {
    PayrollApprovalDialog,
  },
  props: {
    selectedDateRange: {
      type: Object,
      default: null,
    },
  },

  setup(props, { emit }) {
    const $q = useQuasar();
    const loading = ref(false);
    const openApprovalDialog = ref(false);
    const selectedPayroll = ref<PendingApproval | null>(null);
    const pendingApprovals = ref<PendingApproval[]>([]);

    const fetchPendingApprovals = async () => {
      try {
        loading.value = true;
        const response = await api.get('/payroll-approval/pending');
        pendingApprovals.value = response.data;
        emit('update-count', pendingApprovals.value.length);
      } catch (error) {
        handleAxiosError($q, error as AxiosError);
      } finally {
        loading.value = false;
      }
    };

    const showPayrollApprovalDialog = (item: PendingApproval) => {
      selectedPayroll.value = item;
      openApprovalDialog.value = true;
    };

    const handleApproved = async () => {
      $q.notify({
        type: 'positive',
        message: 'Payroll approved successfully',
      });
      await fetchPendingApprovals();
    };

    const handleRejected = async () => {
      $q.notify({
        type: 'warning',
        message: 'Payroll has been rejected',
      });
      await fetchPendingApprovals();
    };

    const formatDateRange = (startDate: string, endDate: string) => {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const options: Intl.DateTimeFormatOptions = {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      };
      return `${start.toLocaleDateString('en-US', options)} to ${end.toLocaleDateString('en-US', options)}`;
    };

    const formatAmount = (amount: number) => {
      return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
    };

    onMounted(() => {
      fetchPendingApprovals();
    });

    watch(
      () => pendingApprovals.value,
      (newVal) => {
        emit('update-count', newVal.length);
      },
      { deep: true }
    );

    return {
      loading,
      pendingApprovals,
      openApprovalDialog,
      selectedPayroll,
      showPayrollApprovalDialog,
      handleApproved,
      handleRejected,
      formatDateRange,
      formatAmount,
    };
  },
};
</script>
