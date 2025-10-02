<template>
  <q-dialog ref="dialog" @show="onDialogShow" @hide="onDialogHide" persistent>
    <q-card class="md3-dialog-card">
      <!-- Header -->
      <q-card-section class="md3-dialog-header">
        <div class="row items-center">
          <div class="col">
            <div class="text-h6">Select Employee</div>
          </div>
          <div class="col-auto">
            <q-btn icon="close" flat round dense v-close-popup />
          </div>
        </div>
      </q-card-section>

      <!-- Content -->
      <!-- MD3 Filter Bar -->
      <div class="md3-search-bar">
        <!-- Search Field - Full Width -->
        <div class="search-row">
          <div class="md3-search-field">
            <q-icon name="search" class="md3-search-icon" />
            <input
              v-model="searchBox"
              @input="debouncedSearch"
              type="text"
              placeholder="Search employees..."
              class="md3-search-input"
            />
            <q-btn
              v-if="searchBox"
              @click="searchBox = ''; debouncedSearch()"
              flat
              round
              dense
              icon="close"
              class="md3-search-clear"
              size="sm"
            />
          </div>
        </div>

        <!-- Other Filters - Grid Layout -->
        <div class="filters-grid">
          <!-- Branch Filter -->
          <div class="grid-item">
            <CustomBranchTreeSelect
              v-model="selectedBranchIds"
              placeholder="All Branches"
              :include-children="true"
              variant="md3-filter"
              @update:model-value="() => !isInitializing && applyFilters()"
            />
          </div>

          <!-- Role Filter -->
          <div class="grid-item">
            <div class="md3-filter-field">
              <q-icon name="badge" class="md3-filter-icon" />
              <q-select
                v-model="selectRolePosition"
                :options="roleOptions"
                placeholder="All Roles"
                dense
                borderless
                emit-value
                map-options
                options-dense
                @update:model-value="() => !isInitializing && applyFilters()"
                class="md3-filter-select"
              >
                <template v-slot:no-option>
                  <q-item>
                    <q-item-section class="text-grey">
                      No roles found
                    </q-item-section>
                  </q-item>
                </template>
              </q-select>
            </div>
          </div>

          <!-- Employment Status Filter -->
          <div class="grid-item">
            <div class="md3-filter-field">
              <q-icon name="work_history" class="md3-filter-icon" />
              <q-select
                v-model="selectEmpStatus"
                :options="statusOptions"
                placeholder="All Status"
                dense
                borderless
                emit-value
                map-options
                options-dense
                @update:model-value="() => !isInitializing && applyFilters()"
                class="md3-filter-select"
              >
                <template v-slot:no-option>
                  <q-item>
                    <q-item-section class="text-grey">
                      No status found
                    </q-item-section>
                  </q-item>
                </template>
              </q-select>
            </div>
          </div>
        </div>
      </div>

      <!-- Table Container with Scroll -->
      <q-card-section class="md3-dialog-content">
        <div class="md3-table-wrapper">
          <q-table
            flat
            dense
            :rows="filteredEmployees"
            :columns="columns"
            row-key="accountDetails.id"
            :loading="isLoading"
            virtual-scroll
            :virtual-scroll-item-size="48"
            :virtual-scroll-sticky-size-start="48"
            :rows-per-page-options="[0]"
            class="md3-employee-table single-select"
          >
            <!-- Custom Header -->
            <template v-slot:header="props">
              <q-tr :props="props">
                <q-th
                  v-for="col in props.cols"
                  :key="col.name"
                  :props="props"
                  class="text-left"
                >
                  {{ col.label }}
                </q-th>
              </q-tr>
            </template>

            <!-- Body -->
            <template v-slot:body="props">
              <q-tr 
                :props="props" 
                class="cursor-pointer"
                :class="{ 'selected-row': isRowSelected(props.row) }"
                @click="selectEmployee(props.row)"
              >
                <q-td key="employeeCode" :props="props">
                  {{ props.row.employeeCode }}
                </q-td>
                <q-td key="fullName" :props="props">
                  {{ capitalizeFullName(props.row.accountDetails.fullName || '') }}
                </q-td>
                <q-td key="position" :props="props">
                  {{ props.row.accountDetails?.role?.name || '-' }}
                </q-td>
              </q-tr>
            </template>

            <!-- Loading -->
            <template v-slot:loading>
              <q-inner-loading showing color="primary" />
            </template>
          </q-table>
        </div>
      </q-card-section>

      <!-- Footer Actions -->
      <q-card-section class="md3-dialog-footer">
        <div class="row items-center">
          <div class="col">
            <div class="text-caption text-grey-7">Selected:</div>
            <div class="text-body2">
              {{ selectedEmployee ? capitalizeFullName(selectedEmployee.accountDetails.fullName || '') : 'None' }}
            </div>
          </div>
          <div class="col-auto">
            <div class="row justify-end q-gutter-sm">
              <GButton variant="outline" label="Cancel" v-close-popup />
              <GButton
                label="Select"
                @click="confirmSelection"
                :disable="!selectedEmployee"
              />
            </div>
          </div>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<style scoped lang="scss">
/* Import MD3 filter styles from ManpowerPayrollSummaryDialog */
@import '../payroll/ManpowerPayrollSummaryDialog.scss';

// Override q-dialog styles for border radius
:deep(.q-dialog__inner) {
  padding: 24px !important;

  .q-card {
    border-radius: 12px !important;
    overflow: hidden;
  }
}

// MD3 Dialog Structure
.md3-dialog-card {
  width: 70vw;
  max-width: 840px;
  height: 85vh;
  max-height: 800px;
  display: flex;
  flex-direction: column;
  border-radius: 12px !important;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
}

// Dialog Header
.md3-dialog-header {
  background-color: #ffffff;
  border-bottom: 1px solid #e3e3e3;
  padding: 16px 24px;
  flex-shrink: 0;

  .text-h6 {
    font-size: 20px;
    font-weight: 500;
    color: #1f1f1f;
  }
}

// Dialog Content
.md3-dialog-content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  padding: 0;
  background-color: #fafbfd;
}

// Table Wrapper
.md3-table-wrapper {
  flex: 1;
  overflow: auto;
  margin: 16px;
  display: flex;
  flex-direction: column;
  position: relative;

  // Custom scrollbar styling
  &::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  &::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 4px;

    &:hover {
      background: #a8a8a8;
    }
  }
}

.md3-employee-table {
  background-color: #ffffff;
  height: 100%;

  &.single-select {
    :deep(.q-table tbody) {
      tr {
        &.selected-row {
          background-color: #e3f2fd;
          
          &:hover {
            background-color: #bbdefb;
          }
        }
      }
    }
  }

  :deep(.q-table__top) {
    display: none;
  }

  :deep(.q-table__bottom) {
    display: none;
  }

  :deep(.q-table__container) {
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  }

  :deep(table) {
    table-layout: fixed;
    width: 100%;
  }

  :deep(.q-table thead) {
    position: sticky;
    top: 0;
    z-index: 10;
    background-color: #f5f5f7;

    tr {
      background-color: #f5f5f7;

      th {
        font-weight: 600;
        font-size: 12px;
        color: #5f6368;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        padding: 12px 16px;
        border-bottom: 1px solid #e3e3e3;
        background-color: #f5f5f7;
        position: sticky;
        top: 0;
        z-index: 1;
      }
    }
  }

  :deep(.q-table tbody) {
    tr {
      transition: background-color 0.2s ease;

      &:hover {
        background-color: #f8f9fa;
      }

      td {
        padding: 12px 16px;
        font-size: 14px;
        color: #1f1f1f;
        border-bottom: 1px solid #f0f0f0;
      }
    }
  }

  :deep(.q-virtual-scroll__content) {
    background-color: #ffffff;
  }

  // Fix for table container height
  :deep(.q-table__middle) {
    flex: 1;
    overflow: auto;
  }

  // Ensure virtual scroll container fills height
  :deep(.q-virtual-scroll) {
    height: 100%;
  }

  // Table container styles
  :deep(.q-table__container) {
    height: 100%;
    display: flex;
    flex-direction: column;
  }
}

// Dialog Footer
.md3-dialog-footer {
  background-color: #f5f5f7;
  border-top: 1px solid #e3e3e3;
  padding: 12px 24px;
  flex-shrink: 0;
}

/* Override search bar styling for this dialog */
.md3-search-bar {
  background-color: #ffffff;
  border-bottom: 1px solid #e3e3e3;
  padding: 16px 24px;
  margin: 0;

  .search-row {
    margin-bottom: 12px;

    .md3-search-field {
      width: 100%;
    }
  }

  .filters-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;

    .grid-item {
      width: 100%;
    }
  }

  // Responsive for smaller screens
  @media (max-width: 768px) {
    .filters-grid {
      grid-template-columns: 1fr;
    }
  }
}
</style>

<script lang="ts">
import { EmployeeDataResponse } from '@shared/response';
import { useQuasar } from 'quasar';
import { api } from 'src/boot/axios';
import { handleAxiosError } from '../../../../../utility/axios.error.handler';
import { ref, computed, watch, nextTick } from 'vue';
import { debounce } from 'quasar';
import CustomBranchTreeSelect from 'src/components/selection/CustomBranchTreeSelect.vue';
import GButton from 'src/components/shared/buttons/GButton.vue';

export default {
  name: 'SelectSingleEmployeeDialog',
  components: {
    GButton,
    CustomBranchTreeSelect,
  },
  props: {
    selectEmployeeUrl: {
      type: String,
      required: false,
      default: '/hr-configuration/payroll-approvers/employee-select'
    },
  },

  setup(props, { emit }) {
    const $q = useQuasar();
    const selectedBranchIds = ref<(number | string)[]>([]);
    const selectEmpStatus = ref('all');
    const selectRolePosition = ref('all');
    const selectedEmployee = ref<EmployeeDataResponse | null>(null);
    const searchBox = ref('');
    const allEmployees = ref<EmployeeDataResponse[]>([]);
    const filteredEmployeesList = ref<EmployeeDataResponse[]>([]);
    const isLoading = ref(false);

    // Table columns definition
    const columns = [
      {
        name: 'employeeCode',
        label: 'Employee Code',
        field: 'employeeCode',
        align: 'left' as const,
        sortable: true,
      },
      {
        name: 'fullName',
        label: 'Full Name',
        field: (row: EmployeeDataResponse) => row.accountDetails.fullName,
        align: 'left' as const,
        sortable: true,
      },
      {
        name: 'position',
        label: 'Position',
        field: (row: EmployeeDataResponse) => row.accountDetails?.role?.name || '-',
        align: 'left' as const,
        sortable: true,
      },
    ];

    // Options for filters
    const roleOptions = ref([
      { label: 'All Roles', value: 'all' },
      { label: 'Admin', value: 'admin' },
      { label: 'Manager', value: 'manager' },
      { label: 'Staff', value: 'staff' },
      { label: 'Employee', value: 'employee' },
    ]);

    const statusOptions = ref([
      { label: 'All Status', value: 'all' },
      { label: 'Active', value: 'active' },
      { label: 'Inactive', value: 'inactive' },
      { label: 'Probation', value: 'probation' },
      { label: 'Resigned', value: 'resigned' },
    ]);

    const fetchEmployeeList = () => {
      isLoading.value = true;

      // Build URL with filters
      const baseUrl = props.selectEmployeeUrl;
      const params = new URLSearchParams();

      // Add filters as query parameters
      if (selectedBranchIds.value.length > 0) {
        const branchIds = selectedBranchIds.value.map(id => String(id)).join(',');
        params.append('branch', branchIds);
      }
      if (selectRolePosition.value && selectRolePosition.value !== 'all') {
        params.append('role', selectRolePosition.value);
      }
      if (selectEmpStatus.value && selectEmpStatus.value !== 'all') {
        params.append('employmentStatus', selectEmpStatus.value);
      }
      if (searchBox.value) {
        params.append('search', searchBox.value);
      }

      // Construct full URL
      const separator = baseUrl.includes('?') ? '&' : '?';
      const fullUrl = params.toString() ? `${baseUrl}${separator}${params.toString()}` : baseUrl;

      api
        .get(fullUrl)
        .then((response) => {
          allEmployees.value = response.data;
          filteredEmployeesList.value = response.data;
        })
        .catch((error) => {
          handleAxiosError($q, error);
        })
        .finally(() => {
          isLoading.value = false;
        });
    };

    const applyFilters = () => {
      fetchEmployeeList();
    };

    const isRowSelected = (row: EmployeeDataResponse) => {
      return selectedEmployee.value?.accountDetails.id === row.accountDetails.id;
    };

    const selectEmployee = (row: EmployeeDataResponse) => {
      selectedEmployee.value = row;
    };

    const confirmSelection = () => {
      if (!selectedEmployee.value) {
        $q.notify({
          type: 'negative',
          message: 'Please select an employee.',
        });
        return;
      }
      emit('employee-selected', selectedEmployee.value);
    };

    // Debounced search function
    const debouncedSearch = debounce(() => {
      applyFilters();
    }, 500);

    // Watch filter changes to apply filtering
    watch([selectedBranchIds, selectRolePosition, selectEmpStatus], () => {
      if (!isInitializing.value) {
        applyFilters();
      }
    });

    // Watch search box with debounce
    watch(searchBox, () => {
      if (!isInitializing.value) {
        debouncedSearch();
      }
    });

    const filteredEmployees = computed(() => {
      return filteredEmployeesList.value;
    });

    // Add a flag to prevent multiple API calls during initialization
    const isInitializing = ref(false);

    const onDialogShow = async () => {
      isInitializing.value = true;

      // Reset filters and selections
      selectedBranchIds.value = [];
      selectEmpStatus.value = 'all';
      selectRolePosition.value = 'all';
      searchBox.value = '';
      selectedEmployee.value = null;

      // Wait for next tick to ensure watchers have processed
      await nextTick();

      // Now fetch fresh employee list
      fetchEmployeeList();

      // Reset the flag after a short delay
      setTimeout(() => {
        isInitializing.value = false;
      }, 100);
    };

    const onDialogHide = () => {
      // Clear selection when dialog closes
      selectedEmployee.value = null;
    };

    // Method to capitalize first letter of each word in a name
    const capitalizeFullName = (name: string) => {
      if (!name) return '';
      
      // Split the name into words and capitalize each word
      return name
        .toLowerCase()
        .split(' ')
        .map((word: string) => {
          // Handle special cases like "de", "van", "la", etc.
          const lowercaseWords = ['de', 'del', 'la', 'van', 'von', 'der', 'da', 'di'];
          if (lowercaseWords.includes(word)) {
            return word;
          }
          // Capitalize first letter of each word
          return word.charAt(0).toUpperCase() + word.slice(1);
        })
        .join(' ');
    };

    return {
      selectedBranchIds,
      selectEmpStatus,
      selectRolePosition,
      searchBox,
      selectedEmployee,
      allEmployees,
      filteredEmployeesList,
      roleOptions,
      statusOptions,
      columns,
      isLoading,
      isInitializing,
      applyFilters,
      isRowSelected,
      selectEmployee,
      confirmSelection,
      filteredEmployees,
      onDialogShow,
      onDialogHide,
      debouncedSearch,
      capitalizeFullName,
    };
  },
};
</script>