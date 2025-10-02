<template>
  <div class="liquidation-details">
    <!-- AI Extracted Badge with Total Confidence -->
    <div v-if="liquidationData.isAiExtracted" class="q-mb-md row items-center q-gutter-sm">
      <q-chip color="blue" text-color="white" icon="smart_toy">
        AI Extracted Data
      </q-chip>
      
      <!-- Total AI Confidence Display (Minified) -->
      <q-chip 
        v-if="liquidationData.totalAIConfidence !== undefined && liquidationData.totalAIConfidence >= 0"
        :color="getConfidenceChipColor(liquidationData.totalAIConfidence || 0)" 
        text-color="white" 
        size="sm"
        dense
      >
        <q-icon name="psychology" size="xs" class="q-mr-xs" />
        {{ liquidationData.totalAIConfidence }}% Confidence
        <q-tooltip>{{ getConfidenceLabel(liquidationData.totalAIConfidence || 0) }} AI Confidence</q-tooltip>
      </q-chip>
    </div>

    <!-- Receipt Information -->
    <div class="section-container q-mb-md">
      <div class="section-title">
        <q-icon name="receipt" size="sm" class="q-mr-sm" />
        Receipt Information
      </div>
      <div class="info-grid">
        <div class="info-item">
          <div class="info-label">Receipt Number</div>
          <div class="info-value">{{ liquidationData.receiptNumber || '-' }}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Receipt Date</div>
          <div class="info-value">{{ formatDate(liquidationData.receiptDate) }}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Amount</div>
          <div class="info-value text-primary text-weight-bold">
            {{ formatAmount(liquidationData.amount) }}
          </div>
        </div>
        <div class="info-item">
          <div class="info-label">Category</div>
          <div class="info-value">{{ liquidationData.expenseCategory || '-' }}</div>
        </div>
      </div>
    </div>

    <!-- Tax Information -->
    <div class="section-container q-mb-md">
      <div class="section-title">
        <q-icon name="receipt_long" size="sm" class="q-mr-sm" />
        Tax Information
      </div>
      <div class="info-grid">
        <div class="info-item">
          <div class="info-label">VAT Amount (12%)</div>
          <div class="info-value">
            {{ formatAmount(liquidationData.vatAmount || 0) }}
          </div>
        </div>
        <div class="info-item">
          <div class="info-label">Withholding Tax</div>
          <div class="info-value">
            {{ formatAmount(liquidationData.withholdingTaxAmount || 0) }}
          </div>
        </div>
        <div class="info-item">
          <div class="info-label">Total Tax</div>
          <div class="info-value text-weight-medium">
            {{ formatAmount(calculateTotalTax()) }}
          </div>
        </div>
        <div class="info-item">
          <div class="info-label">Net Amount (After Tax)</div>
          <div class="info-value text-weight-bold text-primary">
            {{ formatAmount(calculateNetAmount()) }}
          </div>
        </div>
      </div>
    </div>

    <!-- Vendor Information -->
    <div class="section-container q-mb-md">
      <div class="section-title">
        <q-icon name="store" size="sm" class="q-mr-sm" />
        Vendor Information
      </div>
      <div class="info-grid">
        <div class="info-item">
          <div class="info-label">Vendor Name</div>
          <div class="info-value">{{ liquidationData.vendorName || '-' }}</div>
        </div>
        <div class="info-item">
          <div class="info-label">TIN</div>
          <div class="info-value">{{ liquidationData.vendorTin || '-' }}</div>
        </div>
        <div class="info-item full-width">
          <div class="info-label">Address</div>
          <div class="info-value">{{ liquidationData.vendorAddress || '-' }}</div>
        </div>
      </div>
    </div>

    <!-- Purpose & Description -->
    <div class="section-container q-mb-md" v-if="liquidationData.businessPurpose || liquidationData.description">
      <div class="section-title">
        <q-icon name="description" size="sm" class="q-mr-sm" />
        Purpose & Description
      </div>
      <div class="info-item full-width" v-if="liquidationData.businessPurpose">
        <div class="info-label">Business Purpose</div>
        <div class="info-value">{{ liquidationData.businessPurpose }}</div>
      </div>
      <div class="info-item full-width q-mt-sm" v-if="liquidationData.description">
        <div class="info-label">Description</div>
        <div class="info-value">{{ liquidationData.description }}</div>
      </div>
    </div>

    <!-- Requester Information -->
    <div class="section-container q-mb-md" v-if="liquidationData.requestedBy">
      <div class="section-title">
        <q-icon name="person" size="sm" class="q-mr-sm" />
        Requested By
      </div>
      <div class="info-grid">
        <div class="info-item">
          <div class="info-label">Name</div>
          <div class="info-value">{{ formatName(liquidationData.requestedBy) }}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Email</div>
          <div class="info-value">{{ liquidationData.requestedBy.email || '-' }}</div>
        </div>
      </div>
    </div>

    <!-- Receipt Image -->
    <div class="section-container q-mb-md" v-if="liquidationData.attachmentProof">
      <div class="section-title">
        <q-icon name="image" size="sm" class="q-mr-sm" />
        Receipt Image
      </div>
      <div class="text-center q-mt-md">
        <q-img
          :src="liquidationData.attachmentProof.url"
          style="max-width: 300px; max-height: 300px; cursor: pointer;"
          fit="contain"
          class="rounded-borders shadow-2"
          @click="$emit('view-image', liquidationData.attachmentProof)"
        >
          <div class="absolute-bottom text-caption text-center bg-black text-white" style="padding: 4px;">
            Click to view full size
          </div>
        </q-img>
        <div class="q-mt-sm text-caption text-grey-6">
          {{ liquidationData.attachmentProof.originalName || liquidationData.attachmentProof.name || 'Receipt' }}
        </div>
      </div>
    </div>

    <!-- Status Information -->
    <div class="section-container" v-if="showStatus">
      <div class="section-title">
        <q-icon name="info" size="sm" class="q-mr-sm" />
        Status Information
      </div>
      <div class="info-grid">
        <div class="info-item">
          <div class="info-label">Status</div>
          <div class="info-value">
            <workflow-status-badge
              v-if="liquidationData.workflowStage"
              :stage="liquidationData.workflowStage"
              size="sm"
              dense
            />
            <q-chip 
              v-else-if="liquidationData.status"
              :color="getStatusColor(liquidationData.status)" 
              text-color="white" 
              size="sm"
              dense
            >
              {{ liquidationData.status?.text || 'Pending' }}
            </q-chip>
            <span v-else>-</span>
          </div>
        </div>
        <div class="info-item">
          <div class="info-label">Created</div>
          <div class="info-value">{{ formatDate(liquidationData.createdAt) }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import WorkflowStatusBadge from '../../../../components/workflow/WorkflowStatusBadge.vue';
import type { ILiquidation } from '@/shared/interfaces/liquidation.interfaces';

export default defineComponent({
  name: 'LiquidationDetails',
  components: {
    WorkflowStatusBadge
  },
  props: {
    liquidationData: {
      type: Object as PropType<ILiquidation>,
      required: true,
      validator: (value: any) => {
        return value && typeof value.id === 'number';
      }
    },
    showStatus: {
      type: Boolean,
      default: true
    }
  },
  emits: ['view-image'],
  methods: {
    formatDate(dateObj: any): string {
      if (!dateObj) return '-';
      if (typeof dateObj === 'object' && dateObj.dateTime) return dateObj.dateTime;
      if (typeof dateObj === 'object' && dateObj.date) return dateObj.date;
      if (typeof dateObj === 'string') return dateObj;
      return '-';
    },
    formatAmount(amountObj: any): string {
      if (amountObj === null || amountObj === undefined) return '₱0.00';
      if (typeof amountObj === 'object' && amountObj.formatCurrency) return amountObj.formatCurrency;
      const amount = this.getAmountValue(amountObj);
      return `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    },
    getAmountValue(amountObj: any): number {
      if (!amountObj) return 0;
      if (typeof amountObj === 'object' && amountObj.raw !== undefined) return amountObj.raw;
      return Number(amountObj) || 0;
    },
    calculateTotalTax(): number {
      const vat = this.getAmountValue(this.liquidationData.vatAmount);
      const withholding = this.getAmountValue(this.liquidationData.withholdingTaxAmount);
      return vat + withholding;
    },
    calculateNetAmount(): number {
      const amount = this.getAmountValue(this.liquidationData.amount);
      const withholding = this.getAmountValue(this.liquidationData.withholdingTaxAmount);
      return amount - withholding;
    },
    formatName(person: any): string {
      if (!person) return '-';
      return `${person.firstName || ''} ${person.lastName || ''}`.trim() || '-';
    },
    getStatusColor(status: any): string {
      if (!status) return 'grey';
      const text = status.text?.toLowerCase() || '';
      if (text.includes('approved')) return 'positive';
      if (text.includes('rejected')) return 'negative';
      if (text.includes('pending')) return 'warning';
      return 'grey';
    },
    getConfidenceChipColor(confidence: number): string {
      if (confidence >= 75) return 'green';
      if (confidence >= 50) return 'orange';
      return 'red';
    },
    getConfidenceLabel(confidence: number): string {
      if (confidence >= 90) return 'Excellent';
      if (confidence >= 75) return 'High';
      if (confidence >= 50) return 'Medium';
      if (confidence >= 25) return 'Low';
      return 'Very Low';
    }
  }
});
</script>

<style scoped lang="scss">
.liquidation-details {
  width: 100%;
}

.section-container {
  background: var(--q-bg-secondary, #f5f5f5);
  border-radius: 8px;
  padding: 16px;
}

.section-title {
  font-weight: 600;
  color: var(--q-primary);
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--q-separator-color, #e0e0e0);
  font-size: 14px;
  gap: 8px;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  
  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
}

.info-item {
  &.full-width {
    grid-column: 1 / -1;
  }
}

.info-label {
  font-size: 12px;
  color: var(--q-text-caption, #757575);
  margin-bottom: 4px;
}

.info-value {
  font-size: 14px;
  color: var(--q-text-primary, #212121);
  word-break: break-word;
}
</style>