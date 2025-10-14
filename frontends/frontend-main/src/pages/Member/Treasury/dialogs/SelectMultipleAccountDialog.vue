<template>
  <q-dialog ref="dialog" @show="onDialogShow" @hide="onDialogHide" persistent>
    <q-card class="md3-dialog-card">
      <!-- Header -->
      <q-card-section class="md3-dialog-header">
        <div class="row items-center">
          <div class="col">
            <div class="text-h6">Select Multiple Accounts</div>
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
              placeholder="Search by name, username, or email..."
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
          <!-- Department Filter -->
          <div class="grid-item">
            <div class="md3-filter-field">
              <q-icon name="business" class="md3-filter-icon" />
              <q-select
                v-model="selectDepartment"
                :options="departmentOptions"
                placeholder="All Departments"
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
                      No departments found
                    </q-item-section>
                  </q-item>
                </template>
              </q-select>
            </div>
          </div>

          <!-- Role Filter -->
          <div class="grid-item">
            <div class="md3-filter-field">
              <q-icon name="badge" class="md3-filter-icon" />
              <q-select
                v-model="selectRole"
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
        </div>
      </div>

      <!-- Table Container with Scroll -->
      <q-card-section class="md3-dialog-content">
        <div class="md3-table-wrapper">
          <q-table
            flat
            dense
            :rows="filteredAccounts"
            :columns="columns"
            row-key="key"
            :loading="isLoading"
            virtual-scroll
            :virtual-scroll-item-size="48"
            :virtual-scroll-sticky-size-start="48"
            :rows-per-page-options="[0]"
            class="md3-account-table"
          >
            <!-- Custom Header -->
            <template v-slot:header="props">
              <q-tr :props="props">
                <q-th style="width: 60px; text-align: center;">
                  <q-checkbox
                    v-model="selectAll"
                    @update:model-value="toggleSelectAll"
                    :indeterminate="selectedRows.length > 0 && selectedRows.length < filteredAccounts.length"
                  />
                </q-th>
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
              <q-tr :props="props" class="cursor-pointer">
                <q-td style="width: 60px; text-align: center;" @click.stop>
                  <q-checkbox
                    :model-value="isRowSelected(props.row)"
                    @update:model-value="() => toggleRowSelection(props.row)"
                    @click.stop
                  />
                </q-td>
                <q-td key="name" :props="props" @click="toggleRowSelection(props.row)">
                  {{ capitalizeFullName(props.row.label.split(' (')[0]) }}
                </q-td>
                <q-td key="email" :props="props" @click="toggleRowSelection(props.row)">
                  {{ props.row.email || '-' }}
                </q-td>
                <q-td key="role" :props="props" @click="toggleRowSelection(props.row)">
                  {{ extractRole(props.row.label) }}
                </q-td>
                <q-td key="department" :props="props" @click="toggleRowSelection(props.row)">
                  {{ props.row.departmentName || '-' }}
                </q-td>
              </q-tr>
            </template>

            <!-- Loading -->
            <template v-slot:loading>
              <q-inner-loading showing color="primary" />
            </template>

            <!-- No data -->
            <template v-slot:no-data>
              <div class="full-width row flex-center text-grey q-gutter-sm">
                <q-icon size="2em" name="sentiment_dissatisfied" />
                <span>No accounts found</span>
              </div>
            </template>
          </q-table>
        </div>
      </q-card-section>

      <!-- Footer Actions -->
      <q-card-section class="md3-dialog-footer">
        <div class="row justify-end q-gutter-sm">
          <GButton variant="outline" label="Cancel" v-close-popup />
          <GButton
            :label="`Next (${selectedRows.length})`"
            @click="submitSelection"
            :disable="selectedRows.length === 0"
          />
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<style scoped lang="scss">
/* Import MD3 filter styles from ManpowerPayrollSummaryDialog */
@import '../../Manpower/dialogs/payroll/ManpowerPayrollSummaryDialog.scss';

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
  max-width: 900px;
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

.md3-account-table {
  background-color: #ffffff;
  height: 100%;

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

  :deep(.q-checkbox) {
    .q-checkbox__inner {
      font-size: 16px;
      width: 16px;
      height: 16px;
      color: #1976d2;

      &.q-checkbox__inner--indeterminate {
        .q-checkbox__bg {
          border-color: #1976d2;
          background-color: #1976d2;
        }
      }

      .q-checkbox__bg {
        width: 16px;
        height: 16px;
      }

      svg {
        width: 16px;
        height: 16px;
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
    grid-template-columns: repeat(2, 1fr);
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

<script>
import { debounce } from 'quasar';
import { nextTick } from 'vue';
import GButton from 'src/components/shared/buttons/GButton.vue';

export default {
  name: 'SelectMultipleAccountDialog',
  components: {
    GButton
  },
  props: {
    excludeAccountIds: {
      type: Array,
      default: () => []
    }
  },
  emits: ['account-selected'],

  data() {
    return {
      selectedAccountsMap: new Map(),
      selectAll: false,
      searchBox: '',
      allAccounts: [],
      filteredAccountsList: [],
      isLoading: false,
      isInitializing: false,
      selectRole: 'all',
      selectDepartment: 'all',

      // Table columns definition
      columns: [
        {
          name: 'name',
          label: 'Name',
          field: 'name',
          align: 'left',
          sortable: true
        },
        {
          name: 'email',
          label: 'Email',
          field: 'email',
          align: 'left',
          sortable: true
        },
        {
          name: 'role',
          label: 'Role',
          field: 'role',
          align: 'left',
          sortable: true
        },
        {
          name: 'department',
          label: 'Department',
          field: 'departmentName',
          align: 'left',
          sortable: true
        }
      ],

      roleOptions: [
        { label: 'All Roles', value: 'all' }
      ],
      departmentOptions: [
        { label: 'All Departments', value: 'all' }
      ]
    };
  },

  computed: {
    filteredAccounts() {
      // No client-side filtering needed - all filtering is done server-side
      return this.filteredAccountsList;
    },

    selectedRows() {
      return Array.from(this.selectedAccountsMap.values());
    }
  },

  methods: {
    async fetchAccountList() {
      this.isLoading = true;

      try {
        // Build query parameters for server-side filtering
        const params = new URLSearchParams();

        if (this.searchBox) {
          params.append('search', this.searchBox);
        }
        if (this.selectRole && this.selectRole !== 'all') {
          params.append('role', this.selectRole);
        }
        if (this.selectDepartment && this.selectDepartment !== 'all') {
          params.append('department', this.selectDepartment);
        }
        // Add excludeAccountIds parameter if provided
        if (this.excludeAccountIds && this.excludeAccountIds.length > 0) {
          params.append('excludeAccountIds', this.excludeAccountIds.join(','));
        }

        const url = params.toString()
          ? `/select-box/account-list?${params.toString()}`
          : '/select-box/account-list';

        const response = await this.$api.get(url);

        // The API returns { list: [...] }
        this.allAccounts = response.data.list || [];
        this.filteredAccountsList = this.allAccounts;

        // Extract unique roles and departments for filter options on initial load only
        if (!this.searchBox && this.selectRole === 'all' && this.selectDepartment === 'all') {
          this.extractRoleOptions();
          this.extractDepartmentOptions();
        }
      } catch (error) {
        this.$q.notify({
          type: 'negative',
          message: 'Failed to load accounts',
          position: 'top'
        });
        console.error('Error fetching accounts:', error);
      } finally {
        this.isLoading = false;
      }
    },

    extractRoleOptions() {
      const roles = new Set();
      this.allAccounts.forEach(account => {
        if (account.roleName) {
          roles.add(account.roleName);
        }
      });

      this.roleOptions = [
        { label: 'All Roles', value: 'all' },
        ...Array.from(roles).sort().map(role => ({
          label: role,
          value: role
        }))
      ];
    },

    extractDepartmentOptions() {
      const departments = new Set();
      this.allAccounts.forEach(account => {
        if (account.departmentName) {
          departments.add(account.departmentName);
        }
      });

      this.departmentOptions = [
        { label: 'All Departments', value: 'all' },
        ...Array.from(departments).sort().map(dept => ({
          label: dept,
          value: dept
        }))
      ];
    },

    extractRole(label) {
      // Extract role from label format "Full Name (Role)"
      const match = label.match(/\(([^)]+)\)$/);
      return match ? match[1] : '-';
    },

    applyFilters() {
      // Server-side filtering - fetch new data from server
      this.fetchAccountList();
    },

    isRowSelected(row) {
      return this.selectedAccountsMap.has(row.key);
    },

    async toggleSelectAll() {
      if (this.selectAll) {
        this.selectedAccountsMap.clear();
        this.filteredAccountsList.forEach(row => {
          this.selectedAccountsMap.set(row.key, row);
        });
      } else {
        this.selectedAccountsMap.clear();
      }
      await nextTick();
    },

    async toggleRowSelection(row) {
      const id = row.key;

      if (this.selectedAccountsMap.has(id)) {
        // Remove from selection
        this.selectedAccountsMap.delete(id);
      } else {
        // Add to selection
        this.selectedAccountsMap.set(id, row);
      }

      // Force reactivity update
      this.selectedAccountsMap = new Map(this.selectedAccountsMap);

      // Update selectAll checkbox state
      const selectedCount = this.selectedAccountsMap.size;
      if (selectedCount === 0) {
        this.selectAll = false;
      } else if (selectedCount === this.filteredAccountsList.length && this.filteredAccountsList.length > 0) {
        this.selectAll = true;
      } else {
        this.selectAll = false;
      }

      await nextTick();
    },

    submitSelection() {
      if (this.selectedAccountsMap.size === 0) {
        this.$q.notify({
          type: 'negative',
          message: 'Please select at least one account.'
        });
        return;
      }

      // Emit array of account IDs
      const accountIds = Array.from(this.selectedAccountsMap.keys());
      this.$emit('account-selected', accountIds);
    },

    async onDialogShow() {
      this.isInitializing = true;

      // Reset state
      this.selectedAccountsMap.clear();
      this.selectAll = false;
      this.searchBox = '';
      this.selectRole = 'all';
      this.selectDepartment = 'all';
      this.allAccounts = [];
      this.filteredAccountsList = [];

      // Wait for next tick to ensure watchers have processed
      await nextTick();

      // Fetch fresh account list
      await this.fetchAccountList();

      // Reset the flag after a short delay
      setTimeout(() => {
        this.isInitializing = false;
      }, 100);
    },

    onDialogHide() {
      // Clear selections when dialog closes
      this.selectedAccountsMap.clear();
      this.selectAll = false;
    },

    // Method to capitalize first letter of each word in a name
    capitalizeFullName(name) {
      if (!name) return '';

      // Split the name into words and capitalize each word
      return name
        .toLowerCase()
        .split(' ')
        .map(word => {
          // Handle special cases like "de", "van", "la", etc.
          const lowercaseWords = ['de', 'del', 'la', 'van', 'von', 'der', 'da', 'di'];
          if (lowercaseWords.includes(word)) {
            return word;
          }
          // Capitalize first letter of each word
          return word.charAt(0).toUpperCase() + word.slice(1);
        })
        .join(' ');
    },

    // Debounced search function
    debouncedSearch: debounce(function() {
      if (!this.isInitializing) {
        this.applyFilters();
      }
    }, 300)
  },

  watch: {
    selectRole() {
      if (!this.isInitializing) {
        this.applyFilters();
      }
    },
    selectDepartment() {
      if (!this.isInitializing) {
        this.applyFilters();
      }
    }
  }
};
</script>
