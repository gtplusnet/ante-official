<template>
  <q-dialog
    v-model="dialogModel"
    ref="dialog"
    :maximized="false"
    transition-show="fade"
    transition-hide="fade"
    @before-show="initializeData"
  >
    <TemplateDialog :max-width="'1000px'" :responsive="true">
      <template #DialogTitle>
        <div class="q-pl-xs">Petty Cash</div>
      </template>

      <template #DialogContent>
        <div class="petty-cash-dialog-content">
          <!-- left -->
          <div class="left-content">
            <!-- Loading state for holder info -->
            <div v-if="loading.holder" class="petty-cash-information-container">
              <div class="text-center q-pa-lg">
                <q-spinner-dots size="40px" color="primary" />
                <div class="q-mt-sm">Loading petty cash information...</div>
              </div>
            </div>

            <!-- No petty cash assigned -->
            <div v-else-if="!currentHolder && !loading.holder" class="petty-cash-information-container">
              <div class="text-center q-pa-lg">
                <q-icon name="o_account_balance_wallet" size="48px" color="grey-5" />
                <div class="q-mt-md text-body1 text-grey-7">No Active Petty Cash Assignment</div>
              </div>
            </div>

            <!-- Petty cash information -->
            <div v-else class="petty-cash-information-container">
              <div class="text-title-small">
               Petty Cash Information
              </div>
              <div class="row items-center">
                <div class="icon-container">
                  <q-icon name="o_account_balance_wallet" size="18px" class="cash-icon" />
                </div>
                <div class="info-content">
                  <div class="row items-center justify-between text-label-large text-dark">
                    <span>Remaining Balance</span>
                    <span class="text-weight-bold">
                      {{ formatCurrencyShort(remainingBalance) }}
                    </span>
                  </div>
                  <div class="row items-center justify-between text-body-small text-grey-light">
                    <span>Petty Cash Amount</span>
                    <span>
                      {{ formatCurrencyShort(currentHolder?.actualBalance || currentHolder?.currentBalance || 0) }}
                    </span>
                  </div>
                </div>
              </div>

              <div class="row items-center">
                <div class="icon-container">
                  <q-icon name="downloading" size="18px" class="secondary-icon" />
                </div>
                <div class="info-content">
                  <div class="row items-center justify-between text-label-large text-dark">
                    <span>Total Liquidation</span>
                    <span class="text-weight-bold">
                      {{ formatCurrencyShort(totalLiquidationAmount) }}
                    </span>
                  </div>
                  <div class="row items-center justify-between text-body-small text-grey-light">
                    <span>Pending Amount</span>
                    <span>
                      {{ formatCurrencyShort(pendingLiquidationAmount) }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- filter -->
            <TransactionTypeFilter
              v-if="currentHolder"
              @update:filters="handleFilterUpdate"
              class="q-mt-md"
            />
          </div>

          <!-- right -->
          <div class="right-content">
            <div class="row items-center justify-between">
              <!-- Tabs -->
              <q-tabs
                v-model="activeTab"
                class="tabs-actions"
                active-color="primary"
                indicator-color="false"
                dense
              >
                <q-tab name="history" no-caps label="Transaction History" class="custom-tab" />
                <q-tab name="liquidations" no-caps label="Liquidations" class="custom-tab" />
              </q-tabs>

              <!-- Search Bar -->
              <div class="search-container">
                <q-input
                  v-model="searchQuery"
                  outlined
                  dense
                  rounded
                  placeholder="Search by Reason"
                  class="search-input"
                >
                  <template v-slot:append>
                    <q-icon name="search" />
                  </template>
                </q-input>
              </div>
            </div>

            <!-- Tab Panels -->
            <q-tab-panels v-model="activeTab" animated class="tab-panels">
              <!-- Transaction History Panel -->
              <q-tab-panel name="history" class="q-pa-none">
                <!-- Loading state -->
                <div v-if="loading.transactions" class="transaction-list">
                  <div class="text-center q-pa-lg">
                    <q-spinner-dots size="40px" color="primary" />
                    <div class="q-mt-sm">Loading transaction history...</div>
                  </div>
                </div>

                <!-- No transactions -->
                <div v-else-if="!paginatedTransactions.length" class="transaction-list">
                  <div class="text-center q-pa-lg text-grey">
                    {{ searchQuery || activeFilters.length ? 'No matching transactions found' : 'No transactions yet' }}
                  </div>
                </div>

                <!-- Transaction List -->
                <div v-else class="transaction-list">
                  <!-- Transaction Cards -->
                  <TransactionCard
                    v-for="transaction in paginatedTransactions"
                    :key="transaction?.id || Math.random()"
                    :title="transaction?.title || ''"
                    :description="transaction?.description || ''"
                    :date="transaction?.date || ''"
                    :amount="transaction?.amount || ''"
                    :balance="transaction?.balance || ''"
                    :balanceBefore="transaction?.balanceBefore || ''"
                    :icon="transaction?.icon || 'circle'"
                    :type="transaction?.type || 'default'"
                    :transaction="transaction?.transaction || false"
                  />
                </div>
              </q-tab-panel>

              <!-- Liquidations Panel -->
              <q-tab-panel name="liquidations" class="q-pa-none">
                <!-- Loading state -->
                <div v-if="loading.liquidations" class="transaction-list">
                  <div class="text-center q-pa-lg">
                    <q-spinner-dots size="40px" color="primary" />
                    <div class="q-mt-sm">Loading liquidations...</div>
                  </div>
                </div>

                <!-- No liquidations -->
                <div v-else-if="!paginatedLiquidations.length" class="transaction-list">
                  <div class="text-center q-pa-lg text-grey">
                    {{ searchQuery ? 'No matching liquidations found' : 
                       showOnlyUserLiquidations ? 'You have no liquidation records' : 
                       'No liquidation records found' }}
                  </div>
                </div>

                <!-- Liquidations List -->
                <div v-else class="transaction-list">
                  <!-- Transaction Cards -->
                  <div
                    v-for="liquidation in paginatedLiquidations"
                    :key="liquidation.id"
                    @click="handleLiquidationClick(liquidation)"
                    class="cursor-pointer"
                  >
                    <TransactionCard
                      :title="liquidation.title"
                      :description="liquidation.description"
                      :date="liquidation.date"
                      :amount="liquidation.amount"
                      :balance="liquidation.balance"
                      :balanceBefore="liquidation.balanceBefore"
                      :icon="liquidation.icon"
                      :type="liquidation.type"
                      :transaction="liquidation.transaction"
                      :status="liquidation.status"
                      :statusLabel="liquidation.statusLabel"
                      :workflowStage="liquidation.workflowStage"
                    />
                  </div>
                </div>
              </q-tab-panel>
            </q-tab-panels>

            <!-- Pagination -->
            <div class="pagination-container">
              <GlobalWidgetPagination
                :pagination="pagination"
                @update:page="handlePageChange"
                @update:rows-per-page="handleRowsPerPageChange"
              />
            </div>
          </div>
        </div>
      </template>
    </TemplateDialog>
  </q-dialog>

  <!-- Liquidation Details Dialog -->
  <PettyCashLiquidationDetailsDialog
    v-model="showLiquidationDetailsDialog"
    :liquidationData="selectedLiquidation"
  />
</template>

<script lang="ts">
import { defineComponent, ref, computed, getCurrentInstance, watch } from 'vue';
import { defineAsyncComponent } from 'vue';
import { date, useQuasar } from 'quasar';
import TransactionCard from '../card/TransactionCard.vue';
import TransactionTypeFilter from '../components/TransactionTypeFilter.vue';
import GlobalWidgetPagination from 'src/components/shared/global/GlobalWidgetPagination.vue';
import { APIRequests } from 'src/utility/api.handler';
import { PettyCashTransactionType, TRANSACTION_TYPE_CONFIG, getAmountPrefix } from 'src/enums/petty-cash.enum';
import { formatCurrencyShort } from 'src/utility/formatter';

// Lazy-loaded dialogs (ALL dialogs must be lazy loaded - CLAUDE.md)
const TemplateDialog = defineAsyncComponent(() =>
  import('src/components/dialog/TemplateDialog.vue')
);
const PettyCashLiquidationDetailsDialog = defineAsyncComponent(() =>
  import('src/pages/Member/Treasury/dialogs/PettyCashLiquidationDetailsDialog.vue')
);

export default defineComponent({
  name: 'ViewPettyCashWidgetDialog',
  components: {
    TemplateDialog,
    TransactionCard,
    TransactionTypeFilter,
    GlobalWidgetPagination,
    PettyCashLiquidationDetailsDialog,
  },
  props: {
    modelValue: {
      type: Boolean,
      default: false,
    },
    holderData: {
      type: Object,
      default: null,
    },
    showOnlyUserLiquidations: {
      type: Boolean,
      default: true, // Default to showing only user's liquidations (dashboard context)
    },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    // Get component instance for $api access
    const instance = getCurrentInstance();
    const $api = instance?.appContext.config.globalProperties.$api;
    const q = useQuasar();

    // Dialog model
    const dialogModel = computed({
      get: () => props.modelValue,
      set: (value) => emit('update:modelValue', value),
    });

    // State
    const currentHolder = ref<any>(null);
    const transactions = ref<any[]>([]);
    const allLiquidations = ref<any[]>([]);
    const loading = ref({
      holder: false,
      transactions: false,
      liquidations: false,
    });
    const activeTab = ref('history');
    const searchQuery = ref('');
    const activeFilters = ref<string[]>([]);
    const totalLiquidationAmount = ref(0);
    const pendingLiquidationAmount = ref(0);
    const showLiquidationDetailsDialog = ref(false);
    const selectedLiquidation = ref<any>(null);

    // Pagination data
    const pagination = ref({
      currentPage: 1,
      itemsPerPage: 5,
      totalItems: 0,
    });

    // Computed
    const remainingBalance = computed(() => {
      if (!currentHolder.value) return 0;
      const actualBalance = currentHolder.value.actualBalance || currentHolder.value.currentBalance || 0;
      const pendingLiquidation = currentHolder.value.pendingLiquidation || 0;
      return actualBalance - pendingLiquidation;
    });

    const filteredTransactions = computed(() => {
      let filtered = transactions.value;

      // Apply type filters
      if (activeFilters.value.length > 0) {
        // Map filter names to backend enum values
        const typeMap: Record<string, PettyCashTransactionType> = {
          'assignment': PettyCashTransactionType.INITIAL,
          'refill': PettyCashTransactionType.REFILL,
          'deduction': PettyCashTransactionType.DEDUCTION,
          'return': PettyCashTransactionType.RETURN,
          'transfer': PettyCashTransactionType.TRANSFER,
          'liquidation': PettyCashTransactionType.LIQUIDATION,
        };

        const selectedTypes = activeFilters.value.map(f => typeMap[f]).filter(Boolean);
        filtered = filtered.filter(t => selectedTypes.includes(t.type));
      }

      // Apply search
      if (searchQuery.value) {
        const search = searchQuery.value.toLowerCase();
        filtered = filtered.filter(t =>
          t.reason?.toLowerCase().includes(search) ||
          t.performedBy?.name?.toLowerCase().includes(search)
        );
      }

      return filtered;
    });

    const mappedTransactions = computed(() => {
      return filteredTransactions.value.map(transaction => {
        const config = TRANSACTION_TYPE_CONFIG[transaction.type as PettyCashTransactionType];
        if (!config) {
          console.warn('Unknown transaction type:', transaction.type);
          return null;
        }

        const isTransferReceived = transaction.type === PettyCashTransactionType.TRANSFER &&
          transaction.transferFromHolderId;
        const prefix = getAmountPrefix(transaction.type as PettyCashTransactionType, isTransferReceived);

        return {
          id: transaction.id,
          title: config.label,
          description: transaction.reason || '',
          date: formatDate(transaction.createdAt),
          amount: `${prefix} ₱ ${formatCurrency(transaction.amount)}`,
          balance: `₱${formatCurrency(transaction.balanceAfter)}`,
          balanceBefore: `₱${formatCurrency(transaction.balanceBefore)}`,
          icon: config.icon,
          type: config.cssClass,
          transaction: true,
          performedBy: transaction.performedBy?.name,
        };
      }).filter(Boolean);
    });

    // Watch for changes in mapped transactions to update total count
    watch(mappedTransactions, (newFiltered) => {
      pagination.value.totalItems = newFiltered.length;
    }, { immediate: true });

    // Apply pagination to transactions
    const paginatedTransactions = computed(() => {
      const start = (pagination.value.currentPage - 1) * pagination.value.itemsPerPage;
      const end = start + pagination.value.itemsPerPage;
      return mappedTransactions.value.slice(start, end);
    });

    const mappedLiquidations = computed(() => {
      // Map all liquidations to display format
      return allLiquidations.value.map(liquidation => {
        // Handle date - might be a string or an object with raw property
        const dateValue = liquidation.createdAt?.raw || liquidation.createdAt;
        let dateString = '';
        if (dateValue) {
          try {
            dateString = formatDate(dateValue);
          } catch (e) {
            console.warn('Failed to format date:', dateValue);
          }
        }

        // Handle amount - might be a number or an object with raw property
        const amountValue = typeof liquidation.amount === 'object'
          ? (liquidation.amount?.raw || 0)
          : (liquidation.amount || 0);

        // Get status - prioritize workflow status over basic status
        const workflowStage = liquidation.workflowInstance?.currentStage;
        const status = workflowStage?.key || liquidation.status?.key || liquidation.status || 'PENDING';
        const statusLabel = workflowStage?.name || liquidation.status?.label || status;

        return {
          id: liquidation.id,
          title: `Liquidation #${liquidation.id}`,
          description: liquidation.businessPurpose || liquidation.description || 'No description',
          date: dateString,
          amount: `₱ ${formatCurrency(amountValue)}`,
          balance: '',
          balanceBefore: '',
          icon: 'o_receipt_long',
          type: 'liquidation',
          transaction: false,
          status: status,
          statusLabel: statusLabel,
          workflowStage: workflowStage, // Pass workflow stage data
          sortOrder: status === 'PENDING' ? 0 : 1, // Pending first
          // Add searchable fields
          businessPurpose: liquidation.businessPurpose,
          rawDescription: liquidation.description,
        };
      });
    });

    const filteredLiquidations = computed(() => {
      let filtered = mappedLiquidations.value;

      // Apply search if query exists
      if (searchQuery.value) {
        const search = searchQuery.value.toLowerCase();
        filtered = filtered.filter(liquidation =>
          liquidation.description?.toLowerCase().includes(search) ||
          liquidation.businessPurpose?.toLowerCase().includes(search) ||
          liquidation.rawDescription?.toLowerCase().includes(search) ||
          liquidation.title?.toLowerCase().includes(search)
        );
      }

      // Sort: Pending first, then by date/id (most recent first)
      return filtered.sort((a, b) => {
        if (a.sortOrder !== b.sortOrder) {
          return a.sortOrder - b.sortOrder;
        }
        // Within same status group, sort by ID descending (newer first)
        return b.id - a.id;
      });
    });

    // Watch for changes in filtered liquidations to update total count when on liquidations tab
    watch([filteredLiquidations, activeTab], ([newFiltered, newTab]) => {
      if (newTab === 'liquidations') {
        pagination.value.totalItems = newFiltered.length;
        // Reset to page 1 if current page is out of bounds
        const maxPage = Math.ceil(newFiltered.length / pagination.value.itemsPerPage) || 1;
        if (pagination.value.currentPage > maxPage) {
          pagination.value.currentPage = 1;
        }
      }
    }, { immediate: true });

    // Apply pagination to liquidations
    const paginatedLiquidations = computed(() => {
      const start = (pagination.value.currentPage - 1) * pagination.value.itemsPerPage;
      const end = start + pagination.value.itemsPerPage;
      return filteredLiquidations.value.slice(start, end);
    });

    // Methods
    const formatCurrency = (value: number | undefined | null) => {
      // Handle undefined, null, NaN, or any falsy value except 0
      if (value === undefined || value === null || isNaN(value)) {
        return '0.00';
      }
      if (!value && value !== 0) return '0.00';
      return new Intl.NumberFormat('en-PH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(value);
    };

    const formatDate = (dateString: string) => {
      if (!dateString) return '';
      return date.formatDate(dateString, 'MMM DD, YYYY hh:mm A');
    };

    const fetchCurrentHolder = async () => {
      loading.value.holder = true;
      try {
        const response = await APIRequests.getCurrentUserPettyCash(q);
        currentHolder.value = response;
      } catch (error: any) {
        if (error?.response?.status !== 404) {
          q.notify({
            type: 'negative',
            message: 'Failed to fetch petty cash information',
          });
        }
        currentHolder.value = null;
      } finally {
        loading.value.holder = false;
      }
    };

    const fetchTransactionHistory = async (holderId: number) => {
      if (!$api) {
        console.error('API service not available');
        return;
      }
      loading.value.transactions = true;
      try {
        const { data } = await $api.get(`/petty-cash/holder/${holderId}/history`);
        transactions.value = data || [];
      } catch (error) {
        console.error('Error fetching history:', error);
        transactions.value = [];
      } finally {
        loading.value.transactions = false;
      }
    };

    const fetchAllLiquidations = async (holderId: number) => {
      if (!$api) {
        console.error('API service not available');
        return;
      }
      loading.value.liquidations = true;
      try {
        let data;
        
        // If showOnlyUserLiquidations is true (dashboard context), use the new endpoint
        if (props.showOnlyUserLiquidations) {
          console.log('Fetching user\'s own liquidations for holder:', holderId);
          const response = await $api.get(`/petty-cash/liquidation/my?holderId=${holderId}`);
          data = response.data;
        } else {
          // Otherwise use the table endpoint for all liquidations
          console.log('Fetching all liquidations for holder:', holderId);
          const response = await $api.put('/petty-cash/liquidation/table?page=1&perPage=100', {
            filter: {
              pettyCashHolderId: holderId,
            },
            sort: { createdAt: 'desc' },
            include: ['workflowInstance.currentStage'], // Include workflow data
          });
          data = response.data;
        }
        
        console.log('Liquidations received:', data.list?.length || 0, 'items');
        
        allLiquidations.value = data.list || [];
      } catch (error) {
        console.error('Error fetching liquidations:', error);
        allLiquidations.value = [];
      } finally {
        loading.value.liquidations = false;
      }
    };

    const calculateTotals = () => {
      // Calculate total liquidation (all liquidations from transactions)
      const liquidationTransactions = transactions.value.filter(
        t => t.type === PettyCashTransactionType.LIQUIDATION
      );
      totalLiquidationAmount.value = liquidationTransactions.reduce(
        (sum, t) => sum + (t.amount || 0), 0
      );

      // Pending amount - prefer currentHolder data, fallback to calculating from liquidations
      if (typeof currentHolder.value?.pendingLiquidation === 'number') {
        pendingLiquidationAmount.value = currentHolder.value.pendingLiquidation;
      } else if (allLiquidations.value && allLiquidations.value.length > 0) {
        // Calculate from pending liquidations only
        const pendingOnes = allLiquidations.value.filter((l: any) => {
          const status = l.status?.key || l.status;
          return status === 'PENDING';
        });
        pendingLiquidationAmount.value = pendingOnes.reduce((sum: number, l: any) => {
          // Handle amount that might be an object with raw property
          const amount = typeof l.amount === 'object' ? (l.amount?.raw || 0) : (l.amount || 0);
          return sum + amount;
        }, 0);
      } else {
        pendingLiquidationAmount.value = 0;
      }
    };

    const initializeData = async () => {
      // Reset state
      transactions.value = [];
      allLiquidations.value = [];
      totalLiquidationAmount.value = 0;
      pendingLiquidationAmount.value = 0;
      pagination.value.currentPage = 1;

      // Use provided holder data or fetch current user's data
      if (props.holderData) {
        currentHolder.value = props.holderData;
      } else {
        await fetchCurrentHolder();
      }

      // Fetch related data if we have a holder
      if (currentHolder.value?.id) {
        await Promise.all([
          fetchTransactionHistory(currentHolder.value.id),
          fetchAllLiquidations(currentHolder.value.id),
        ]);
        calculateTotals();
      }
    };

    const handleFilterUpdate = (filters: string[]) => {
      activeFilters.value = filters;
      pagination.value.currentPage = 1; // Reset to first page when filters change
    };

    // Watch for search query changes to reset pagination
    watch(searchQuery, () => {
      pagination.value.currentPage = 1;
    });

    // Watch for active tab changes to update pagination totals
    watch(activeTab, (newTab) => {
      pagination.value.currentPage = 1;
      if (newTab === 'history') {
        pagination.value.totalItems = mappedTransactions.value.length;
      } else if (newTab === 'liquidations') {
        pagination.value.totalItems = filteredLiquidations.value.length;
      }
    });

    // Pagination handlers
    const handlePageChange = (page: number) => {
      pagination.value.currentPage = page;
    };

    const handleRowsPerPageChange = (itemsPerPage: number) => {
      pagination.value.itemsPerPage = itemsPerPage;
      pagination.value.currentPage = 1; // Reset to first page when changing rows per page
    };

    const handleLiquidationClick = (liquidation: any) => {
      // Find the full liquidation data from allLiquidations
      const fullLiquidation = allLiquidations.value.find((l: any) => l.id === liquidation.id);
      if (fullLiquidation) {
        selectedLiquidation.value = fullLiquidation;
        showLiquidationDetailsDialog.value = true;
      }
    };

    return {
      dialogModel,
      currentHolder,
      transactions,
      allLiquidations,
      loading,
      activeTab,
      searchQuery,
      activeFilters,
      totalLiquidationAmount,
      pendingLiquidationAmount,
      remainingBalance,
      filteredTransactions,
      mappedTransactions,
      paginatedTransactions,
      mappedLiquidations,
      filteredLiquidations,
      paginatedLiquidations,
      formatCurrency,
      formatCurrencyShort,
      formatDate,
      initializeData,
      handleFilterUpdate,
      handleLiquidationClick,
      showLiquidationDetailsDialog,
      selectedLiquidation,
      pagination,
      handlePageChange,
      handleRowsPerPageChange,
    };
  },
});
</script>

<style scoped lang="scss">
.cursor-pointer {
  cursor: pointer;
  transition: transform 0.2s ease;

  &:hover {
    transform: translateY(-1px);
  }
}

.petty-cash-dialog-content {
  display: flex;
  flex-direction: row;
  gap: 24px;

  .left-content {
    min-width: 30%;

    .petty-cash-information-container {
      display: flex;
      flex-direction: column;
      gap: 24px;
      background-color: #e3f2fd99;
      border-radius: 12px;
      padding: 24px;

      .icon-container {
        color: var(--q-info);
        display: flex;
        justify-content: center;
        align-items: center;
        width: 40px;
        height: 40px;
        background-color: #e3f2fd;
        border-radius: 50px;
      }

      .secondary-icon {
        color: var(--q-secondary);
        background-color: #615ff61f;
        border-radius: 50px;
        display: flex;
        justify-content: center;
        align-items: center;
        width: 40px;
        height: 40px;
        transform: scaleY(-1);
      }

      .info-content {
        flex: 1;
        padding-left: 10px;
      }
    }
  }

  .right-content {
    min-width: 70%;
    display: flex;
    flex-direction: column;

    .tabs-actions {
      padding: 2px;
      border: 1px solid var(--q-light);
      background-color: #fff;
      border-radius: 50px;

      :deep(&.q-tabs--dense .q-tab) {
        min-height: 32px;
      }

      // Custom tab styling
      :deep(.custom-tab) {
        // Default tab state
        &.q-tab {
          font-size: 12px;
          transition: all 0.3s ease;

          &:last-child {
            margin-left: 2px;
          }
        }

        .q-tab__label {
          font-size: 12px;
          font-weight: 300;
          color: #97999f;
        }

        &:hover {
          background-color: rgba(0, 0, 0, 0.002);
          border-radius: 50px;
        }

        // Active tab state
        &.q-tab--active {
          background-color: var(--q-light);
          color: var(--q-dark);
          border-radius: 50px;

          .q-tab__label {
            color: var(--q-dark);
            font-weight: 500;
          }

          .q-tab__indicator {
            opacity: 0;
          }
        }
      }
    }

    .search-container {
      margin-right: 26px;

      .search-input {
        width: 300px;

        :deep(&.q-field--dense) {
          .q-field__control,
          .q-field__marginal {
            height: 35px;
            font-size: 12px;
          }
        }
      }
    }

    .transaction-list {
      background-color: #fff;
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 16px 23px 8px 0;
      height: 460px;
    }
  }

  .pagination-container {
    padding-right: 24px;
  }

  @media (max-width: 768px) {
    flex-direction: column;

    .left-content,
    .right-content {
      min-width: 100%;
      width: 100%;
    }

    .right-content {
      .transaction-list {
        max-height: 300px;
      }
    }
  }
}
</style>
