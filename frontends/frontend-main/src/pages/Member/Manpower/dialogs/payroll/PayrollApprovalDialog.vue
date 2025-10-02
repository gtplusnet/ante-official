<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    persistent
    :maximized="$q.screen.lt.md"
    :transition-show="$q.screen.lt.md ? 'slide-up' : 'scale'"
    :transition-hide="$q.screen.lt.md ? 'slide-down' : 'scale'"
  >
    <q-card flat class="dialog-card" :class="{ 'fullscreen': $q.screen.lt.md }">
      <!-- Fixed Header -->
      <q-card-section class="dialog-header q-pa-lg">
        <div class="row items-start">
          <div class="col">
            <div class="text-h5 text-weight-regular">Payroll Approval</div>
            <div class="text-body2 text-grey-7 q-mt-xs">{{ payrollDetails?.payrollGroup || 'Loading...' }}</div>
          </div>
          <q-btn
            flat
            round
            dense
            icon="close"
            v-close-popup
          />
        </div>
      </q-card-section>

      <!-- Scrollable Content -->
      <q-card-section class="dialog-content">
        <div v-if="loading" class="q-py-xl">
          <div class="text-center">
            <q-circular-progress indeterminate size="40px" color="primary" :thickness="3" />
            <div class="text-body2 text-grey-7 q-mt-md">Loading payroll details...</div>
          </div>
        </div>

        <div v-else-if="payrollDetails" class="q-pa-sm">
          <!-- Period and Status -->
          <div class="row items-center justify-between q-mb-lg">
            <div>
              <div class="text-overline text-grey-7">PAYROLL PERIOD</div>
              <div class="text-body1">{{ formatDateRange(payrollDetails.startDate, payrollDetails.endDate) }}</div>
            </div>
            <q-badge
              flat
              :color="payrollData?.approvalLevel === payrollData?.maxApprovalLevel ? 'green-2' : 'orange-2'"
              :text-color="payrollData?.approvalLevel === payrollData?.maxApprovalLevel ? 'green-9' : 'orange-9'"
              class="q-pa-sm"
            >
              Level {{ payrollData?.approvalLevel || 1 }} of {{ payrollData?.maxApprovalLevel || 1 }}
            </q-badge>
          </div>

          <!-- Summary Cards - MD3 Style -->
          <div class="row q-col-gutter-md q-mb-lg">
            <div class="col-6 col-md-3">
              <div class="summary-card">
                <div class="text-overline text-grey-7">EMPLOYEES</div>
                <div class="text-h6 text-weight-medium">{{ payrollDetails.employeeCount }}</div>
              </div>
            </div>
            <div class="col-6 col-md-3">
              <div class="summary-card">
                <div class="text-overline text-grey-7">GROSS PAY</div>
                <div class="text-h6 text-weight-medium">₱{{ formatAmount(payrollDetails.totalGrossPay) }}</div>
              </div>
            </div>
            <div class="col-6 col-md-3">
              <div class="summary-card">
                <div class="text-overline text-grey-7">DEDUCTIONS</div>
                <div class="text-h6 text-weight-medium text-red-8">₱{{ formatAmount(payrollDetails.totalDeductions) }}</div>
              </div>
            </div>
            <div class="col-6 col-md-3">
              <div class="summary-card">
                <div class="text-overline text-grey-7">NET PAY</div>
                <div class="text-h6 text-weight-medium text-green-8">₱{{ formatAmount(payrollDetails.totalNetPay) }}</div>
              </div>
            </div>
          </div>

          <!-- Details Section - MD3 Style -->
          <div class="q-mb-lg">
            <div class="text-subtitle1 text-weight-medium q-mb-md">Payroll Details</div>

            <!-- Earnings -->
            <div class="detail-section q-mb-md">
              <div class="text-overline text-grey-7 q-mb-sm">EARNINGS</div>
              <div class="detail-row">
                <span class="text-body2">Basic Pay</span>
                <span class="text-body2 text-weight-medium">₱{{ formatAmount(payrollDetails.totalBasicPay) }}</span>
              </div>
              <div class="detail-row">
                <span class="text-body2">Allowances</span>
                <span class="text-body2 text-weight-medium">₱{{ formatAmount(payrollDetails.totalAllowance) }}</span>
              </div>
              <div class="detail-row">
                <span class="text-body2">Additional Earnings</span>
                <span class="text-body2 text-weight-medium">₱{{ formatAmount(payrollDetails.totalAdditionalEarnings) }}</span>
              </div>
            </div>

            <!-- Deductions -->
            <div class="detail-section q-mb-md">
              <div class="text-overline text-grey-7 q-mb-sm">DEDUCTIONS</div>
              <div class="detail-row">
                <span class="text-body2">Government Contributions</span>
                <span class="text-body2 text-weight-medium">₱{{ formatAmount(payrollDetails.totalGovernmentContributions) }}</span>
              </div>
            </div>

            <!-- Information -->
            <div class="detail-section">
              <div class="text-overline text-grey-7 q-mb-sm">INFORMATION</div>
              <div class="detail-row">
                <span class="text-body2">Processing Date</span>
                <span class="text-body2 text-weight-medium">{{ formatDate(payrollDetails.processingDate) }}</span>
              </div>
              <div class="detail-row">
                <span class="text-body2">Status</span>
                <q-badge
                  flat
                  :color="payrollDetails.status === 'APPROVED' ? 'green-2' : 'orange-2'"
                  :text-color="payrollDetails.status === 'APPROVED' ? 'green-9' : 'orange-9'"
                  :label="payrollDetails.status || 'PENDING'"
                />
              </div>
            </div>
          </div>

          <!-- Approval History - MD3 Style -->
          <div v-if="payrollDetails.approvalHistory?.length" class="q-mb-lg">
            <div class="text-subtitle1 text-weight-medium q-mb-md">Approval History</div>
            <div class="approval-list">
              <div
                v-for="(history, index) in payrollDetails.approvalHistory"
                :key="index"
                class="approval-item"
              >
                <div class="row items-center q-mb-xs">
                  <q-icon
                    :name="history.action === 'APPROVED' ? 'check_circle' : 'cancel'"
                    :color="history.action === 'APPROVED' ? 'green-7' : 'red-7'"
                    size="20px"
                    class="q-mr-sm"
                  />
                  <span class="text-body2 text-weight-medium">Level {{ history.level }}</span>
                  <q-badge
                    flat
                    :color="history.action === 'APPROVED' ? 'green-2' : 'red-2'"
                    :text-color="history.action === 'APPROVED' ? 'green-9' : 'red-9'"
                    :label="history.action"
                    class="q-ml-sm"
                  />
                </div>
                <div class="text-body2 text-grey-7">{{ history.approver }}</div>
                <div class="text-caption text-grey-6">{{ formatDateTime(history.date) }}</div>
                <div v-if="history.remarks" class="text-body2 text-grey-8 q-mt-sm q-ml-lg">
                  "{{ history.remarks }}"
                </div>
              </div>
            </div>
          </div>

        </div>
      </q-card-section>

      <!-- Sticky Bottom Actions -->
      <q-card-actions class="dialog-actions q-pa-lg">
        <q-btn
          flat
          label="View Details"
          color="primary"
          @click="viewEmployeeList"
          :loading="loading"
          class="md3-btn"
        />
        <q-space />
        <q-btn
          flat
          label="Cancel"
          @click="close"
          :disabled="approving || rejecting"
          class="md3-btn"
        />
        <q-btn
          flat
          label="Reject"
          color="negative"
          :loading="rejecting"
          :disabled="approving"
          @click="handleReject"
          class="md3-btn"
        />
        <q-btn
          unelevated
          label="Approve"
          color="primary"
          :loading="approving"
          :disabled="rejecting"
          @click="handleApprove"
          class="md3-btn"
        />
      </q-card-actions>
    </q-card>

    <!-- Payroll Summary Dialog -->
    <ManpowerPayrollSummaryDialog
      v-if="selectedPayrollForDetails"
      v-model="showPayrollSummaryDialog"
      :selectedPayroll="selectedPayrollForDetails"
      :enableDiscussionButton="false"
    />

    <!-- Rejection Reason Dialog -->
    <q-dialog
      v-model="showRejectionDialog"
      persistent
      :maximized="$q.screen.lt.sm"
      :transition-show="$q.screen.lt.sm ? 'slide-up' : 'scale'"
      :transition-hide="$q.screen.lt.sm ? 'slide-down' : 'scale'"
    >
      <q-card class="rejection-dialog-card" :class="{ 'fullscreen': $q.screen.lt.sm }">
        <q-card-section class="q-pb-sm">
          <div class="row items-start">
            <div class="col">
              <div class="text-h6">Reject Payroll</div>
              <div class="text-caption text-grey-7">Please provide a reason for rejection</div>
            </div>
            <q-btn
              flat
              round
              dense
              icon="close"
              v-close-popup
              class="q-ml-sm"
            />
          </div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <q-input
            v-model="rejectionReason"
            label="Rejection reason"
            placeholder="Enter your reason for rejecting this payroll..."
            type="textarea"
            rows="4"
            outlined
            autofocus
            :rules="[val => !!val || 'Rejection reason is required']"
            class="md3-input"
            ref="rejectionInput"
          />
        </q-card-section>

        <q-card-actions align="right" class="q-pa-md">
          <q-btn
            flat
            label="Cancel"
            @click="showRejectionDialog = false"
            :disabled="rejecting"
            class="md3-btn"
          />
          <q-btn
            unelevated
            label="Confirm Rejection"
            color="negative"
            :loading="rejecting"
            :disabled="!rejectionReason"
            @click="confirmRejection"
            class="md3-btn"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-dialog>
</template>

<script lang="ts">
import { defineComponent, ref, watch, PropType } from 'vue';
import { useQuasar } from 'quasar';
import { api } from 'src/boot/axios';
import { handleAxiosError } from '../../../../../utility/axios.error.handler';
import { AxiosError } from 'axios';
import ManpowerPayrollSummaryDialog from './ManpowerPayrollSummaryDialog.vue';
import { CutoffDateRangeResponse } from '@shared/response';

interface PayrollApproval {
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

interface PayrollDetails extends PayrollApproval {
  status: string;
  totalBasicPay: number;
  totalAllowance: number;
  totalAdditionalEarnings: number;
  approvalHistory: Array<{
    action: string;
    level: number;
    approver: string;
    remarks: string | null;
    date: string;
  }>;
}

export default defineComponent({
  name: 'PayrollApprovalDialog',
  components: {
    ManpowerPayrollSummaryDialog,
  },
  props: {
    modelValue: {
      type: Boolean,
      required: true,
    },
    payrollData: {
      type: Object as PropType<PayrollApproval | null>,
      default: null,
    },
  },
  emits: ['update:modelValue', 'approved', 'rejected'],
  setup(props, { emit }) {
    const $q = useQuasar();
    const loading = ref(false);
    const approving = ref(false);
    const rejecting = ref(false);
    const showRejectionDialog = ref(false);
    const rejectionReason = ref('');
    const payrollDetails = ref<PayrollDetails | null>(null);
    const showPayrollSummaryDialog = ref(false);
    const selectedPayrollForDetails = ref<CutoffDateRangeResponse | null>(null);

    const fetchPayrollDetails = async () => {
      if (!props.payrollData) return;

      try {
        loading.value = true;
        const response = await api.get(`/payroll-approval/cutoff/${props.payrollData.cutoffId}`);
        payrollDetails.value = {
          ...props.payrollData,
          ...response.data,
        };
      } catch (error) {
        handleAxiosError($q, error as AxiosError);
      } finally {
        loading.value = false;
      }
    };

    const handleApprove = async () => {
      if (!props.payrollData) return;

      try {
        approving.value = true;
        await api.post(`/payroll-approval/approve/${props.payrollData.cutoffId}`);

        $q.notify({
          type: 'positive',
          message: 'Payroll approved successfully',
        });

        emit('approved');
        close();
      } catch (error) {
        handleAxiosError($q, error as AxiosError);
      } finally {
        approving.value = false;
      }
    };

    const handleReject = () => {
      rejectionReason.value = '';
      showRejectionDialog.value = true;
    };

    const confirmRejection = async () => {
      if (!props.payrollData || !rejectionReason.value) return;

      try {
        rejecting.value = true;
        await api.post(`/payroll-approval/reject/${props.payrollData.cutoffId}`, {
          remarks: rejectionReason.value,
        });

        $q.notify({
          type: 'warning',
          message: 'Payroll has been rejected',
        });

        showRejectionDialog.value = false;
        emit('rejected');
        close();
      } catch (error) {
        handleAxiosError($q, error as AxiosError);
      } finally {
        rejecting.value = false;
      }
    };

    const viewEmployeeList = async () => {
      if (!props.payrollData || !payrollDetails.value) return;

      try {
        $q.loading.show();

        // Fetch the full cutoff details by getting the list and filtering
        const response = await api.get('/hr-processing/get-cutoff-list', {
          params: {
            status: payrollDetails.value.status || 'PROCESSED'
          }
        });

        // Find the specific cutoff from the list
        const cutoffData = response.data.find((cutoff: CutoffDateRangeResponse) => cutoff.key === props.payrollData!.cutoffId);

        if (!cutoffData) {
          throw new Error('Cutoff details not found');
        }

        selectedPayrollForDetails.value = cutoffData;
        showPayrollSummaryDialog.value = true;
      } catch (error) {
        handleAxiosError($q, error as AxiosError);
        $q.notify({
          type: 'negative',
          message: 'Failed to load payroll details',
        });
      } finally {
        $q.loading.hide();
      }
    };

    const close = () => {
      showRejectionDialog.value = false;
      rejectionReason.value = '';
      emit('update:modelValue', false);
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

    const formatDate = (date: string) => {
      return new Date(date).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    };

    const formatDateTime = (date: string) => {
      return new Date(date).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    };

    const formatAmount = (amount: number) => {
      return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount || 0);
    };

    watch(() => props.modelValue, (newVal) => {
      if (newVal && props.payrollData) {
        fetchPayrollDetails();
      }
    });

    return {
      loading,
      approving,
      rejecting,
      showRejectionDialog,
      rejectionReason,
      payrollDetails,
      showPayrollSummaryDialog,
      selectedPayrollForDetails,
      handleApprove,
      handleReject,
      confirmRejection,
      viewEmployeeList,
      close,
      formatDateRange,
      formatDate,
      formatDateTime,
      formatAmount,
    };
  },
});
</script>

<style scoped>
/* Material Design 3 Styles */
.dialog-card {
  width: 900px;
  max-width: 95vw;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  border-radius: 16px;
  overflow: hidden;
}

/* Fixed Header */
.dialog-header {
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  flex-shrink: 0;
}

/* Scrollable Content */
.dialog-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
}

/* Sticky Actions */
.dialog-actions {
  border-top: 1px solid rgba(0, 0, 0, 0.08);
  background-color: rgba(0, 0, 0, 0.02);
  flex-shrink: 0;
}

/* Summary Cards */
.summary-card {
  padding: 20px;
  background-color: rgba(0, 0, 0, 0.04);
  border-radius: 12px;
  height: 100%;
}

/* Detail Sections */
.detail-section {
  padding: 16px;
  background-color: rgba(0, 0, 0, 0.02);
  border-radius: 12px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
}

.detail-row:not(:last-child) {
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

/* Approval History */
.approval-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.approval-item {
  padding: 16px;
  background-color: rgba(0, 0, 0, 0.02);
  border-radius: 12px;
}

/* MD3 Buttons */
.md3-btn {
  border-radius: 20px;
  text-transform: none;
  font-weight: 500;
  letter-spacing: 0.1px;
  padding: 0 24px;
  height: 40px;
}

.md3-btn:hover:not(:disabled) {
  background-color: rgba(0, 0, 0, 0.04);
}

/* MD3 Input */
.md3-input :deep(.q-field__control) {
  border-radius: 4px;
}

.md3-input :deep(.q-field__control:hover):before {
  border-color: rgba(0, 0, 0, 0.87);
}

/* Remove all hover transforms and shadows */
* {
  transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease;
}

/* Scrollbar styling */
.dialog-content::-webkit-scrollbar {
  height: 6px;
  width: 6px;
}

.dialog-content::-webkit-scrollbar-track {
  background: transparent;
}

.dialog-content::-webkit-scrollbar-thumb {
  background-color: #d9d9d9;
    border-radius: 50px;
}

.dialog-content::-webkit-scrollbar-track {
  background-color: #f4f4f4;
  border-radius: 50px;
}

/* Rejection Dialog */
.rejection-dialog-card {
  min-width: 400px;
  max-width: 500px;
  border-radius: 20px;
}

/* Fullscreen mode for mobile/tablet */
.dialog-card.fullscreen {
  width: 100vw !important;
  height: 100dvh !important;
  max-width: 100vw !important;
  max-height: 100dvh !important;
  border-radius: 0 !important;
  margin: 0 !important;
}

.rejection-dialog-card.fullscreen {
  width: 100vw !important;
  height: 100vh !important;
  max-width: 100vw !important;
  max-height: 100vh !important;
  border-radius: 0 !important;
  margin: 0 !important;
}

/* Responsive adjustments for tablets */
@media (max-width: 768px) {
  .dialog-card.fullscreen .dialog-header,
  .dialog-card.fullscreen .dialog-content,
  .dialog-card.fullscreen .dialog-actions {
    padding: 16px !important;
  }

  /* Stack action buttons vertically on small screens */
  .dialog-card.fullscreen .dialog-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .dialog-card.fullscreen .dialog-actions .q-btn {
    width: 100%;
    margin: 4px 0;
  }

  .dialog-card.fullscreen .dialog-actions .q-space {
    display: none;
  }
}

/* Additional mobile adjustments */
@media (max-width: 600px) {
  /* Smaller padding on mobile */
  .dialog-card.fullscreen .dialog-header,
  .dialog-card.fullscreen .dialog-content,
  .dialog-card.fullscreen .dialog-actions {
    padding: 12px !important;
  }

  /* Adjust summary cards to be single column on mobile */
  .dialog-card.fullscreen .col-6 {
    width: 100% !important;
    max-width: 100% !important;
    flex: 0 0 100% !important;
  }
}
</style>
