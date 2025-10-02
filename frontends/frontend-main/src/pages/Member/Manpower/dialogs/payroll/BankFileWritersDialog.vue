<template>
  <q-dialog 
    ref="dialog" 
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    persistent
  >
    <q-card flat class="md3-dialog-card">
      <!-- Fixed Header -->
      <q-card-section class="md3-dialog-header">
        <div class="row items-center">
          <div class="col">
            <div class="text-h5 text-weight-regular">Bank File Writers</div>
            <div class="text-body2 text-grey-7 q-mt-xs">
              Export payroll data by bank for {{ cutoffPeriod }}
            </div>
          </div>
          <div>
            <q-btn flat round icon="close" @click="$emit('update:modelValue', false)" />
          </div>
        </div>
      </q-card-section>

      <!-- Combined Search and Export Bar - Material Design 3 -->
      <div class="dialog-search-export-bar" v-if="hasAnyData">
        <div class="row items-center justify-between q-gutter-md">
          <!-- Search Section -->
          <div class="col-auto search-section">
            <q-input
              v-model="searchQuery"
              @update:model-value="handleSearch"
              placeholder="Search employees..."
              dense
              outlined
              clearable
              class="search-input"
            >
              <template v-slot:prepend>
                <q-icon name="search" />
              </template>
            </q-input>
          </div>

          <!-- Export Actions Section -->
          <div class="col-auto export-section">
            <!-- No Bank Export (Disabled) -->
            <q-btn
              v-if="activeTab === 'no-bank' && bankData.noBankEmployees.employeeCount > 0"
              flat
              icon="download"
              label="Export (Disabled)"
              disable
              class="export-btn export-btn-disabled"
            >
              <q-tooltip>
                Bank information required for export
              </q-tooltip>
            </q-btn>

            <!-- Bank Export Buttons -->
            <template v-else-if="activeTab !== 'no-bank'">
              <q-btn
                v-for="bank in bankData.banks"
                :key="bank.bankKey"
                v-show="bank.bankKey === activeTab"
                flat
                icon="download"
                :label="`Export ${bank.bankLabel}`"
                @click="exportBank(bank)"
                :loading="exportingBankKey === bank.bankKey"
                class="export-btn export-btn-primary"
              />
            </template>
          </div>
        </div>
      </div>

      <!-- Content -->
      <!-- Empty State -->
      <div v-if="!hasAnyData" class="flex flex-center" style="height: 400px;">
        <div class="text-center">
          <q-icon name="inbox" size="64px" color="grey-5" />
          <div class="text-h6 q-mt-md text-grey-7">No payroll data found</div>
          <div class="text-body2 text-grey-6 q-mt-sm">There are no employees in this payroll cutoff.</div>
        </div>
      </div>

      <!-- Data Content -->
      <template v-else>
          <!-- Bank Tabs -->
          <q-tabs
            v-model="activeTab"
            class="md3-tabs"
            align="left"
            active-color="primary"
            indicator-color="primary"
            no-caps
          >
            <q-tab
              v-if="bankData.noBankEmployees.employeeCount > 0"
              name="no-bank"
              class="md3-tab"
            >
              <div class="row items-center q-gutter-sm">
                <q-icon name="warning" color="orange" size="18px" />
                <span>No Bank ({{ bankData.noBankEmployees.employeeCount }})</span>
              </div>
            </q-tab>
            <q-tab
              v-for="bank in bankData.banks"
              :key="bank.bankKey"
              :name="bank.bankKey"
              :label="`${bank.bankLabel} (${bank.employeeCount})`"
              class="md3-tab"
            />
          </q-tabs>

          <!-- Tab Panels -->
          <q-tab-panels
            v-model="activeTab"
            animated
            class="md3-tab-panels"
          >
            <!-- No Bank Panel -->
            <q-tab-panel 
              v-if="bankData.noBankEmployees.employeeCount > 0" 
              name="no-bank"
              class="q-pa-none"
            >
            <div class="md3-panel-content">
              <div class="md3-warning-banner q-ma-md">
                <q-icon name="info" size="20px" />
                <span>These employees need bank information to enable export.</span>
              </div>
              
              <!-- Table without pagination -->
              <div class="table-container-full">
                <q-table
                  :rows="bankData.noBankEmployees.employees"
                  :columns="noBankColumns"
                  row-key="employeeCode"
                  flat
                  bordered
                  dense
                  class="md3-table"
                  hide-pagination
                  :rows-per-page-options="[0]"
                  :pagination="{ rowsPerPage: 0 }"
                  :loading="isLoading && activeTab === 'no-bank'"
                >
                  <template v-slot:body-cell-netPay="props">
                    <q-td :props="props" class="text-right">
                      {{ props.value }}
                    </q-td>
                  </template>
                </q-table>
              </div>
            </div>
          </q-tab-panel>

          <!-- Bank Panels -->
          <q-tab-panel
            v-for="bank in bankData.banks"
            :key="bank.bankKey"
            :name="bank.bankKey"
            class="q-pa-none"
          >
            <div class="md3-panel-content">
              <!-- Table without pagination -->
              <div class="table-container-full">
                <q-table
                  :rows="bank.employees"
                  :columns="bankColumns"
                  row-key="employeeCode"
                  flat
                  bordered
                  dense
                  class="md3-table"
                  hide-pagination
                  :rows-per-page-options="[0]"
                  :pagination="{ rowsPerPage: 0 }"
                  :loading="isLoading && activeTab === bank.bankKey"
                >
                
                  <template v-slot:body-cell-bankAccountNumber="props">
                    <q-td :props="props">
                      {{ maskAccountNumber(props.value) }}
                    </q-td>
                  </template>
                  <template v-slot:body-cell-netPay="props">
                    <q-td :props="props" class="text-right">
                      {{ props.value }}
                    </q-td>
                  </template>
                </q-table>
              </div>
            </div>
          </q-tab-panel>
        </q-tab-panels>

        <!-- Fixed Pagination at Bottom of Dialog - Material Design 3 -->
        <div class="dialog-pagination-footer" v-if="hasAnyData">
          <div class="text-body2">
            {{ getCurrentPageInfo }}
          </div>
          <q-pagination
            v-model="currentPage"
            :max="getCurrentBankTotalPages"
            :max-pages="7"
            boundary-numbers
            direction-links
            outline
            flat
            color="primary"
            text-color="primary"
            active-text-color="white"
            active-color="primary"
            v-if="getCurrentBankTotalPages > 1"
          />
        </div>
      </template>
    </q-card>
  </q-dialog>
</template>

<style src="./BankFileWritersDialog.scss" scoped></style>

<script lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { QDialog, useQuasar } from 'quasar';
import { api } from 'src/boot/axios';
import { AxiosError } from 'axios';
import { handleAxiosError } from 'src/utility/axios.error.handler';
import type { CutoffDateRangeResponse } from '@shared/response';

interface BankEmployee {
  bankAccountNumber: string;
  employeeName: string;
  employeeCode: string;
  branchName: string;
  netPay: number;
}

interface NoBankEmployee {
  employeeName: string;
  employeeCode: string;
  branchName: string;
  netPay: number;
}

interface BankData {
  bankKey: string;
  bankLabel: string;
  employeeCount: number;
  totalAmount: number;
  employees: BankEmployee[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface BankExportResponse {
  noBankEmployees: {
    employeeCount: number;
    totalAmount: number;
    employees: NoBankEmployee[];
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
  banks: BankData[];
}

export default {
  name: 'BankFileWritersDialog',
  props: {
    modelValue: {
      type: Boolean,
      required: true,
    },
    selectedPayroll: {
      type: Object as () => CutoffDateRangeResponse,
      required: true,
    },
  },
  emits: ['update:modelValue', 'export-complete'],
  setup(props, { emit }) {
    const $q = useQuasar();
    const dialog = ref<InstanceType<typeof QDialog>>();
    const isLoading = ref(false);
    const activeTab = ref('');
    const exportingBankKey = ref('');
    const searchQuery = ref('');
    const currentPage = ref(1);
    const pageSize = ref(50);
    
    const bankData = ref<BankExportResponse>({
      noBankEmployees: {
        employeeCount: 0,
        totalAmount: 0,
        employees: [],
      },
      banks: [],
    });

    // Computed
    const cutoffPeriod = computed(() => {
      if (!props.selectedPayroll) return '';
      return `${props.selectedPayroll.startDate?.dateFull} - ${props.selectedPayroll.endDate?.dateFull}`;
    });

    const hasAnyData = computed(() => {
      return bankData.value.noBankEmployees.employeeCount > 0 || bankData.value.banks.length > 0;
    });

    // Computed properties for pagination info
    const noBankTotalPages = computed(() => {
      return bankData.value.noBankEmployees.pagination?.totalPages || 0;
    });

    const getCurrentBankTotalPages = computed(() => {
      if (activeTab.value === 'no-bank') {
        return noBankTotalPages.value;
      }
      const bank = bankData.value.banks.find(b => b.bankKey === activeTab.value);
      return bank?.pagination?.totalPages || 0;
    });

    const getCurrentPageInfo = computed(() => {
      if (activeTab.value === 'no-bank') {
        const pagination = bankData.value.noBankEmployees.pagination;
        const actualCount = bankData.value.noBankEmployees.employees.length;
        if (!pagination) return actualCount > 0 ? `Showing ${actualCount} employees` : '';
        
        const start = (pagination.page - 1) * pagination.limit + 1;
        const end = start + actualCount - 1;
        return `Showing ${start}-${end} of ${pagination.total} employees`;
      } else {
        const bank = bankData.value.banks.find(b => b.bankKey === activeTab.value);
        const pagination = bank?.pagination;
        const actualCount = bank?.employees.length || 0;
        if (!pagination) return actualCount > 0 ? `Showing ${actualCount} employees` : '';
        
        const start = (pagination.page - 1) * pagination.limit + 1;
        const end = start + actualCount - 1;
        return `Showing ${start}-${end} of ${pagination.total} employees`;
      }
    });

    // Handle search with debouncing and reset pagination
    const handleSearch = () => {
      fetchBankData(true); // true = reset page
    };

    // Watch for search changes with debouncing
    let searchTimeout: NodeJS.Timeout;
    watch(searchQuery, () => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        handleSearch();
      }, 300);
    });

    // Watch for tab changes and fetch data
    watch(activeTab, (newTab) => {
      currentPage.value = 1;
      if (newTab && newTab !== 'no-bank') {
        // Check if this bank tab has data loaded
        const bank = bankData.value.banks.find(b => b.bankKey === newTab);
        if (!bank?.employees || bank.employees.length === 0) {
          fetchBankData();
        }
      } else if (newTab === 'no-bank') {
        fetchBankData();
      }
    });

    // Watch for page changes
    watch(currentPage, () => {
      fetchBankData();
    });

    // Table columns
    const noBankColumns = [
      {
        name: 'employeeName',
        label: 'Employee Name',
        field: 'employeeName',
        align: 'left' as const,
        sortable: false,
      },
      {
        name: 'employeeCode',
        label: 'Employee Code',
        field: 'employeeCode',
        align: 'left' as const,
        sortable: false,
      },
      {
        name: 'branchName',
        label: 'Branch',
        field: 'branchName',
        align: 'left' as const,
        sortable: false,
      },
      {
        name: 'netPay',
        label: 'Net Pay',
        field: 'netPay',
        align: 'right' as const,
        sortable: false,
        format: (val: number) => formatCurrency(val),
      },
    ];

    const bankColumns = [
      {
        name: 'bankAccountNumber',
        label: 'Bank Account Number',
        field: 'bankAccountNumber',
        align: 'left' as const,
        sortable: false,
      },
      {
        name: 'employeeName',
        label: 'Employee Name',
        field: 'employeeName',
        align: 'left' as const,
        sortable: false,
      },
      {
        name: 'employeeCode',
        label: 'Employee Code',
        field: 'employeeCode',
        align: 'left' as const,
        sortable: false,
      },
      {
        name: 'branchName',
        label: 'Branch',
        field: 'branchName',
        align: 'left' as const,
        sortable: false,
      },
      {
        name: 'netPay',
        label: 'Net Pay',
        field: 'netPay',
        align: 'right' as const,
        sortable: false,
        format: (val: number) => formatCurrency(val),
      },
    ];

    // Methods
    const fetchBankData = async (resetPage = false) => {
      if (resetPage) {
        currentPage.value = 1;
      }
      
      isLoading.value = true;
      try {
        const params = new URLSearchParams({
          page: currentPage.value.toString(),
          limit: pageSize.value.toString(),
          search: searchQuery.value,
          bankKey: activeTab.value === 'no-bank' ? '' : activeTab.value,
          sortBy: 'netPay',
          sortOrder: 'desc'
        });

        const response = await api.get(`/bank-export/data/${props.selectedPayroll.key}?${params}`);
        
        if (response.data) {
          if (activeTab.value === 'no-bank' || !activeTab.value) {
            // Handle summary + no-bank pagination response
            
            bankData.value = {
              noBankEmployees: response.data.noBankEmployees,
              banks: response.data.banks
            };
            
            // Set initial active tab if not set
            if (!activeTab.value) {
              if (bankData.value.noBankEmployees.employeeCount > 0) {
                activeTab.value = 'no-bank';
              } else if (bankData.value.banks.length > 0) {
                activeTab.value = bankData.value.banks[0].bankKey;
                // Fetch data for the first bank tab
                setTimeout(() => fetchBankData(), 0);
                return;
              }
            }
          } else {
            // Handle specific bank pagination response
            const bankIndex = bankData.value.banks.findIndex(b => b.bankKey === activeTab.value);
            if (bankIndex !== -1) {
              bankData.value.banks[bankIndex] = {
                ...bankData.value.banks[bankIndex],
                employees: response.data.employees,
                pagination: response.data.pagination
              };
            }
          }
        }
      } catch (error) {
        handleAxiosError($q, error as AxiosError);
      } finally {
        isLoading.value = false;
      }
    };

    const maskAccountNumber = (accountNumber: string): string => {
      if (!accountNumber || accountNumber.length < 4) return accountNumber;
      return '*'.repeat(accountNumber.length - 4) + accountNumber.slice(-4);
    };

    const formatCurrency = (amount: number): string => {
      return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
    };

    const exportBank = async (bank: BankData) => {
      exportingBankKey.value = bank.bankKey;
      
      try {
        const response = await api.get(
          `/bank-export/export/${props.selectedPayroll.key}/${bank.bankKey}`,
          { responseType: 'blob' }
        );
        
        // Get filename from content-disposition header
        const contentDisposition = response.headers['content-disposition'];
        let filename = `${bank.bankKey}_Payroll_${new Date().toISOString().split('T')[0]}.csv`;
        
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="(.+)"/);
          if (filenameMatch) {
            filename = filenameMatch[1];
          }
        }
        
        // Create download link
        const blob = new Blob([response.data], { type: response.headers['content-type'] });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        window.URL.revokeObjectURL(url);
        
        $q.notify({
          type: 'positive',
          message: `${bank.bankLabel} file exported successfully`,
        });
        
        emit('export-complete', { bankKey: bank.bankKey, filename });
      } catch (error) {
        handleAxiosError($q, error as AxiosError);
      } finally {
        exportingBankKey.value = '';
      }
    };

    // Watch for dialog visibility change
    watch(() => props.modelValue, (newValue) => {
      if (newValue) {
        fetchBankData();
      }
    });

    // Also fetch on mount if dialog is already visible
    onMounted(() => {
      if (props.modelValue) {
        fetchBankData();
      }
    });

    return {
      dialog,
      isLoading,
      activeTab,
      bankData,
      cutoffPeriod,
      hasAnyData,
      noBankColumns,
      bankColumns,
      exportingBankKey,
      searchQuery,
      currentPage,
      pageSize,
      noBankTotalPages,
      getCurrentBankTotalPages,
      getCurrentPageInfo,
      handleSearch,
      maskAccountNumber,
      formatCurrency,
      exportBank,
    };
  },
};
</script>