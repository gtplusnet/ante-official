<template>
  <div class="pending-approvals-view">
    <!-- Header -->
    <div class="row items-center q-mb-md">
      <div class="col">
        <div class="text-h6">
          <q-icon name="pending_actions" size="28px" class="q-mr-sm" />
          Pending Approvals
        </div>
        <div class="text-caption text-grey-7">
          Items requiring your approval
        </div>
      </div>
      <div class="col-auto">
        <q-btn
          icon="refresh"
          flat
          round
          color="primary"
          @click="loadPendingApprovals"
          :loading="loading"
        >
          <q-tooltip>Refresh</q-tooltip>
        </q-btn>
      </div>
    </div>

    <!-- Filters -->
    <div class="row q-col-gutter-sm q-mb-md">
      <div class="col-12 col-md-4">
        <q-select
          v-model="selectedModule"
          :options="moduleOptions"
          label="Module"
          outlined
          dense
          clearable
          emit-value
          map-options
          @update:model-value="loadPendingApprovals"
        />
      </div>
      <div class="col-12 col-md-4">
        <q-select
          v-model="selectedStatus"
          :options="statusOptions"
          label="Status"
          outlined
          dense
          clearable
          emit-value
          map-options
          @update:model-value="loadPendingApprovals"
        />
      </div>
      <div class="col-12 col-md-4">
        <q-input
          v-model="searchQuery"
          label="Search"
          outlined
          dense
          clearable
          @update:model-value="debounceSearch"
        >
          <template v-slot:append>
            <q-icon name="search" />
          </template>
        </q-input>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading && !pendingApprovals.length" class="text-center q-pa-xl">
      <q-spinner size="50px" color="primary" />
      <div class="text-grey-6 q-mt-md">Loading pending approvals...</div>
    </div>

    <!-- Empty State -->
    <div v-else-if="!loading && !pendingApprovals.length" class="text-center q-pa-xl bg-grey-2 rounded-borders">
      <q-icon name="check_circle" size="64px" color="positive" />
      <div class="text-h6 q-mt-md">No Pending Approvals</div>
      <div class="text-grey-6 q-mt-sm">
        {{ searchQuery || selectedModule ? 'No items match your filters' : 'You have no items requiring approval' }}
      </div>
    </div>

    <!-- Approvals List -->
    <div v-else class="row q-col-gutter-md">
      <div
        v-for="item in pendingApprovals"
        :key="item.id"
        class="col-12 col-md-6 col-lg-4"
      >
        <q-card class="approval-card" :class="{ 'urgent': item.isUrgent }">
          <!-- Card Header -->
          <q-card-section class="q-pb-xs">
            <div class="row items-center">
              <div class="col">
                <workflow-status-badge
                  :stage="item.currentStage"
                  size="sm"
                  dense
                />
              </div>
              <div class="col-auto">
                <q-chip
                  v-if="item.isUrgent"
                  color="negative"
                  text-color="white"
                  size="sm"
                  dense
                  icon="priority_high"
                >
                  Urgent
                </q-chip>
              </div>
            </div>
          </q-card-section>

          <!-- Card Content -->
          <q-card-section>
            <!-- Module & Type -->
            <div class="text-overline text-grey-7">
              {{ formatModule(item.sourceModule) }}
            </div>

            <!-- Title/Description -->
            <div class="text-subtitle1 text-weight-medium q-mb-sm">
              {{ item.metadata?.description || item.metadata?.title || `#${item.sourceId}` }}
            </div>

            <!-- Metadata Grid -->
            <div class="metadata-grid">
              <div v-if="item.metadata?.amount" class="metadata-item">
                <q-icon name="payments" size="xs" color="grey-7" />
                <span class="text-caption">{{ formatCurrency(item.metadata.amount) }}</span>
              </div>
              <div v-if="item.metadata?.requestedBy" class="metadata-item">
                <q-icon name="person" size="xs" color="grey-7" />
                <span class="text-caption">{{ item.metadata.requestedBy }}</span>
              </div>
              <div v-if="item.startedAt" class="metadata-item">
                <q-icon name="schedule" size="xs" color="grey-7" />
                <span class="text-caption">{{ formatDate(item.startedAt) }}</span>
              </div>
            </div>

            <!-- Pending Task Info -->
            <div v-if="item.pendingTask" class="pending-task-info q-mt-sm">
              <q-banner dense class="bg-warning text-white">
                <template v-slot:avatar>
                  <q-icon name="assignment" />
                </template>
                <div class="text-caption">
                  {{ item.pendingTask.description || 'Action required' }}
                </div>
              </q-banner>
            </div>
          </q-card-section>

          <!-- Card Actions -->
          <q-separator />
          <q-card-actions>
            <workflow-action-buttons
              :workflow-instance-id="item.id"
              size="sm"
              :show-empty-state="false"
              @action-performed="handleActionPerformed($event, item)"
            />
            <q-space />
            <q-btn
              flat
              size="sm"
              color="primary"
              icon="visibility"
              @click="viewDetails(item)"
            >
              <q-tooltip>View Details</q-tooltip>
            </q-btn>
          </q-card-actions>
        </q-card>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="row justify-center q-mt-md">
      <q-pagination
        v-model="currentPage"
        :max="totalPages"
        :max-pages="7"
        direction-links
        boundary-links
        color="primary"
        @update:model-value="loadPendingApprovals"
      />
    </div>

    <!-- Details Dialog -->
    <q-dialog v-model="showDetailsDialog">
      <q-card style="width: 800px; max-width: 90vw;">
        <q-card-section class="row items-center">
          <div class="text-h6">Workflow Details</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>
        
        <q-separator />
        
        <q-card-section style="max-height: 70vh; overflow-y: auto;">
          <workflow-timeline
            v-if="selectedItem"
            :workflow-instance-id="selectedItem.id"
            layout="comfortable"
          />
        </q-card-section>
        
        <q-separator />
        
        <q-card-actions align="right">
          <workflow-action-buttons
            v-if="selectedItem"
            :workflow-instance-id="selectedItem.id"
            @action-performed="handleDetailActionPerformed"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script>
import { defineComponent, ref, computed, onMounted, watch, onUnmounted } from 'vue';
import { useQuasar } from 'quasar';
import WorkflowService from '../../services/workflow.service';
import WorkflowStatusBadge from './WorkflowStatusBadge.vue';
import WorkflowActionButtons from './WorkflowActionButtons.vue';
import WorkflowTimeline from './WorkflowTimeline.vue';
import { date } from 'quasar';

export default defineComponent({
  name: 'PendingApprovalsView',
  components: {
    WorkflowStatusBadge,
    WorkflowActionButtons,
    WorkflowTimeline
  },
  props: {
    sourceModule: {
      type: String,
      default: null
    },
    pageSize: {
      type: Number,
      default: 12
    },
    autoRefresh: {
      type: Boolean,
      default: false
    },
    refreshInterval: {
      type: Number,
      default: 60000 // 1 minute
    }
  },
  emits: ['approval-performed', 'item-selected'],
  setup(props, { emit }) {
    const $q = useQuasar();
    const loading = ref(false);
    const pendingApprovals = ref([]);
    const totalItems = ref(0);
    const currentPage = ref(1);
    const selectedModule = ref(props.sourceModule);
    const selectedStatus = ref('ACTIVE');
    const searchQuery = ref('');
    const showDetailsDialog = ref(false);
    const selectedItem = ref(null);
    let refreshTimer = null;
    let searchTimer = null;

    // Module options for filter
    const moduleOptions = [
      { label: 'All Modules', value: null },
      { label: 'Petty Cash Liquidation', value: 'PETTY_CASH_LIQUIDATION' },
      { label: 'Purchase Request', value: 'PURCHASE_REQUEST' },
      { label: 'Leave Request', value: 'LEAVE_REQUEST' },
      { label: 'Expense Report', value: 'EXPENSE_REPORT' }
    ];

    // Status options for filter
    const statusOptions = [
      { label: 'Active', value: 'ACTIVE' },
      { label: 'All', value: null },
      { label: 'Completed', value: 'COMPLETED' },
      { label: 'Cancelled', value: 'CANCELLED' }
    ];

    // Computed properties
    const totalPages = computed(() => {
      return Math.ceil(totalItems.value / props.pageSize);
    });

    // Load pending approvals
    const loadPendingApprovals = async () => {
      loading.value = true;
      try {
        const params = {
          page: currentPage.value,
          limit: props.pageSize,
          ...(selectedModule.value && { sourceModule: selectedModule.value }),
          ...(selectedStatus.value && { status: selectedStatus.value }),
          ...(searchQuery.value && { search: searchQuery.value })
        };

        const response = await WorkflowService.getUserPendingWorkflows(params);
        pendingApprovals.value = response.data || [];
        totalItems.value = response.total || 0;
      } catch (error) {
        console.error('Error loading pending approvals:', error);
        $q.notify({
          type: 'negative',
          message: 'Failed to load pending approvals',
          icon: 'error'
        });
      } finally {
        loading.value = false;
      }
    };

    // Format module name
    const formatModule = (module) => {
      if (!module) return 'Unknown';
      return module
        .replace(/_/g, ' ')
        .toLowerCase()
        .replace(/\b\w/g, (char) => char.toUpperCase());
    };

    // Format currency
    const formatCurrency = (amount) => {
      if (typeof amount === 'object' && amount.formatCurrency) {
        return amount.formatCurrency;
      }
      const value = Number(amount) || 0;
      return `₱${value.toLocaleString('en-PH', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      })}`;
    };

    // Format date
    const formatDate = (timestamp) => {
      if (!timestamp) return '';
      return date.formatDate(timestamp, 'MMM DD, YYYY');
    };

    // Handle action performed
    const handleActionPerformed = async (event, item) => {
      // Remove item from list if approved/rejected
      const index = pendingApprovals.value.findIndex(i => i.id === item.id);
      if (index > -1) {
        pendingApprovals.value.splice(index, 1);
      }

      // Skip notification for liquidation approvals (already shown by LiquidationApprovalDialog)
      const isLiquidationApproval = event.transition?.dialogType === 'liquidation_approval' || 
                                    item.sourceModule === 'petty_cash_liquidation';
      
      if (!isLiquidationApproval) {
        // Show notification for non-liquidation actions
        $q.notify({
          type: 'positive',
          message: `Item ${event.action.toLowerCase()} successfully`,
          icon: 'check_circle'
        });
      }

      emit('approval-performed', { event, item });

      // Reload if list is empty
      if (pendingApprovals.value.length === 0) {
        await loadPendingApprovals();
      }
    };

    // Handle detail action performed
    const handleDetailActionPerformed = async (event) => {
      showDetailsDialog.value = false;
      await loadPendingApprovals();
      
      // Skip notification for liquidation approvals (already shown by LiquidationApprovalDialog)
      const isLiquidationApproval = event.transition?.dialogType === 'liquidation_approval' || 
                                    selectedItem.value?.sourceModule === 'petty_cash_liquidation';
      
      if (!isLiquidationApproval) {
        // Show notification for non-liquidation actions
        $q.notify({
          type: 'positive',
          message: `Item ${event.action.toLowerCase()} successfully`,
          icon: 'check_circle'
        });
      }
    };

    // View details
    const viewDetails = (item) => {
      selectedItem.value = item;
      showDetailsDialog.value = true;
      emit('item-selected', item);
    };

    // Debounce search
    const debounceSearch = () => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        currentPage.value = 1;
        loadPendingApprovals();
      }, 500);
    };

    // Setup auto-refresh
    const startAutoRefresh = () => {
      if (props.autoRefresh && props.refreshInterval > 0) {
        refreshTimer = setInterval(() => {
          loadPendingApprovals();
        }, props.refreshInterval);
      }
    };

    const stopAutoRefresh = () => {
      if (refreshTimer) {
        clearInterval(refreshTimer);
        refreshTimer = null;
      }
    };

    // Lifecycle hooks
    onMounted(() => {
      loadPendingApprovals();
      startAutoRefresh();
    });

    // Watch for auto-refresh changes
    watch(() => props.autoRefresh, (newVal) => {
      if (newVal) {
        startAutoRefresh();
      } else {
        stopAutoRefresh();
      }
    });

    // Cleanup
    onUnmounted(() => {
      stopAutoRefresh();
      clearTimeout(searchTimer);
    });

    return {
      loading,
      pendingApprovals,
      totalItems,
      currentPage,
      totalPages,
      selectedModule,
      selectedStatus,
      searchQuery,
      showDetailsDialog,
      selectedItem,
      moduleOptions,
      statusOptions,
      loadPendingApprovals,
      formatModule,
      formatCurrency,
      formatDate,
      handleActionPerformed,
      handleDetailActionPerformed,
      viewDetails,
      debounceSearch
    };
  }
});
</script>

<style lang="scss" scoped>
.pending-approvals-view {
  .approval-card {
    transition: all 0.3s ease;
    height: 100%;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
    
    &.urgent {
      border-left: 4px solid $negative;
    }
  }

  .metadata-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-top: 8px;
  }

  .metadata-item {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .pending-task-info {
    .q-banner {
      padding: 8px;
      border-radius: 4px;
    }
  }

  .rounded-borders {
    border-radius: 8px;
  }
}
</style>