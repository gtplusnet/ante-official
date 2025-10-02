<template>
  <q-dialog v-model="dialogVisible" persistent>
    <q-card style="width: 600px; max-width: 95vw;">
      <!-- Header -->
      <q-card-section class="row items-center q-pb-none">
        <q-icon name="approval" size="md" color="primary" class="q-mr-sm" />
        <span class="text-h6">Approve Liquidation</span>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-separator class="q-mt-md" />

      <!-- Loading State -->
      <div v-if="loading" class="q-pa-xl text-center">
        <q-spinner-dots size="50px" color="primary" />
        <div class="q-mt-md text-grey-6">Loading liquidation details...</div>
      </div>

      <!-- Content -->
      <q-card-section v-else-if="liquidationData" class="q-pt-sm">
        <!-- Approval Message -->
        <div class="approval-message q-mb-md q-pa-md bg-blue-1 rounded-borders">
          <q-icon name="info" color="blue" size="sm" class="q-mr-sm" />
          <span class="text-body2">
            By approving this liquidation, the amount will be recorded to the petty cash ledger.
          </span>
        </div>

        <!-- Liquidation Summary -->
        <div class="liquidation-summary">
          <!-- Receipt Information -->
          <div class="section-container q-mb-md">
            <div class="section-title text-weight-medium q-mb-sm">
              <q-icon name="receipt" size="xs" class="q-mr-xs" />
              Receipt Information
            </div>
            <div class="info-grid">
              <div class="info-row">
                <span class="info-label">Receipt Number:</span>
                <span class="info-value">{{ liquidationData.receiptNumber || '-' }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Receipt Date:</span>
                <span class="info-value">{{ formatDate(liquidationData.receiptDate) }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Amount:</span>
                <span class="info-value text-primary text-weight-bold">
                  {{ formatAmount(liquidationData.amount) }}
                </span>
              </div>
              <div class="info-row">
                <span class="info-label">Category:</span>
                <span class="info-value">{{ liquidationData.expenseCategory || '-' }}</span>
              </div>
            </div>
          </div>

          <!-- Vendor Information -->
          <div class="section-container q-mb-md" v-if="showVendorDetails">
            <div class="section-title text-weight-medium q-mb-sm">
              <q-icon name="store" size="xs" class="q-mr-xs" />
              Vendor Information
            </div>
            <div class="info-grid">
              <div class="info-row">
                <span class="info-label">Vendor Name:</span>
                <span class="info-value">{{ liquidationData.vendorName || '-' }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">TIN:</span>
                <span class="info-value">{{ liquidationData.vendorTin || '-' }}</span>
              </div>
            </div>
          </div>

          <!-- Tax Information -->
          <div class="section-container q-mb-md" v-if="showTaxDetails && (liquidationData.vatAmount || liquidationData.withholdingTaxAmount)">
            <div class="section-title text-weight-medium q-mb-sm">
              <q-icon name="receipt_long" size="xs" class="q-mr-xs" />
              Tax Information
            </div>
            <div class="info-grid">
              <div class="info-row">
                <span class="info-label">VAT (12%):</span>
                <span class="info-value">{{ formatAmount(liquidationData.vatAmount || 0) }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Withholding Tax:</span>
                <span class="info-value">{{ formatAmount(liquidationData.withholdingTaxAmount || 0) }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Net Amount:</span>
                <span class="info-value text-weight-bold">
                  {{ formatAmount(liquidationData.amount - (liquidationData.withholdingTaxAmount || 0)) }}
                </span>
              </div>
            </div>
          </div>

          <!-- Business Purpose -->
          <div class="section-container q-mb-md" v-if="liquidationData.businessPurpose">
            <div class="section-title text-weight-medium q-mb-sm">
              <q-icon name="description" size="xs" class="q-mr-xs" />
              Business Purpose
            </div>
            <div class="info-text">{{ liquidationData.businessPurpose }}</div>
          </div>

          <!-- Petty Cash Impact -->
          <div class="section-container" v-if="showPettyCashBalance && pettyCashHolder">
            <div class="section-title text-weight-medium q-mb-sm">
              <q-icon name="account_balance_wallet" size="xs" class="q-mr-xs" />
              Petty Cash Impact
            </div>
            <div class="info-grid">
              <div class="info-row">
                <span class="info-label">Petty Cash Holder:</span>
                <span class="info-value">{{ formatName(pettyCashHolder) }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Current Balance:</span>
                <span class="info-value">{{ formatAmount(pettyCashHolder.currentBalance) }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">After Approval:</span>
                <span class="info-value text-weight-bold" :class="balanceAfterClass">
                  {{ formatAmount(pettyCashHolder.currentBalance - liquidationData.amount) }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Optional Remarks -->
        <q-input
          v-if="requireRemarks"
          v-model="remarks"
          label="Approval Remarks (Optional)"
          type="textarea"
          outlined
          class="q-mt-md"
          rows="2"
        />
      </q-card-section>

      <!-- Error State -->
      <q-card-section v-else-if="error" class="text-center q-pa-xl">
        <q-icon name="error" size="xl" color="negative" />
        <div class="q-mt-md text-negative">{{ error }}</div>
      </q-card-section>

      <q-separator />

      <!-- Actions -->
      <q-card-actions align="right" class="q-pa-md">
        <q-btn 
          flat 
          label="Cancel" 
          color="grey" 
          @click="onCancel"
          :disable="processing"
        />
        <q-btn 
          unelevated 
          label="Approve Liquidation" 
          color="primary" 
          @click="onApprove"
          :loading="processing"
          :disable="loading || !!error"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script lang="ts">
import { defineComponent, ref, computed, watch, getCurrentInstance } from 'vue';
import { useQuasar } from 'quasar';

export default defineComponent({
  name: 'LiquidationApprovalDialog',
  props: {
    modelValue: {
      type: Boolean,
      default: false
    },
    liquidationId: {
      type: [Number, String],
      required: false,
      default: null
    },
    transition: {
      type: Object,
      default: null
    },
    showVendorDetails: {
      type: Boolean,
      default: true
    },
    showTaxDetails: {
      type: Boolean,
      default: true
    },
    showPettyCashBalance: {
      type: Boolean,
      default: true
    },
    requireRemarks: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update:modelValue', 'approved', 'cancelled'],
  setup(props, { emit }) {
    const $q = useQuasar();
    const instance = getCurrentInstance();
    const $api = instance?.appContext.config.globalProperties.$api;

    const dialogVisible = computed({
      get: () => props.modelValue,
      set: (val) => emit('update:modelValue', val)
    });

    const loading = ref(false);
    const processing = ref(false);
    const error = ref<string | null>(null);
    const liquidationData = ref<any>(null);
    const pettyCashHolder = ref<any>(null);
    const remarks = ref('');

    const balanceAfterClass = computed(() => {
      if (!pettyCashHolder.value || !liquidationData.value) return '';
      const balanceAfter = pettyCashHolder.value.currentBalance - liquidationData.value.amount;
      return balanceAfter < 0 ? 'text-negative' : 'text-positive';
    });

    const formatDate = (dateValue: any) => {
      if (!dateValue) return '-';
      if (typeof dateValue === 'object' && dateValue.dateTime) {
        return dateValue.dateTime;
      }
      if (typeof dateValue === 'object' && dateValue.date) {
        return dateValue.date;
      }
      return dateValue;
    };

    const formatAmount = (amount: any) => {
      if (amount === null || amount === undefined) return '₱0.00';
      if (typeof amount === 'object' && amount.formatCurrency) {
        return amount.formatCurrency;
      }
      const numAmount = Number(amount) || 0;
      return `₱${numAmount.toLocaleString('en-PH', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      })}`;
    };

    const formatName = (person: any) => {
      if (!person) return '-';
      if (typeof person === 'string') return person;
      return `${person.firstName || ''} ${person.lastName || ''}`.trim() || '-';
    };

    const loadLiquidationDetails = async () => {
      if (!props.liquidationId || !$api) {
        error.value = 'No liquidation ID provided';
        return;
      }

      loading.value = true;
      error.value = null;

      try {
        // Fetch liquidation details using table endpoint
        const tableResponse = await $api.put(`/petty-cash/liquidation/table?page=1&perPage=1`, {
          filters: [
            { column: 'id', value: Number(props.liquidationId), operator: 'eq' }
          ]
        });
        
        if (tableResponse.data?.list?.length > 0) {
          liquidationData.value = tableResponse.data.list[0];
          
          // Fetch petty cash holder details if available
          if (liquidationData.value.requestedBy?.id) {
            try {
              const holderResponse = await $api.get(`/petty-cash/holder/current`);
              pettyCashHolder.value = holderResponse.data;
            } catch (err) {
              console.error('Failed to load petty cash holder:', err);
              // Non-critical error, continue without holder details
            }
          }
        } else {
          throw new Error('Liquidation not found');
        }
      } catch (err: any) {
        console.error('Failed to load liquidation details:', err);
        error.value = err.response?.data?.message || 'Failed to load liquidation details';
      } finally {
        loading.value = false;
      }
    };

    const onApprove = async () => {
      processing.value = true;

      try {
        // Prepare approval data
        const approvalData: any = {
          remarks: remarks.value || undefined,
          action: props.transition?.buttonName || props.transition?.action || 'Approve'
        };

        // Call the dedicated approval API endpoint
        if (!$api) {
          throw new Error('API service not available');
        }
        const response = await $api.post(`/petty-cash/liquidation/${props.liquidationId}/approve-workflow`, approvalData);

        // Emit approval event with response data
        emit('approved', {
          approved: true,
          liquidationId: props.liquidationId,
          response: response.data,
          remarks: remarks.value
        });

        // Close dialog
        dialogVisible.value = false;

        // Show success notification
        $q.notify({
          type: 'positive',
          message: 'Liquidation approved and recorded to petty cash successfully',
          icon: 'check_circle'
        });
      } catch (err: any) {
        console.error('Failed to approve liquidation:', err);
        $q.notify({
          type: 'negative',
          message: err.response?.data?.message || err.message || 'Failed to approve liquidation',
          icon: 'error'
        });
      } finally {
        processing.value = false;
      }
    };

    const onCancel = () => {
      emit('cancelled');
      dialogVisible.value = false;
    };

    // Load data when dialog opens
    watch(dialogVisible, (newVal) => {
      if (newVal) {
        loadLiquidationDetails();
        remarks.value = '';
      } else {
        // Clear data when dialog closes
        liquidationData.value = null;
        pettyCashHolder.value = null;
        error.value = null;
      }
    });

    return {
      dialogVisible,
      loading,
      processing,
      error,
      liquidationData,
      pettyCashHolder,
      remarks,
      balanceAfterClass,
      formatDate,
      formatAmount,
      formatName,
      onApprove,
      onCancel
    };
  }
});
</script>

<style lang="scss" scoped>
.approval-message {
  display: flex;
  align-items: center;
  border-left: 3px solid $blue;
}

.section-container {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 12px;
}

.section-title {
  color: $primary;
  font-size: 14px;
  display: flex;
  align-items: center;
}

.info-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
}

.info-label {
  color: #757575;
  min-width: 120px;
}

.info-value {
  color: #212121;
  text-align: right;
  flex: 1;
}

.info-text {
  font-size: 13px;
  color: #212121;
  line-height: 1.5;
}
</style>