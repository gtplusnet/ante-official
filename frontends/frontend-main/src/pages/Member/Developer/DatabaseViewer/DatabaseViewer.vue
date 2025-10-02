<template>
  <q-page class="md3-page">
    <!-- Header -->
    <div class="md3-page-header">
      <div class="md3-header-content">
        <div class="md3-title-section">
          <h4 class="md3-page-title">Database Tables</h4>
          <p class="md3-page-subtitle">View and explore database schema and data</p>
        </div>
        <div class="md3-header-actions">
          <q-btn
            flat
            round
            icon="refresh"
            @click="() => loadTables()"
            class="md3-icon-btn"
          >
            <q-tooltip>Refresh tables</q-tooltip>
          </q-btn>
        </div>
      </div>
    </div>

    <!-- Search Bar -->
    <div class="md3-search-container">
      <div class="md3-search-field">
        <q-icon name="search" class="md3-search-icon" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search tables..."
          class="md3-search-input"
        />
        <q-btn
          v-if="searchQuery"
          @click="searchQuery = ''"
          flat
          round
          dense
          icon="close"
          class="md3-search-clear"
        />
      </div>
    </div>

    <!-- Content -->
    <div class="md3-content">
      <div v-if="loading" class="md3-loading-state">
        <q-circular-progress
          indeterminate
          size="40px"
          color="primary"
        />
        <div class="md3-loading-text">Loading database tables...</div>
      </div>

      <div v-else-if="error" class="md3-error-state">
        <q-icon name="error_outline" class="md3-error-icon" />
        <div class="md3-error-title">Failed to load tables</div>
        <div class="md3-error-message">{{ error }}</div>
        <q-btn
          flat
          color="primary"
          label="Try again"
          @click="() => loadTables()"
          class="md3-btn q-mt-md"
        />
      </div>

      <div v-else-if="filteredTables.length === 0" class="md3-empty-state">
        <q-icon name="table_view" class="md3-empty-icon" />
        <div class="md3-empty-title">No tables found</div>
        <div class="md3-empty-message">
          {{ searchQuery ? 'No tables match your search criteria.' : 'No database tables available.' }}
        </div>
      </div>

      <div v-else class="md3-table-container">
        <table class="md3-table">
          <thead>
            <tr>
              <th class="md3-table-header">Table Name</th>
              <th class="md3-table-header">Records</th>
              <th class="md3-table-header">Fields</th>
              <th class="md3-table-header">Relations</th>
              <th class="md3-table-header md3-actions-header">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="table in filteredTables"
              :key="table.name"
              class="md3-table-row"
            >
              <td class="md3-table-cell md3-table-name">
                <div class="md3-table-name-content">
                  <q-icon name="table_view" class="md3-table-icon" />
                  <span class="md3-table-name-text">{{ table.name }}</span>
                </div>
              </td>
              <td class="md3-table-cell md3-table-number">
                <span v-if="table.recordCount !== undefined" class="md3-record-count">
                  {{ table.recordCount.toLocaleString() }}
                </span>
                <q-skeleton v-else type="text" width="60px" height="16px" />
              </td>
              <td class="md3-table-cell md3-table-number">
                <span class="md3-field-count">{{ table.fieldsCount }}</span>
              </td>
              <td class="md3-table-cell md3-table-center">
                <q-icon
                  :name="table.hasRelations ? 'check_circle' : 'remove_circle'"
                  :color="table.hasRelations ? 'positive' : 'grey-5'"
                  size="18px"
                />
              </td>
              <td class="md3-table-cell md3-actions-cell">
                <div class="md3-actions-group">
                  <q-btn
                    flat
                    dense
                    no-caps
                    label="View Schema"
                    icon="visibility"
                    color="primary"
                    @click="viewSchema(table)"
                    class="md3-action-btn"
                  />
                  <q-btn
                    flat
                    dense
                    no-caps
                    label="Browse Data"
                    icon="table_chart"
                    color="primary"
                    @click="browseData(table)"
                    class="md3-action-btn"
                  />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Schema Dialog -->
    <q-dialog v-model="showSchemaDialog" maximized>
      <q-card class="md3-dialog-card">
        <!-- Dialog Header -->
        <q-card-section class="md3-dialog-header">
          <div class="row items-center">
            <div class="col">
              <div class="text-h5 text-weight-regular">{{ selectedTableName }} Schema</div>
              <div class="text-body2 text-grey-7 q-mt-xs">Table structure and relationships</div>
            </div>
            <div>
              <q-btn flat round icon="close" @click="showSchemaDialog = false" />
            </div>
          </div>
        </q-card-section>

        <!-- Dialog Content -->
        <q-card-section class="md3-dialog-content">
          <div v-if="selectedTableDetails" class="schema-content">
            <!-- Table Info -->
            <div class="md3-info-section">
              <div class="md3-info-grid">
                <div class="md3-info-item">
                  <div class="md3-info-label">Database Name</div>
                  <div class="md3-info-value">{{ selectedTableDetails.dbName }}</div>
                </div>
                <div class="md3-info-item">
                  <div class="md3-info-label">Total Records</div>
                  <div class="md3-info-value">{{ selectedTableDetails.recordCount.toLocaleString() }}</div>
                </div>
                <div class="md3-info-item">
                  <div class="md3-info-label">Total Fields</div>
                  <div class="md3-info-value">{{ selectedTableDetails.fields.length }}</div>
                </div>
                <div class="md3-info-item">
                  <div class="md3-info-label">Relationships</div>
                  <div class="md3-info-value">{{ selectedTableDetails.relations.length }}</div>
                </div>
              </div>
            </div>

            <!-- Fields Table -->
            <div class="md3-section">
              <h6 class="md3-section-title">Fields</h6>
              <div class="md3-fields-table-container">
                <table class="md3-fields-table">
                  <thead>
                    <tr>
                      <th>Field Name</th>
                      <th>Type</th>
                      <th>Nullable</th>
                      <th>Default</th>
                      <th>Constraints</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="field in selectedTableDetails.fields" :key="field.name">
                      <td class="field-name-cell">
                        <div class="field-name-content">
                          <span class="field-name">{{ field.name }}</span>
                          <div class="field-indicators">
                            <q-chip
                              v-if="field.isId"
                              dense
                              size="xs"
                              color="amber"
                              text-color="black"
                              label="PK"
                            />
                            <q-chip
                              v-if="field.isUnique"
                              dense
                              size="xs"
                              color="blue"
                              text-color="white"
                              label="UNQ"
                            />
                            <q-chip
                              v-if="field.kind === 'object'"
                              dense
                              size="xs"
                              color="green"
                              text-color="white"
                              label="FK"
                            />
                          </div>
                        </div>
                      </td>
                      <td>
                        <q-chip
                          :color="getTypeColor(field.type)"
                          text-color="white"
                          size="sm"
                          dense
                        >
                          {{ field.type }}{{ field.isList ? '[]' : '' }}
                        </q-chip>
                      </td>
                      <td class="text-center">
                        <q-icon
                          :name="field.isRequired ? 'close' : 'check'"
                          :color="field.isRequired ? 'negative' : 'positive'"
                          size="18px"
                        />
                      </td>
                      <td>
                        <span class="default-value">
                          {{ field.hasDefaultValue ? (field.default?.value || 'auto') : '-' }}
                        </span>
                      </td>
                      <td>
                        <div class="constraints">
                          <q-chip
                            v-if="field.isRequired"
                            dense
                            size="xs"
                            color="orange"
                            text-color="white"
                            label="Required"
                          />
                          <q-chip
                            v-if="field.isReadOnly"
                            dense
                            size="xs"
                            color="grey"
                            text-color="white"
                            label="Read-only"
                          />
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Relationships -->
            <div v-if="selectedTableDetails.relations.length > 0" class="md3-section">
              <h6 class="md3-section-title">Relationships</h6>
              <div class="md3-relations-grid">
                <div
                  v-for="relation in selectedTableDetails.relations"
                  :key="relation.name"
                  class="md3-relation-card"
                >
                  <div class="relation-header">
                    <q-icon name="link" color="green" />
                    <span class="relation-name">{{ relation.name }}</span>
                    <q-chip
                      :label="relation.isList ? 'One to Many' : 'One to One'"
                      :color="relation.isList ? 'purple' : 'blue'"
                      text-color="white"
                      size="xs"
                      dense
                    />
                  </div>
                  <div class="relation-target">
                    → {{ relation.type }}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="md3-loading-state">
            <q-circular-progress indeterminate size="40px" color="primary" />
            <div class="md3-loading-text">Loading schema details...</div>
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- Table Data Dialog -->
    <TableDataDialog
      v-if="selectedTable"
      v-model="showDataDialog"
      :table-name="selectedTable.name"
      :fields="selectedTable.fields"
      :initial-filters="tableDialogFilters"
      :related-from-table="tableDialogRelatedFrom"
      :source-field="tableDialogSourceField"
      @navigate-to-related="onNavigateToRelated"
    />
  </q-page>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted, nextTick, getCurrentInstance } from 'vue';
import TableDataDialog from './TableDataDialog.vue';

interface Field {
  name: string;
  type: string;
  kind: string;
  isList: boolean;
  isRequired: boolean;
  isUnique: boolean;
  isId: boolean;
  isReadOnly: boolean;
  hasDefaultValue: boolean;
  default?: any;
  relationName?: string;
  relationFromFields?: string[];
  relationToFields?: string[];
}

interface Relation {
  name: string;
  type: string;
  isList: boolean;
  relationName?: string;
  relationFromFields?: string[];
  relationToFields?: string[];
}

interface TableDetails {
  name: string;
  dbName: string;
  recordCount: number;
  fields: Field[];
  relations: Relation[];
  primaryKey?: any;
  uniqueFields?: string[][];
  uniqueIndexes?: any[];
}

interface Table {
  name: string;
  fieldsCount: number;
  hasRelations: boolean;
  recordCount?: number;
}

export default defineComponent({
  name: 'DatabaseViewer',
  components: {
    TableDataDialog,
  },
  setup() {
    const instance = getCurrentInstance();
    let $api = instance?.proxy?.$api;
    
    const loading = ref(false);
    const error = ref('');
    const searchQuery = ref('');
    const tables = ref<Table[]>([]);
    const tableDetails = ref<Record<string, TableDetails>>({});
    const showDataDialog = ref(false);
    const showSchemaDialog = ref(false);
    const selectedTable = ref<TableDetails | null>(null);
    const selectedTableName = ref('');
    const selectedTableDetails = ref<TableDetails | null>(null);
    const tableDialogFilters = ref<Record<string, any>>({});
    const tableDialogRelatedFrom = ref('');
    const tableDialogSourceField = ref('');

    const filteredTables = computed(() => {
      let result = tables.value;
      
      // Filter by search query if present
      if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase();
        result = result.filter(table => 
          table.name.toLowerCase().includes(query)
        );
      }
      
      // Sort alphabetically by table name
      return result.sort((a, b) => 
        a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
      );
    });

    const getTypeColor = (type: string): string => {
      const typeColors: Record<string, string> = {
        'String': 'blue',
        'Int': 'green',
        'Float': 'green',
        'Boolean': 'orange',
        'DateTime': 'purple',
        'Json': 'brown',
        'BigInt': 'teal',
        'Decimal': 'cyan',
      };
      return typeColors[type] || 'grey';
    };

    const loadTables = async (retryCount = 0) => {
      // Refresh API reference in case it wasn't available initially
      if (!$api) {
        $api = instance?.proxy?.$api;
      }
      
      if (!$api) {
        if (retryCount < 3) {
          // Retry after a short delay
          setTimeout(() => loadTables(retryCount + 1), 100);
          return;
        }
        error.value = 'API not available. Please refresh the page.';
        return;
      }
      
      loading.value = true;
      error.value = '';
      try {
        const response = await $api.get('/developer-database/tables');
        tables.value = response.data;
        
        // Load record counts for all tables
        for (const table of tables.value) {
          loadTableRecordCount(table.name);
        }
      } catch (err: any) {
        error.value = err.response?.data?.message || 'Failed to load tables';
        console.error('Error loading tables:', err);
      } finally {
        loading.value = false;
      }
    };

    const loadTableRecordCount = async (tableName: string) => {
      // Refresh API reference in case it wasn't available initially
      if (!$api) {
        $api = instance?.proxy?.$api;
      }
      if (!$api) return;
      
      try {
        const response = await $api.get(`/developer-database/table/${tableName}`);
        const tableIndex = tables.value.findIndex(t => t.name === tableName);
        if (tableIndex !== -1) {
          tables.value[tableIndex].recordCount = response.data.recordCount;
        }
        tableDetails.value[tableName] = response.data;
      } catch (err: any) {
        console.error(`Error loading record count for table ${tableName}:`, err);
      }
    };

    const loadTableDetails = async (tableName: string) => {
      // Refresh API reference in case it wasn't available initially
      if (!$api) {
        $api = instance?.proxy?.$api;
      }
      if (!$api) return;
      
      if (tableDetails.value[tableName]) {
        return tableDetails.value[tableName];
      }
      try {
        const response = await $api.get(`/developer-database/table/${tableName}`);
        tableDetails.value[tableName] = response.data;
        return response.data;
      } catch (err: any) {
        console.error(`Error loading details for table ${tableName}:`, err);
        throw err;
      }
    };

    const viewSchema = async (table: Table) => {
      selectedTableName.value = table.name;
      selectedTableDetails.value = null;
      showSchemaDialog.value = true;
      
      try {
        const details = await loadTableDetails(table.name);
        selectedTableDetails.value = details;
      } catch (err) {
        console.error('Failed to load table details:', err);
      }
    };

    const browseData = async (table: Table) => {
      try {
        const details = await loadTableDetails(table.name);
        selectedTable.value = details;
        
        // Reset relationship context for normal table browsing
        tableDialogFilters.value = {};
        tableDialogRelatedFrom.value = '';
        tableDialogSourceField.value = '';
        
        showDataDialog.value = true;
      } catch (err) {
        console.error('Failed to load table details:', err);
      }
    };

    const onNavigateToRelated = async (navigationData: any) => {
      try {
        // Load details for the related table
        const details = await loadTableDetails(navigationData.tableName);
        
        // Set up the dialog state for the related table
        selectedTable.value = details;
        tableDialogFilters.value = navigationData.filters;
        tableDialogRelatedFrom.value = navigationData.sourceTable;
        tableDialogSourceField.value = navigationData.sourceField;
        
        // Keep the dialog open (it will update with new data)
        showDataDialog.value = true;
      } catch (err) {
        console.error('Failed to load related table details:', err);
      }
    };

    onMounted(async () => {
      // Wait for next tick to ensure all plugins are loaded
      await nextTick();
      loadTables();
    });

    return {
      loading,
      error,
      searchQuery,
      tables,
      tableDetails,
      filteredTables,
      getTypeColor,
      loadTables,
      showDataDialog,
      showSchemaDialog,
      selectedTable,
      selectedTableName,
      selectedTableDetails,
      tableDialogFilters,
      tableDialogRelatedFrom,
      tableDialogSourceField,
      viewSchema,
      browseData,
      onNavigateToRelated,
    };
  },
});
</script>

<style lang="scss" scoped>
/* Material Design 3 Page Styles */
.md3-page {
  background-color: #fafbfd;
  min-height: 100vh;
  padding: 0;
}

.md3-page-header {
  background-color: #ffffff;
  border-bottom: 1px solid #e3e3e3;
  padding: 20px 24px;
  margin-bottom: 0;
}

.md3-header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 1200px;
  margin: 0 auto;
}

.md3-title-section {
  flex: 1;
}

.md3-page-title {
  font-size: 22px;
  font-weight: 400;
  line-height: 28px;
  color: #1f1f1f;
  margin: 0 0 4px 0;
}

.md3-page-subtitle {
  font-size: 14px;
  line-height: 20px;
  color: #5f6368;
  margin: 0;
}

.md3-header-actions {
  display: flex;
  gap: 8px;
}

.md3-icon-btn {
  color: #5f6368;
  
  &:hover {
    background-color: #f1f3f4;
  }
}

/* Search Container */
.md3-search-container {
  background-color: #ffffff;
  border-bottom: 1px solid #e3e3e3;
  padding: 16px 24px;
}

.md3-search-field {
  position: relative;
  background-color: #f5f5f7;
  border-radius: 22px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  height: 44px;
  max-width: 400px;
  margin: 0 auto;
  
  &:hover {
    background-color: #ebebed;
  }
  
  &:focus-within {
    background-color: #e8e8ea;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
  }
}

.md3-search-icon {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: #5f6368;
  font-size: 20px;
}

.md3-search-input {
  width: 100%;
  padding: 12px 48px 12px 48px;
  border: none;
  background: transparent;
  font-size: 14px;
  line-height: 20px;
  outline: none;
  color: #1f1f1f;
  
  &::placeholder {
    color: #71757a;
    font-size: 14px;
  }
}

.md3-search-clear {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  color: #5f6368;
}

/* Content Area */
.md3-content {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

/* Loading State */
.md3-loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px 24px;
  gap: 16px;
}

.md3-loading-text {
  font-size: 14px;
  color: #5f6368;
}

/* Error State */
.md3-error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px 24px;
  text-align: center;
}

.md3-error-icon {
  font-size: 48px;
  color: #ea4335;
  margin-bottom: 16px;
}

.md3-error-title {
  font-size: 20px;
  font-weight: 500;
  color: #1f1f1f;
  margin-bottom: 8px;
}

.md3-error-message {
  font-size: 14px;
  color: #5f6368;
  line-height: 20px;
}

/* Empty State */
.md3-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px 24px;
  text-align: center;
}

.md3-empty-icon {
  font-size: 48px;
  color: #dadce0;
  margin-bottom: 16px;
}

.md3-empty-title {
  font-size: 20px;
  font-weight: 500;
  color: #5f6368;
  margin-bottom: 8px;
}

.md3-empty-message {
  font-size: 14px;
  color: #71757a;
  line-height: 20px;
}

/* Table Container */
.md3-table-container {
  background-color: #ffffff;
  border-radius: 12px;
  border: 1px solid #e3e3e3;
  overflow: hidden;
}

/* Table Styles */
.md3-table {
  width: 100%;
  border-collapse: collapse;
  border-spacing: 0;
}

.md3-table-header {
  background-color: #f8f9fa;
  padding: 16px 20px;
  text-align: left;
  font-weight: 500;
  font-size: 12px;
  color: #5f6368;
  border-bottom: 1px solid #e3e3e3;
  white-space: nowrap;
  
  &.md3-actions-header {
    text-align: center;
  }
}

.md3-table-row {
  transition: background-color 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  
  &:hover {
    background-color: #f8f9fa;
  }
  
  &:not(:last-child) {
    border-bottom: 1px solid #e3e3e3;
  }
}

.md3-table-cell {
  padding: 16px 20px;
  vertical-align: middle;
  font-size: 14px;
  color: #1f1f1f;
}

.md3-table-name {
  .md3-table-name-content {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  
  .md3-table-icon {
    color: #5f6368;
    font-size: 20px;
  }
  
  .md3-table-name-text {
    font-weight: 500;
    color: #1f1f1f;
  }
}

.md3-table-number {
  text-align: right;
  font-variant-numeric: tabular-nums;
  
  .md3-record-count {
    color: #1f1f1f;
    font-weight: 500;
  }
  
  .md3-field-count {
    color: #5f6368;
  }
}

.md3-table-center {
  text-align: center;
}

.md3-actions-cell {
  text-align: center;
}

.md3-actions-group {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.md3-action-btn {
  border-radius: 16px;
  text-transform: none;
  font-weight: 500;
  letter-spacing: 0.1px;
  padding: 6px 16px;
  min-height: 32px;
  
  &:hover {
    background-color: rgba(26, 35, 126, 0.04);
  }
}

/* Dialog Styles */
.md3-dialog-card {
  height: 100vh;
  width: 100vw;
  max-width: none !important;
  max-height: none !important;
  display: flex;
  flex-direction: column;
  border-radius: 0 !important;
  background-color: #fafbfd;
  margin: 0 !important;
  box-shadow: none !important;
}

.md3-dialog-header {
  background-color: #ffffff;
  border-bottom: 1px solid #e3e3e3;
  flex-shrink: 0;
  padding: 16px 24px;
  
  .text-h5 {
    font-size: 20px;
    line-height: 24px;
    letter-spacing: 0;
  }
  
  .text-body2 {
    font-size: 13px;
    line-height: 16px;
    margin-top: 2px !important;
  }
}

.md3-dialog-content {
  flex: 1;
  overflow: auto;
  padding: 24px;
}

.schema-content {
  max-width: 1200px;
  margin: 0 auto;
}

/* Info Section */
.md3-info-section {
  background-color: #ffffff;
  border-radius: 12px;
  border: 1px solid #e3e3e3;
  padding: 24px;
  margin-bottom: 24px;
}

.md3-info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 24px;
}

.md3-info-item {
  .md3-info-label {
    font-size: 12px;
    color: #5f6368;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 4px;
  }
  
  .md3-info-value {
    font-size: 20px;
    color: #1f1f1f;
    font-weight: 500;
  }
}

/* Section Styles */
.md3-section {
  margin-bottom: 32px;
}

.md3-section-title {
  font-size: 16px;
  font-weight: 500;
  color: #1f1f1f;
  margin: 0 0 16px 0;
}

/* Fields Table */
.md3-fields-table-container {
  background-color: #ffffff;
  border-radius: 12px;
  border: 1px solid #e3e3e3;
  overflow: hidden;
}

.md3-fields-table {
  width: 100%;
  border-collapse: collapse;
  border-spacing: 0;
  
  thead {
    background-color: #f8f9fa;
    
    th {
      padding: 16px 20px;
      text-align: left;
      font-weight: 500;
      font-size: 12px;
      color: #5f6368;
      border-bottom: 1px solid #e3e3e3;
    }
  }
  
  tbody {
    tr {
      transition: background-color 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      
      &:hover {
        background-color: #f8f9fa;
      }
      
      &:not(:last-child) {
        border-bottom: 1px solid #e3e3e3;
      }
      
      td {
        padding: 16px 20px;
        vertical-align: middle;
        font-size: 14px;
        color: #1f1f1f;
      }
    }
  }
}

.field-name-cell {
  .field-name-content {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  
  .field-name {
    font-weight: 500;
    color: #1f1f1f;
  }
  
  .field-indicators {
    display: flex;
    gap: 4px;
  }
}

.default-value {
  font-family: 'Roboto Mono', monospace;
  font-size: 12px;
  color: #5f6368;
}

.constraints {
  display: flex;
  gap: 4px;
}

/* Relations Grid */
.md3-relations-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.md3-relation-card {
  background-color: #ffffff;
  border: 1px solid #e3e3e3;
  border-radius: 8px;
  padding: 16px;
  
  .relation-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
    
    .relation-name {
      font-weight: 500;
      color: #1f1f1f;
      flex: 1;
    }
  }
  
  .relation-target {
    font-size: 14px;
    color: #5f6368;
    margin-left: 26px;
  }
}

/* Button Styles */
.md3-btn {
  border-radius: 16px;
  text-transform: none;
  font-weight: 500;
  letter-spacing: 0.1px;
  padding: 0 20px;
  height: 36px;
  
  &:hover:not(:disabled) {
    background-color: rgba(0, 0, 0, 0.04);
  }
}

/* Responsive */
@media (max-width: 768px) {
  .md3-page-header {
    padding: 16px 20px;
  }
  
  .md3-search-container {
    padding: 12px 20px;
  }
  
  .md3-content {
    padding: 16px 20px;
  }
  
  .md3-header-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .md3-info-grid {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 16px;
  }
  
  .md3-relations-grid {
    grid-template-columns: 1fr;
  }
  
  .md3-actions-group {
    flex-direction: column;
    gap: 4px;
  }
  
  .md3-table-container {
    overflow-x: auto;
  }
  
  .md3-table {
    min-width: 600px;
  }
}
</style>