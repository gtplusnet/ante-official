<template>
  <div class="workflow-details-container">
    <!-- Liquidation Details -->
    <div v-if="sourceModule === 'petty_cash_liquidation'" class="workflow-content">
      <!-- Error state -->
      <q-banner v-if="error && !liquidationData" class="bg-warning text-white q-mb-md" rounded>
        <template v-slot:avatar>
          <q-icon name="warning" color="white" />
        </template>
        {{ error }}
      </q-banner>
      
      <!-- Loading state -->
      <div v-if="loading" class="text-center q-pa-md">
        <q-spinner color="primary" size="40px" />
        <div class="q-mt-sm text-grey-6">Loading liquidation details...</div>
      </div>
      
      <!-- Liquidation details -->
      <liquidation-details 
        v-else-if="liquidationData"
        :liquidation-data="liquidationData"
        :show-status="false"
        @view-image="$emit('view-image', $event)"
      />
      
      <!-- Empty state -->
      <div v-else-if="!loading && !error" class="text-center q-pa-xl text-grey-6">
        <q-icon name="info" size="48px" />
        <div class="q-mt-md">No liquidation details available</div>
      </div>

      <q-separator class="q-my-md" />

      <!-- Workflow Status Section -->
      <div class="detail-section">
        <h6 class="section-title">Workflow Status</h6>
        
        <div class="detail-row">
          <span class="detail-label">Current Stage:</span>
          <q-chip 
            :style="{
              backgroundColor: currentStage?.color || '#808080',
              color: currentStage?.textColor || '#FFFFFF'
            }"
            dense
          >
            {{ currentStage?.name || 'Unknown' }}
          </q-chip>
        </div>

        <div class="detail-row">
          <span class="detail-label">Started:</span>
          <span class="detail-value">{{ formatDate(instance?.startedAt) }}</span>
        </div>

        <div class="detail-row">
          <span class="detail-label">Workflow:</span>
          <span class="detail-value">{{ workflowName }}</span>
        </div>
      </div>
    </div>

    <!-- Purchase Request Details (can be added later) -->
    <div v-else-if="sourceModule === 'PURCHASE_REQUEST'" class="workflow-content">
      <div class="detail-section">
        <h6 class="section-title">Purchase Request Information</h6>
        <!-- Add purchase request specific fields here -->
      </div>
    </div>

    <!-- HR Filing Details (can be added later) -->
    <div v-else-if="sourceModule === 'HR_FILING'" class="workflow-content">
      <div class="detail-section">
        <h6 class="section-title">HR Filing Information</h6>
        <!-- Add HR filing specific fields here -->
      </div>
    </div>

    <!-- Default/Unknown workflow type -->
    <div v-else class="workflow-content">
      <div class="detail-section">
        <h6 class="section-title">Workflow Information</h6>
        
        <div class="detail-row">
          <span class="detail-label">Module:</span>
          <span class="detail-value">{{ formatModule(sourceModule) }}</span>
        </div>

        <div class="detail-row">
          <span class="detail-label">Reference ID:</span>
          <span class="detail-value">#{{ sourceId }}</span>
        </div>

        <div class="detail-row">
          <span class="detail-label">Current Stage:</span>
          <span class="detail-value">{{ currentStage?.name || 'Unknown' }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import LiquidationDetails from '../../../../pages/Member/Treasury/components/LiquidationDetails.vue';
import type { ILiquidation } from '@/shared/interfaces/liquidation.interfaces';

interface IWorkflowTask {
  id: number;
  instanceId: number;
  taskId: number;
  stageId: number;
  instance?: any;
  stage?: any;
}

interface ITaskInformation {
  id: number;
  workflowInstanceId?: number | null;
  WorkflowTask?: IWorkflowTask | null;
  approvalMetadata?: {
    sourceModule: string;
    sourceId: string | number;
  };
}

export default defineComponent({
  name: 'WorkflowDetails',
  components: {
    LiquidationDetails
  },
  props: {
    taskInformation: {
      type: Object as PropType<ITaskInformation>,
      required: true,
      validator: (value: any) => {
        return value && typeof value.id === 'number';
      }
    }
  },
  emits: ['view-image'],
  data() {
    return {
      liquidationData: null as ILiquidation | null,
      loading: false,
      error: null as string | null,
      dataCache: new Map<string, ILiquidation>()
    };
  },
  computed: {
    workflowTask(): IWorkflowTask | null {
      return this.taskInformation?.WorkflowTask || null;
    },
    instance() {
      return this.workflowTask?.instance || null;
    },
    currentStage() {
      return this.workflowTask?.stage || null;
    },
    sourceModule(): string {
      return this.instance?.sourceModule || this.taskInformation?.approvalMetadata?.sourceModule || '';
    },
    sourceId(): string | number {
      return this.instance?.sourceId || this.taskInformation?.approvalMetadata?.sourceId || '';
    },
    metadata() {
      return this.instance?.metadata || {};
    },
    workflowName(): string {
      const moduleNames: Record<string, string> = {
        'petty_cash_liquidation': 'Petty Cash Liquidation',
        'PURCHASE_REQUEST': 'Purchase Request',
        'HR_FILING': 'HR Filing',
      };
      return moduleNames[this.sourceModule] || 'Workflow';
    }
  },
  watch: {
    sourceId: {
      immediate: true,
      handler(newVal, oldVal) {
        // Only fetch if sourceId actually changed and is valid
        if (newVal && newVal !== oldVal && this.sourceModule === 'petty_cash_liquidation') {
          this.fetchLiquidationData();
        }
      }
    }
  },
  methods: {
    async fetchLiquidationData() {
      if (!this.sourceId || this.sourceModule !== 'petty_cash_liquidation') return;
      
      // Check cache first
      const cacheKey = `${this.sourceModule}_${this.sourceId}`;
      if (this.dataCache.has(cacheKey)) {
        this.liquidationData = this.dataCache.get(cacheKey) || null;
        return;
      }
      
      this.loading = true;
      this.error = null;
      
      try {
        // Use the exact same endpoint as the table component with proper query params and body
        const response = await this.$api.put('/petty-cash/liquidation/table?page=1&perPage=1', {
          filters: [
            {
              field: 'id',
              operator: '=',
              value: parseInt(this.sourceId.toString())
            }
          ],
          settings: {},
          searchKeyword: '',
          searchBy: ''
        });
        
        if (response.data && response.data.list && response.data.list.length > 0) {
          this.liquidationData = response.data.list[0];
          // Cache the successful response
          if (this.liquidationData) {
            this.dataCache.set(cacheKey, this.liquidationData);
          }
        } else {
          // No data found - use fallback
          this.error = 'Liquidation details not found';
          this.useFallbackData();
        }
      } catch (error: any) {
        // Handle API errors gracefully
        this.error = error.response?.data?.message || 'Failed to load liquidation details';
        
        // Show user-friendly notification
        this.$q.notify({
          type: 'warning',
          message: 'Unable to load complete liquidation details. Showing available information.',
          caption: this.error || undefined,
          timeout: 3000
        });
        
        // Use metadata as fallback
        this.useFallbackData();
      } finally {
        this.loading = false;
      }
    },
    
    useFallbackData() {
      if (this.metadata) {
        this.liquidationData = {
          id: parseInt(this.sourceId.toString()),
          amount: this.metadata.amount,
          vendorName: this.metadata.vendorName,
          vendorTin: this.metadata.vendorTin,
          vendorAddress: this.metadata.vendorAddress,
          expenseCategory: this.metadata.expenseCategory,
          businessPurpose: this.metadata.businessPurpose,
          description: this.metadata.description,
          receiptNumber: this.metadata.receiptNumber,
          receiptDate: this.metadata.receiptDate,
          vatAmount: this.metadata.vatAmount,
          withholdingTaxAmount: this.metadata.withholdingTaxAmount,
          isAiExtracted: this.metadata.isAiExtracted,
          totalAIConfidence: this.metadata.totalAIConfidence,
          attachmentProof: this.metadata.attachmentProof,
          requestedBy: this.metadata.requestedBy,
          workflowStage: this.currentStage,
          createdAt: this.instance?.startedAt || this.metadata.createdAt
        };
      }
    },
    formatDate(date: any): string {
      if (!date) return '-';
      return new Date(date).toLocaleString('en-PH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    },
    formatModule(module: string): string {
      if (!module) return 'Unknown';
      return module.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  }
});
</script>

<style scoped lang="scss">
.workflow-details-container {
  padding: 16px 24px;
  height: 100%;
  overflow-y: auto;

  @media (max-width: 768px) {
    padding: 12px 16px;
  }
}

.workflow-content {
  max-width: 600px;
}

.detail-section {
  margin-bottom: 24px;

  &:last-child {
    margin-bottom: 0;
  }
}

.section-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--q-primary);
  margin: 0 0 16px 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.detail-row {
  display: flex;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);

  &:last-child {
    border-bottom: none;
  }
}

.detail-label {
  flex: 0 0 140px;
  font-size: 13px;
  color: #666;
  font-weight: 500;

  @media (max-width: 480px) {
    flex: 0 0 100px;
  }
}

.detail-value {
  flex: 1;
  font-size: 14px;
  color: #333;
  word-break: break-word;
}

.receipt-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 12px;
  margin-top: 12px;
}

.receipt-item {
  position: relative;
  aspect-ratio: 1;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s;

  &:hover {
    transform: scale(1.05);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  }
}

.receipt-thumbnail {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.receipt-file {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  background: #f5f5f5;
  padding: 8px;
  text-align: center;
}
</style>