<template>
  <q-dialog v-model="dialogOpen" ref="dialog" persistent maximized>
    <q-card flat class="md3-dialog-card">
      <!-- Fixed Header -->
      <q-card-section class="md3-dialog-header">
        <div class="row items-center">
          <div class="col">
            <div class="text-h5 text-weight-regular">
              {{ tableName }} Table Data
              <q-chip
                v-if="relatedFromTable"
                size="sm"
                color="purple"
                text-color="white"
                class="q-ml-sm"
              >
                Related from {{ relatedFromTable }}
              </q-chip>
            </div>
            <div class="text-body2 text-grey-7 q-mt-xs">
              {{ relatedFromTable ? `Showing records related to ${relatedFromTable}.${sourceField}` : 'View and search table records' }}
            </div>
          </div>
          <div>
            <q-btn flat round icon="close" @click="dialog?.hide()" />
          </div>
        </div>
      </q-card-section>

      <!-- Summary Info Bar -->
      <q-card-section class="md3-info-bar q-py-md">
        <div class="row items-center justify-between">
          <div class="row q-gutter-xl">
            <div>
              <div class="text-overline text-grey-7">TOTAL RECORDS</div>
              <div class="text-body1">{{ pagination.rowsNumber.toLocaleString() }}</div>
            </div>
            <div>
              <div class="text-overline text-grey-7">CURRENT PAGE</div>
              <div class="text-body1">{{ pagination.page }} of {{ Math.ceil(pagination.rowsNumber / pagination.rowsPerPage) }}</div>
            </div>
            <div>
              <div class="text-overline text-grey-7">ROWS PER PAGE</div>
              <div class="text-body1">{{ pagination.rowsPerPage }}</div>
            </div>
          </div>
        </div>
      </q-card-section>

      <!-- Search and Filters Bar -->
      <q-card-section class="md3-search-bar">
        <div class="row items-center justify-between">
          <!-- Search Field -->
          <div class="md3-search-container" style="flex: 1; max-width: 400px;">
            <div class="md3-search-field">
              <q-icon name="search" class="md3-search-icon" />
              <input
                v-model="searchQuery"
                @input="debouncedLoadData"
                type="text"
                placeholder="Search all text fields..."
                class="md3-search-input"
              />
              <q-btn
                v-if="searchQuery"
                @click="searchQuery = ''; debouncedLoadData()"
                flat
                round
                dense
                icon="close"
                class="md3-search-clear"
              />
            </div>
          </div>
          
          <!-- Filter Button -->
          <div class="md3-filter-button-container">
            <q-btn
              flat
              no-caps
              icon="filter_list"
              label="Filter"
              @click="showAdvancedFilters = true"
              class="md3-filter-btn"
            >
              <q-badge
                v-if="activeFilterCount > 0"
                :label="activeFilterCount"
                color="primary"
                floating
                rounded
              />
            </q-btn>
          </div>
        </div>
        
        <!-- Active Filters Summary -->
        <div v-if="activeFilterCount > 0" class="md3-active-filters">
          <div class="md3-active-filters-label">Active filters:</div>
          <div class="md3-filter-chips">
            <q-chip
              v-for="(filter, key) in activeFilters"
              :key="key"
              removable
              @remove="removeFilter(key)"
              color="primary"
              text-color="white"
              size="sm"
              :class="[
                'md3-filter-chip',
                key === '_relationship_source' ? 'md3-filter-chip--relationship' : '',
                key === '_global_search' ? 'md3-filter-chip--search' : ''
              ]"
            >
              <q-icon 
                v-if="key === '_relationship_source'"
                name="link"
                size="14px"
                class="q-mr-xs"
              />
              <q-icon 
                v-else-if="key === '_global_search'"
                name="search"
                size="14px"
                class="q-mr-xs"
              />
              {{ getFilterDisplayText(key, filter) }}
            </q-chip>
            <q-btn
              flat
              dense
              size="sm"
              label="Clear all"
              @click="clearAllFilters"
              class="md3-clear-filters-btn"
            />
          </div>
        </div>
      </q-card-section>

      <!-- Scrollable Content -->
      <q-card-section class="md3-dialog-content q-pa-0">
        <div class="table-container">
          <!-- Empty State - Outside Table -->
          <div v-if="!loading && tableData.length === 0" class="empty-state-container">
            <div class="empty-state">
              <q-icon name="o_description" />
              <div class="empty-title">No Data Found</div>
              <div class="empty-subtitle">No records found in the {{ tableName }} table</div>
            </div>
          </div>
          
          <!-- Table - Only shown when there's data or loading -->
          <div v-if="loading || tableData.length > 0" class="scrollable-table-wrapper" ref="tableWrapper">
            <table class="database-table">
              <thead>
                <tr>
                  <th 
                    v-for="col in columns" 
                    :key="col.name"
                    @click="sortBy(col.name)"
                    class="sortable"
                  >
                    <div class="header-content">
                      <span>{{ col.label }}</span>
                      <q-icon 
                        v-if="pagination.sortBy === col.name"
                        :name="pagination.descending ? 'arrow_downward' : 'arrow_upward'"
                        size="16px"
                        class="sort-icon"
                      />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody v-if="loading" class="loading">
                <tr v-for="n in 10" :key="`skeleton-${n}`" class="skeleton-row">
                  <td v-for="col in columns" :key="`${n}-${col.name}`">
                    <q-skeleton type="text" />
                  </td>
                </tr>
              </tbody>
              <tbody v-if="!loading && tableData.length > 0">
                <tr v-for="(row, index) in tableData" :key="index" @click="showRowDetails(row, index)" class="clickable-row">
                  <td v-for="col in columns" :key="`${index}-${col.name}`">
                    <div v-if="isJsonField(col.field)" class="json-cell">
                      <q-btn
                        size="xs"
                        flat
                        dense
                        icon="visibility"
                        @click="showJsonDialog(row[col.field])"
                      >
                        <q-tooltip>View JSON</q-tooltip>
                      </q-btn>
                      <span class="text-caption">{{ truncateJson(row[col.field]) }}</span>
                    </div>
                    <div v-else-if="isDateField(col.field)">
                      {{ formatDate(row[col.field]) }}
                    </div>
                    <div v-else-if="isBooleanField(col.field)" class="boolean-cell">
                      <q-icon
                        :name="row[col.field] ? 'check_circle' : 'cancel'"
                        :color="row[col.field] ? 'positive' : 'negative'"
                        size="18px"
                      />
                    </div>
                    <div v-else-if="isNumberField(col.field)" class="number-cell">
                      {{ formatNumber(row[col.field]) }}
                    </div>
                    <div v-else class="text-cell">
                      {{ row[col.field] !== null && row[col.field] !== undefined ? row[col.field] : '-' }}
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </q-card-section>

      <!-- Fixed Footer with Pagination -->
      <q-card-section class="md3-dialog-footer">
        <div class="row items-center justify-between">
          <div class="text-body2 text-grey-7">
            Showing {{ ((pagination.page - 1) * pagination.rowsPerPage) + 1 }} - 
            {{ Math.min(pagination.page * pagination.rowsPerPage, pagination.rowsNumber) }} 
            of {{ pagination.rowsNumber }} records
          </div>
          <q-pagination
            v-model="pagination.page"
            :max="Math.ceil(pagination.rowsNumber / pagination.rowsPerPage)"
            :max-pages="7"
            boundary-numbers
            @update:model-value="loadData"
            color="primary"
            size="sm"
          />
          <q-select
            v-model="pagination.rowsPerPage"
            :options="[10, 25, 50, 100]"
            dense
            borderless
            @update:model-value="onRowsPerPageChange"
            class="rows-per-page"
          >
            <template v-slot:prepend>
              <span class="text-body2 text-grey-7 q-mr-xs">Rows:</span>
            </template>
          </q-select>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>

  <!-- JSON Viewer Dialog -->
  <q-dialog v-model="jsonDialogOpen">
    <q-card style="min-width: 400px; max-width: 600px;">
      <q-card-section>
        <div class="text-h6">JSON Data</div>
      </q-card-section>
      <q-card-section class="q-pt-none">
        <pre class="json-content">{{ formatJson(jsonDialogContent) }}</pre>
      </q-card-section>
      <q-card-actions align="right">
        <q-btn flat label="Close" color="primary" v-close-popup />
      </q-card-actions>
    </q-card>
  </q-dialog>

  <!-- Advanced Filter Dialog -->
  <AdvancedFilterDialog
    v-model="showAdvancedFilters"
    :table-name="tableName"
    :fields="fields"
    :initial-filters="advancedFilters"
    @apply-filters="onApplyAdvancedFilters"
  />

  <!-- Row Information Dialog -->
  <RowInformationDialog
    v-model="showRowDialog"
    :table-name="tableName"
    :fields="fields"
    :row-data="selectedRowData"
    :row-index="selectedRowIndex"
    @navigate-to-related="onNavigateToRelated"
  />
</template>

<script lang="ts">
import { defineComponent, ref, computed, watch, getCurrentInstance, nextTick } from 'vue';
import { defineAsyncComponent } from 'vue';
import { debounce } from 'quasar';

// Lazy-loaded dialogs (ALL dialogs must be lazy loaded - CLAUDE.md)
const AdvancedFilterDialog = defineAsyncComponent(() =>
  import('./AdvancedFilterDialog.vue')
);
const RowInformationDialog = defineAsyncComponent(() =>
  import('./RowInformationDialog.vue')
);

interface Field {
  name: string;
  type: string;
  kind: string;
}

export default defineComponent({
  name: 'TableDataDialog',
  components: {
    AdvancedFilterDialog,
    RowInformationDialog,
  },
  props: {
    modelValue: {
      type: Boolean,
      required: true,
    },
    tableName: {
      type: String,
      required: true,
    },
    fields: {
      type: Array as () => Field[],
      required: true,
    },
    initialFilters: {
      type: Object as () => Record<string, any>,
      default: () => ({}),
    },
    relatedFromTable: {
      type: String,
      default: '',
    },
    sourceField: {
      type: String,
      default: '',
    },
  },
  emits: ['update:modelValue', 'navigate-to-related'],
  setup(props, { emit }) {
    const instance = getCurrentInstance();
    let $api = instance?.proxy?.$api;
    const dialog = ref();
    
    const loading = ref(false);
    const tableData = ref<any[]>([]);
    const filters = ref<Record<string, string>>({});
    const searchQuery = ref('');
    const jsonDialogOpen = ref(false);
    const jsonDialogContent = ref<any>(null);

    const dialogOpen = computed({
      get: () => props.modelValue,
      set: (value) => emit('update:modelValue', value),
    });

    const pagination = ref({
      sortBy: null as string | null,
      descending: false,
      page: 1,
      rowsPerPage: 50,
      rowsNumber: 0,
    });

    const showAdvancedFilters = ref(false);
    const advancedFilters = ref<Record<string, any>>({});
    const showRowDialog = ref(false);
    const selectedRowData = ref<any>(null);
    const selectedRowIndex = ref<number>(-1);

    const activeFilters = computed(() => {
      const combined = { ...filters.value };
      Object.keys(advancedFilters.value).forEach(key => {
        if (advancedFilters.value[key] && advancedFilters.value[key].value !== null && advancedFilters.value[key].value !== undefined && advancedFilters.value[key].value !== '') {
          combined[key] = advancedFilters.value[key];
        }
      });
      return combined;
    });

    const activeFilterCount = computed(() => {
      return Object.keys(activeFilters.value).length;
    });

    const columns = computed(() => {
      return props.fields
        .filter(field => field.kind === 'scalar')
        .map(field => ({
          name: field.name,
          label: field.name,
          field: field.name,
          align: 'left' as const,
          sortable: true,
        }));
    });

    const isJsonField = (fieldName: string): boolean => {
      const field = props.fields.find(f => f.name === fieldName);
      return field?.type === 'Json';
    };

    const isDateField = (fieldName: string): boolean => {
      const field = props.fields.find(f => f.name === fieldName);
      return field?.type === 'DateTime';
    };

    const isBooleanField = (fieldName: string): boolean => {
      const field = props.fields.find(f => f.name === fieldName);
      return field?.type === 'Boolean';
    };

    const isNumberField = (fieldName: string): boolean => {
      const field = props.fields.find(f => f.name === fieldName);
      return field?.type === 'Int' || field?.type === 'Float';
    };

    const formatDate = (value: string): string => {
      if (!value) return '-';
      return new Date(value).toLocaleString();
    };

    const truncateJson = (value: any): string => {
      if (!value) return '-';
      const str = JSON.stringify(value);
      return str.length > 50 ? str.substring(0, 50) + '...' : str;
    };

    const formatJson = (value: any): string => {
      return JSON.stringify(value, null, 2);
    };

    const formatNumber = (value: any): string => {
      if (value === null || value === undefined) return '-';
      const num = Number(value);
      if (isNaN(num)) return value.toString();
      return num.toLocaleString();
    };

    const showJsonDialog = (value: any) => {
      jsonDialogContent.value = value;
      jsonDialogOpen.value = true;
    };

    const showRowDetails = (row: any, index: number) => {
      selectedRowData.value = row;
      selectedRowIndex.value = index;
      showRowDialog.value = true;
    };

    const getFieldIcon = (type: string): string => {
      const icons: Record<string, string> = {
        'String': 'text_fields',
        'Int': 'tag',
        'Float': 'tag',
        'Boolean': 'toggle_on',
        'DateTime': 'event',
      };
      return icons[type] || 'label';
    };

    const sortBy = (field: string) => {
      if (pagination.value.sortBy === field) {
        pagination.value.descending = !pagination.value.descending;
      } else {
        pagination.value.sortBy = field;
        pagination.value.descending = false;
      }
      loadData();
    };

    const onRowsPerPageChange = () => {
      pagination.value.page = 1;
      loadData();
    };

    const loadData = async (retryCount = 0) => {
      // Refresh API reference in case it wasn't available initially
      if (!$api) {
        $api = instance?.proxy?.$api;
      }
      
      if (!$api) {
        if (retryCount < 3) {
          // Retry after a short delay
          setTimeout(() => loadData(retryCount + 1), 100);
          return;
        }
        console.error('API not available after retries');
        return;
      }
      
      if (!props.tableName) return;
      
      loading.value = true;
      try {
        const params = new URLSearchParams({
          page: pagination.value.page.toString(),
          limit: pagination.value.rowsPerPage.toString(),
        });

        if (pagination.value.sortBy) {
          params.append('sortBy', pagination.value.sortBy);
          params.append('sortOrder', pagination.value.descending ? 'desc' : 'asc');
        }

        // Add filters including search and advanced filters
        const combinedFilters: Record<string, any> = {};
        
        // Add simple filters
        Object.entries(filters.value)
          .filter(([, value]) => value !== null && value !== undefined && value !== '')
          .forEach(([key, value]) => {
            combinedFilters[key] = value;
          });
        
        // Add advanced filters
        Object.entries(advancedFilters.value)
          .filter(([key, filterObj]) => filterObj && (
            (filterObj.value !== null && filterObj.value !== undefined && filterObj.value !== '') ||
            key === '_relationship_source' // Always include _relationship_source even if value is present at top level
          ))
          .forEach(([key, filterObj]) => {
            // Check if this is a special filter (like _relationship_source) or a regular advanced filter
            if (key === '_relationship_source' || !filterObj.operator) {
              // Special filters - preserve the full object structure
              combinedFilters[key] = filterObj;
            } else {
              // Regular advanced filters with operator - extract just the value
              combinedFilters[key] = filterObj.value;
            }
          });

        // Add search across all string fields if search query exists
        if (searchQuery.value) {
          const stringFields = props.fields.filter(f => f.type === 'String' && f.kind === 'scalar');
          if (stringFields.length > 0) {
            // Create a special search filter that the backend can handle
            combinedFilters['_global_search'] = searchQuery.value;
          }
        }

        if (Object.keys(combinedFilters).length > 0) {
          params.append('filters', JSON.stringify(combinedFilters));
        }

        const response = await $api.get(`/developer-database/table-data/${props.tableName}?${params}`);
        
        tableData.value = response.data.data;
        pagination.value.rowsNumber = response.data.pagination.total;
        pagination.value.page = response.data.pagination.page;
      } catch (error: any) {
        console.error('Error loading table data:', error);
      } finally {
        loading.value = false;
      }
    };

    const debouncedLoadData = debounce(() => {
      pagination.value.page = 1; // Reset to first page when filtering
      loadData();
    }, 500);

    // Load data when dialog opens
    watch(() => props.modelValue, async (newVal) => {
      if (newVal) {
        console.log('TableDataDialog opened for table:', props.tableName);
        filters.value = {};
        searchQuery.value = '';
        pagination.value.page = 1;
        pagination.value.sortBy = null;
        pagination.value.descending = false;
        
        // Apply initial filters if provided
        if (props.initialFilters && Object.keys(props.initialFilters).length > 0) {
          advancedFilters.value = { ...props.initialFilters };
        } else {
          advancedFilters.value = {};
        }
        
        // Wait for next tick to ensure dialog is fully mounted
        await nextTick();
        console.log('About to call loadData, $api:', !!$api, 'tableName:', props.tableName);
        loadData();
      }
    }, { immediate: true });

    // Watch for table name changes (when navigating to related tables)
    watch(() => props.tableName, async (newTableName, oldTableName) => {
      if (newTableName && newTableName !== oldTableName && props.modelValue) {
        // Clear existing filters and search
        filters.value = {};
        searchQuery.value = '';
        pagination.value.page = 1;
        pagination.value.sortBy = null;
        pagination.value.descending = false;
        
        // Apply new filters if provided
        if (props.initialFilters && Object.keys(props.initialFilters).length > 0) {
          advancedFilters.value = { ...props.initialFilters };
        } else {
          advancedFilters.value = {};
        }
        
        // Wait for next tick to ensure dialog is fully mounted
        await nextTick();
        // Reload data for the new table
        loadData();
      }
    });

    // Watch for initial filter changes
    watch(() => props.initialFilters, (newFilters) => {
      if (newFilters && Object.keys(newFilters).length > 0 && props.modelValue) {
        advancedFilters.value = { ...newFilters };
        pagination.value.page = 1;
        loadData();
      }
    }, { deep: true, immediate: true });

    return {
      dialog,
      dialogOpen,
      loading,
      tableData,
      columns,
      filters,
      searchQuery,
      showAdvancedFilters,
      advancedFilters,
      activeFilters,
      activeFilterCount,
      pagination,
      jsonDialogOpen,
      jsonDialogContent,
      isJsonField,
      isDateField,
      isBooleanField,
      isNumberField,
      formatDate,
      formatNumber,
      truncateJson,
      formatJson,
      showJsonDialog,
      showRowDetails,
      showRowDialog,
      selectedRowData,
      selectedRowIndex,
      debouncedLoadData,
      loadData,
      sortBy,
      onRowsPerPageChange,
      getFieldIcon,
      removeFilter: (key: string | number) => {
        const keyStr = String(key);
        if (filters.value[keyStr] !== undefined) {
          filters.value[keyStr] = '';
        } else {
          delete advancedFilters.value[keyStr];
        }
        debouncedLoadData();
      },
      clearAllFilters: () => {
        filters.value = {};
        advancedFilters.value = {};
        debouncedLoadData();
      },
      getFilterDisplayText: (key: string | number, filter: any) => {
        const keyStr = String(key);
        
        // Handle special _relationship_source filter
        if (keyStr === '_relationship_source' && typeof filter === 'object') {
          if (filter.table && filter.field) {
            return `Related from ${filter.table}.${filter.field}`;
          }
          return 'Related records';
        }
        
        // Handle global search
        if (keyStr === '_global_search') {
          return `Search: "${filter}"`;
        }
        
        // Handle advanced filters with operators
        if (typeof filter === 'object' && filter.operator && filter.value !== undefined) {
          const operatorMap: Record<string, string> = {
            'eq': '=',
            'contains': 'contains',
            'gt': '>',
            'gte': '≥',
            'lt': '<',
            'lte': '≤',
            'ne': '≠'
          };
          const displayOp = operatorMap[filter.operator] || filter.operator;
          return `${keyStr} ${displayOp} ${filter.value}`;
        }
        
        // Handle simple filters
        const field = props.fields.find(f => f.name === keyStr);
        if (field) {
          if (field.type === 'Boolean') {
            return `${keyStr} = ${filter}`;
          } else if (field.type === 'String') {
            return `${keyStr} contains "${filter}"`;
          }
        }
        
        return `${keyStr} = ${filter}`;
      },
      onApplyAdvancedFilters: (filters: Record<string, any>) => {
        advancedFilters.value = filters;
        pagination.value.page = 1; // Reset to first page
        loadData();
      },
      onNavigateToRelated: (navigationData: any) => {
        // Close the current row dialog
        showRowDialog.value = false;
        // Emit the navigation event to the parent (DatabaseViewer)
        emit('navigate-to-related', navigationData);
      },
    };
  },
});
</script>

<style lang="scss" scoped>
/* Import Material Design 3 dialog styles */
@import '../../../../components/shared/styles/md3-dialog.scss';

/* Database Table Specific Styles */
.database-table {
  width: 100%;
  border-collapse: collapse;
  border-spacing: 0;
  border: none;
  table-layout: auto;
  position: relative;

  thead {
    background-color: #fafbfd;
    position: sticky;
    top: 0;
    z-index: 10;
    
    tr {
      th {
        position: sticky;
        top: 0;
        padding: 8px 12px;
        white-space: nowrap;
        font-weight: 500;
        font-size: 11px;
        color: #5f6368;
        z-index: 1;
        background-color: #fafbfd;
        border-bottom: 1px solid #e3e3e3;
        border-right: 1px solid #e3e3e3;
        text-align: center;
        cursor: pointer;
        user-select: none;
        
        &:last-child {
          border-right: none;
        }
        
        &.sortable:hover {
          background-color: #f0f0f2;
        }
        
        .header-content {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          
          .sort-icon {
            color: var(--q-primary);
          }
        }
      }
    }
  }

  tbody {
    &.loading {
      .skeleton-row {
        td {
          padding: 6px 12px;
          border-bottom: 1px solid #e2e8f0;
          border-right: 1px solid #e3e3e3;
          background-color: #ffffff;
          text-align: center;
          
          &:last-child {
            border-right: none;
          }
          
          .q-skeleton {
            max-width: 100%;
            animation: q-skeleton-fade 1.5s ease-in-out infinite;
            border-radius: 4px;
            height: 16px;
          }
        }
      }
    }
    
    tr {
      &:hover {
        background-color: #f8f9fa;
      }
      
      &.clickable-row {
        cursor: pointer;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        
        &:hover {
          background-color: #e3f2fd;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
        }
        
        &:active {
          background-color: #bbdefb;
        }
      }
      
      td {
        padding: 6px 12px;
        border-bottom: 1px solid #e2e8f0;
        border-right: 1px solid #e3e3e3;
        background-color: #ffffff;
        font-size: 12px;
        color: #1f1f1f;
        text-align: center;
        
        &:last-child {
          border-right: none;
        }
        
        .text-cell {
          max-width: 300px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .json-cell {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .boolean-cell {
          text-align: center;
        }
        
        .number-cell {
          text-align: center;
          font-variant-numeric: tabular-nums;
          font-weight: 500;
        }
      }
    }
  }
}

/* Enhanced Filter Interface */
.md3-search-container {
  display: flex;
  align-items: center;
}

.md3-filter-button-container {
  flex-shrink: 0;
}

.md3-filter-btn {
  border-radius: 16px;
  text-transform: none;
  font-weight: 500;
  letter-spacing: 0.1px;
  padding: 8px 16px;
  height: 36px;
  color: #1a237e;
  
  &:hover {
    background-color: rgba(26, 35, 126, 0.04);
  }
}

/* Active Filters Summary */
.md3-active-filters {
  margin-top: 16px;
  padding: 16px;
  background-color: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e8eaed;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: #f1f3f4;
    border-color: #dadce0;
  }
}

.md3-active-filters-label {
  font-size: 11px;
  font-weight: 600;
  color: #5f6368;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  
  &::before {
    content: '';
    width: 3px;
    height: 14px;
    background-color: var(--q-primary);
    border-radius: 2px;
  }
}

.md3-filter-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.md3-filter-chip {
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
  background-color: #e8f0fe !important;
  color: #1967d2 !important;
  border: 1px solid transparent;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: #d2e3fc !important;
    border-color: #1967d2;
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  
  :deep(.q-chip__content) {
    padding: 6px 14px;
    font-weight: 500;
  }
  
  :deep(.q-chip__icon--remove) {
    color: #1967d2;
    opacity: 0.7;
    margin-left: 4px;
    
    &:hover {
      opacity: 1;
      background-color: rgba(25, 103, 210, 0.1);
    }
  }
  
  // Special styling for relationship filters
  &.md3-filter-chip--relationship {
    background-color: #f3e8fd !important;
    color: #7b1fa2 !important;
    
    &:hover {
      background-color: #e1bee7 !important;
      border-color: #7b1fa2;
    }
    
    :deep(.q-chip__icon--remove) {
      color: #7b1fa2;
    }
  }
  
  // Special styling for search filters
  &.md3-filter-chip--search {
    background-color: #e8f5e9 !important;
    color: #2e7d32 !important;
    
    &:hover {
      background-color: #c8e6c9 !important;
      border-color: #2e7d32;
    }
    
    :deep(.q-chip__icon--remove) {
      color: #2e7d32;
    }
  }
}

.md3-clear-filters-btn {
  color: #d32f2f;
  font-size: 12px;
  text-transform: none;
  padding: 6px 14px;
  border-radius: 16px;
  font-weight: 500;
  transition: all 0.2s ease;
  border: 1px solid transparent;
  
  &:hover {
    background-color: #ffebee;
    border-color: #d32f2f;
    transform: translateY(-1px);
  }
  
  &:active {
    transform: translateY(0);
  }
}

/* Empty State */
.empty-state-container {
  display: flex;
  align-items: center;
  justify-content: center;
  height: calc(100vh - 300px);
  
  .empty-state {
    text-align: center;
    padding: 48px;
    
    .q-icon {
      font-size: 64px;
      color: #d9d9d9;
      margin-bottom: 16px;
    }
    
    .empty-title {
      font-size: 20px;
      font-weight: 500;
      color: #5f6368;
      margin-bottom: 8px;
    }
    
    .empty-subtitle {
      font-size: 14px;
      color: #71757a;
    }
  }
}

/* Table Container */
.table-container {
  height: 100%;
  position: relative;
  padding: 0 !important;
  margin: 0 !important;
}

.scrollable-table-wrapper {
  height: 100%;
  overflow: auto;
  position: relative;
}

/* Dialog Content Override */
.md3-dialog-content {
  padding: 0 !important;
  margin: 0 !important;
}

/* Dialog Footer */
.md3-dialog-footer {
  background-color: #ffffff;
  border-top: 1px solid #e3e3e3;
  padding: 12px 16px;
  flex-shrink: 0;
  
  .rows-per-page {
    :deep(.q-field__control) {
      height: 32px;
    }
    
    :deep(.q-field__native) {
      font-size: 14px;
    }
  }
}

/* JSON Dialog */
.json-content {
  background-color: #f5f5f5;
  padding: 12px;
  border-radius: 4px;
  overflow-x: auto;
  max-height: 400px;
  font-size: 12px;
  font-family: monospace;
}

/* Responsive adjustments for filter interface */
@media (max-width: 768px) {
  .md3-search-bar {
    .row {
      flex-direction: column;
      gap: 12px;
      align-items: stretch;
    }
  }
  
  .md3-search-container {
    width: 100%;
    max-width: none !important;
  }
  
  .md3-filter-button-container {
    width: 100%;
    
    .md3-filter-btn {
      width: 100%;
      justify-content: center;
    }
  }
  
  .md3-filter-chips {
    justify-content: center;
  }
}
</style>