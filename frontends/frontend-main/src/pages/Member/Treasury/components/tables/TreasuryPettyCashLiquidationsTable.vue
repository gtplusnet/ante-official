<template>
  <g-table
    :is-clickable-row="true"
    @row-click="viewDetails"
    tableKey="pettyCashLiquidation"
    apiUrl="petty-cash/liquidation/table"
    :query="tableQuery"
    ref="table"
  >
    <!-- Date range filter and export controls -->
    <template v-slot:actions>
      <div class="row q-gutter-sm items-center">
        <!-- Date range picker -->
        <div class="col-auto">
          <q-input
            v-model="dateRange"
            outlined
            dense
            readonly
            label="Date Range"
            style="min-width: 220px"
            @click="showDatePicker = true"
          >
            <template v-slot:append>
              <q-icon name="date_range" class="cursor-pointer" @click="showDatePicker = true" />
            </template>
          </q-input>
          
          <q-dialog v-model="showDatePicker">
            <q-date
              v-model="selectedDateRange"
              range
              @update:model-value="updateDateRange"
            >
              <div class="row items-center justify-end q-gutter-sm">
                <q-btn label="Cancel" color="grey" flat @click="showDatePicker = false" />
                <q-btn label="OK" color="primary" flat @click="applyDateRange" />
              </div>
            </q-date>
          </q-dialog>
        </div>
        
        <!-- Export button -->
        <div class="col-auto">
          <q-btn
            color="positive"
            icon="file_download"
            label="Export to Excel"
            :loading="isExporting"
            @click="exportToExcel"
            no-caps
            unelevated
          >
            <template v-slot:loading>
              <q-spinner />
            </template>
          </q-btn>
        </div>
      </div>
    </template>
    <!-- slot - AI Extracted indicator -->
    <template v-slot:isAiExtracted="props">
      <div v-if="props.data.isAiExtracted" class="flex items-center">
        <q-chip color="blue" text-color="white" size="sm" dense>
          <q-icon name="smart_toy" size="xs" class="q-mr-xs" />
          AI Extracted
        </q-chip>
      </div>
    </template>

    <!-- slot - vendor -->
    <template v-slot:vendorName="props">
      <div>
        <div class="text-weight-medium">{{ props.data.vendorName || '-' }}</div>
        <div v-if="props.data.vendorTin" class="text-caption text-grey">
          TIN: {{ props.data.vendorTin }}
        </div>
        <div v-if="props.data.vendorAddress" class="text-caption text-grey">
          {{ props.data.vendorAddress }}
        </div>
      </div>
    </template>

    <!-- slot - receipt info -->
    <template v-slot:receiptNumber="props">
      <div>
        <div class="text-weight-medium">{{ props.data.receiptNumber || '-' }}</div>
        <div v-if="props.data.receiptDate" class="text-caption text-grey">
          {{ props.data.receiptDate.date }}
        </div>
      </div>
    </template>

    <!-- slot - requested by -->
    <template v-slot:requestedBy="props">
      <div v-if="props.data.requestedBy">
        <div class="text-weight-medium">{{ props.data.requestedBy.firstName }} {{ props.data.requestedBy.lastName }}</div>
        <div class="text-caption text-grey">{{ props.data.requestedBy.email }}</div>
      </div>
    </template>

    <!-- slot - amount -->
    <template v-slot:amount="props">
      <div class="text-weight-bold text-primary">
        {{ props.data.amount.formatCurrency }}
      </div>
    </template>

    <!-- slot - VAT amount -->
    <template v-slot:vatAmount="props">
      <div class="text-weight-medium text-orange">
        {{ formatCurrency(props.data.vatAmount || 0) }}
      </div>
    </template>

    <!-- slot - withholding tax -->
    <template v-slot:withholdingTaxAmount="props">
      <div class="text-weight-medium text-red">
        {{ formatCurrency(props.data.withholdingTaxAmount || 0) }}
      </div>
    </template>

    <!-- slot - net amount -->
    <template v-slot:netAmount="props">
      <div class="text-weight-bold text-green">
        {{ formatCurrency(calculateNetAmount(props.data)) }}
      </div>
    </template>

    <!-- slot - business purpose -->
    <template v-slot:businessPurpose="props">
      <div style="max-width: 200px;">
        <div class="text-caption">{{ props.data.businessPurpose || props.data.description || '-' }}</div>
      </div>
    </template>

    <!-- slot - expense category -->
    <template v-slot:expenseCategory="props">
      <q-chip v-if="props.data.expenseCategory" dense color="grey-3" text-color="grey-8">
        {{ props.data.expenseCategory }}
      </q-chip>
      <span v-else>-</span>
    </template>

    <!-- slot - createdAt -->
    <template v-slot:createdAt="props">
      <div>
        <div class="text-weight-medium">{{ formatDate(props.data.createdAt) }}</div>
        <div class="text-caption text-grey">{{ formatTime(props.data.createdAt) }}</div>
      </div>
    </template>

    <!-- slot - status -->
    <template v-slot:status="props">
      <workflow-status-badge
        v-if="props.data.workflowStage"
        :stage="props.data.workflowStage"
        size="sm"
        dense
      />
      <q-chip 
        v-else
        :color="getStatusColor(props.data.status)" 
        text-color="white" 
        size="sm"
        dense
      >
        {{ props.data.status?.text || props.data.status?.label || 'Pending' }}
      </q-chip>
    </template>

    <!-- slot - proof -->
    <template v-slot:proof="props">
      <div>
        <q-img
          :src="props.data.attachmentProof.url"
          style="width: 80px; height: 80px; cursor: pointer; border-radius: 8px;"
          class="shadow-2"
          @click="openImage(props.data)"
        >
          <div class="absolute-bottom text-caption text-center bg-black text-white" style="padding: 2px;">
            Receipt
          </div>
        </q-img>
      </div>
    </template>

  </g-table>

  <!-- Create Request Payment Dialog -->
  <CreateRequestForPaymentDialog
    @saveDone="this.$refs.table.refetch()"
    v-model="isRequestForPaymentDialogOpen"
  />
  <!-- Reject Payment Dialog -->
  <RejectForLiquidationDialog
    @saveDone="this.$refs.table.refetch()"
    :rejectForLiquidationData="rejectForLiquidationData"
    v-model="openRejectPaymentDialog"
  />
  
  <!-- Receipt Image Viewer Dialog -->
  <ReceiptImageViewerDialog
    v-model="imageViewerDialog"
    :liquidationData="selectedAttachment"
  />
  
  <!-- Liquidation Details Dialog -->
  <PettyCashLiquidationDetailsDialog
    v-model="detailsDialog"
    :liquidationData="selectedLiquidation"
    @openFullScreenImage="openImage"
    @action-performed="handleDialogAction"
    @workflow-action-performed="handleDialogAction"
  />
</template>

<script>
import GTable from "../../../../../components/shared/display/GTable.vue";
import CreateRequestForPaymentDialog from '../../dialogs/TreasuryCreateRequestForPaymentDialog.vue';
import RejectForLiquidationDialog from '../../dialogs/TreasuryRejectForLiquidationDialog.vue';
import ReceiptImageViewerDialog from '../../dialogs/ReceiptImageViewerDialog.vue';
import PettyCashLiquidationDetailsDialog from '../../dialogs/PettyCashLiquidationDetailsDialog.vue';
import WorkflowStatusBadge from '../../../../../components/workflow/WorkflowStatusBadge.vue';

export default {
  name: 'PettyCashLiquidationsTable',
  components: {
    GTable,
    CreateRequestForPaymentDialog,
    RejectForLiquidationDialog,
    ReceiptImageViewerDialog,
    PettyCashLiquidationDetailsDialog,
    WorkflowStatusBadge,
  },
  props: {},
  data: () => ({
    isRequestForPaymentDialogOpen: false,
    openApproveLiquidationDialog: false,
    openRejectPaymentDialog: false,
    approvePaymentData: null,
    rejectForLiquidationData: null,
    imageViewerDialog: false,
    selectedAttachment: null,
    detailsDialog: false,
    selectedLiquidation: null,
    // Date range filter
    showDatePicker: false,
    selectedDateRange: null,
    dateRange: '',
    startDate: '',
    endDate: '',
    // Export
    isExporting: false,
  }),
  computed: {
    tableQuery() {
      return {
        startDate: this.startDate,
        endDate: this.endDate
      };
    }
  },
  watch: {},
  mounted() {
    this.$bus.on('newSaveLiquidation', () => {
      // Use nextTick to ensure component is fully rendered
      this.$nextTick(() => {
        if (this.$refs.table && typeof this.$refs.table.refetch === 'function') {
          try {
            this.$refs.table.refetch();
          } catch (error) {
            console.warn('Error refreshing liquidations table:', error);
          }
        }
      });
    });
    // Load workflow data for liquidations
    this.enrichWithWorkflowData();
    // Initialize default date range to current month
    this.initializeDateRange();
  },
  beforeUnmount() {
    this.$bus.off('newSaveLiquidation');
  },
  methods: {
    approvePayment() {
      this.openApproveLiquidationDialog = true;
    },
    rejectPayment(props) {
      this.openRejectPaymentDialog = true;
      this.rejectForLiquidationData = props;
    },
    openCreateRequestPaymentDialog() {
      this.isRequestForPaymentDialogOpen = true;
    },

    openImage(liquidationData) {
      this.selectedAttachment = liquidationData;
      this.imageViewerDialog = true;
    },
    
    viewDetails(liquidationData) {
      this.selectedLiquidation = liquidationData;
      this.detailsDialog = true;
    },

    
    formatDate(dateObj) {
      if (!dateObj) return '-';
      if (dateObj.date) return dateObj.date;
      if (dateObj.dateTime) {
        // Extract just the date part from dateTime
        return dateObj.dateTime.split(' ')[0];
      }
      return dateObj;
    },
    
    formatTime(dateObj) {
      if (!dateObj) return '';
      if (dateObj.time) return dateObj.time;
      if (dateObj.dateTime) {
        // Extract just the time part from dateTime
        const timePart = dateObj.dateTime.split(' ')[1];
        return timePart || '';
      }
      return '';
    },
    
    getStatusColor(status) {
      if (!status) return 'grey';
      const text = (status.text || status.label || '').toLowerCase();
      if (text.includes('approved')) return 'positive';
      if (text.includes('rejected')) return 'negative';
      if (text.includes('pending')) return 'warning';
      return 'grey';
    },
    
    async enrichWithWorkflowData() {
      // This method will be called after table data is loaded
      // to fetch workflow information for each liquidation
      // Implementation depends on how the table data is structured
    },
    
    handleDialogAction(event) {
      // Refresh the table after any action from the dialog
      this.$refs.table.refetch();
      
      // Show notification if not already shown by dialog
      if (event && event.action) {
        console.log('Liquidation action performed:', event.action);
      }
    },
    
    formatCurrency(amount) {
      return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP'
      }).format(amount || 0);
    },
    
    calculateNetAmount(data) {
      const grossAmount = data.amount || 0;
      const withholdingTax = data.withholdingTaxAmount || 0;
      return grossAmount - withholdingTax;
    },
    
    initializeDateRange() {
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      this.startDate = this.formatDateForApi(firstDay);
      this.endDate = this.formatDateForApi(lastDay);
      this.selectedDateRange = {
        from: this.formatDateForPicker(firstDay),
        to: this.formatDateForPicker(lastDay)
      };
      this.updateDateRangeDisplay();
    },
    
    formatDateForApi(date) {
      return date.toISOString().split('T')[0];
    },
    
    formatDateForPicker(date) {
      return date.toISOString().split('T')[0].replace(/-/g, '/');
    },
    
    formatDateForDisplay(date) {
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    },
    
    updateDateRange(range) {
      this.selectedDateRange = range;
    },
    
    applyDateRange() {
      if (this.selectedDateRange && this.selectedDateRange.from) {
        this.startDate = this.formatDateForApi(new Date(this.selectedDateRange.from));
        if (this.selectedDateRange.to) {
          this.endDate = this.formatDateForApi(new Date(this.selectedDateRange.to));
        } else {
          this.endDate = this.startDate;
        }
        this.updateDateRangeDisplay();
        // Refresh the table with new date range
        this.$refs.table.refetch();
      }
      this.showDatePicker = false;
    },
    
    updateDateRangeDisplay() {
      const startFormatted = this.formatDateForDisplay(this.startDate);
      const endFormatted = this.formatDateForDisplay(this.endDate);
      this.dateRange = `${startFormatted} - ${endFormatted}`;
    },
    
    async exportToExcel() {
      if (!this.startDate || !this.endDate) {
        this.$q.notify({
          type: 'warning',
          message: 'Please select a date range for export',
          position: 'top'
        });
        return;
      }
      
      this.isExporting = true;
      
      try {
        const response = await this.$api.get('/petty-cash/liquidation/export', {
          params: {
            startDate: this.startDate,
            endDate: this.endDate
          },
          responseType: 'blob'
        });
        
        // Create blob and download
        const blob = new Blob([response.data], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });
        
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `PettyCash_Liquidations_${this.startDate}_to_${this.endDate}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        this.$q.notify({
          type: 'positive',
          message: 'Excel file downloaded successfully',
          position: 'top'
        });
        
      } catch (error) {
        console.error('Export error:', error);
        this.$q.notify({
          type: 'negative',
          message: 'Failed to export data. Please try again.',
          position: 'top'
        });
      } finally {
        this.isExporting = false;
      }
    },
    
  },
};
</script>
