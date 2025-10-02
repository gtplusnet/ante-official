<template>
  <q-dialog v-model="dialogOpen" ref="dialog" persistent :style="{ width: '900px', 'max-width': '90vw', height: '80vh', 'max-height': '800px' }">
    <q-card flat class="md3-dialog-card">
      <!-- Fixed Header -->
      <q-card-section class="md3-dialog-header">
        <div class="row items-center">
          <div class="col">
            <div class="text-h5 text-weight-regular">Row Information</div>
            <div class="text-body2 text-grey-7 q-mt-xs">{{ tableName }} - Record #{{ rowIndex + 1 }}</div>
          </div>
          <div>
            <q-btn flat round icon="close" @click="dialog?.hide()" />
          </div>
        </div>
      </q-card-section>

      <!-- Dialog Content -->
      <q-card-section class="md3-dialog-content">
        <div class="row-information-container">
          <div v-if="!rowData" class="empty-state">
            <q-icon name="info" size="48px" color="grey-4" />
            <div class="empty-title">No Data</div>
            <div class="empty-subtitle">No row data available</div>
          </div>

          <div v-else class="fields-table-container">
            <table class="fields-table">
              <thead>
                <tr>
                  <th class="field-name-header">Field Name</th>
                  <th class="field-type-header">Type</th>
                  <th class="field-value-header">Value</th>
                  <th class="field-actions-header">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="field in fields"
                  :key="field.name"
                  class="field-row"
                >
                  <!-- Field Name -->
                  <td class="field-name-cell">
                    <div class="field-name-content">
                      <q-icon :name="getFieldIcon(field)" class="field-icon" />
                      <span class="field-name">{{ field.name }}</span>
                    </div>
                  </td>

                  <!-- Field Type -->
                  <td class="field-type-cell">
                    <q-chip
                      :color="getTypeColor(field.type)"
                      text-color="white"
                      size="sm"
                      dense
                      class="field-type-chip"
                    >
                      {{ field.type }}{{ field.isList ? '[]' : '' }}
                    </q-chip>
                  </td>

                  <!-- Field Value -->
                  <td class="field-value-cell">
                    <!-- JSON Field -->
                    <div v-if="isJsonField(field.name)" class="json-field">
                      <q-btn
                        flat
                        dense
                        no-caps
                        icon="visibility"
                        label="View JSON"
                        @click="showJsonDialog(rowData[field.name])"
                        class="view-json-btn"
                        size="sm"
                      />
                      <div class="json-preview">{{ truncateJson(rowData[field.name]) }}</div>
                    </div>

                    <!-- Date Field -->
                    <div v-else-if="isDateField(field.name)" class="date-field">
                      <span class="formatted-date">{{ formatDate(rowData[field.name]) }}</span>
                    </div>

                    <!-- Boolean Field -->
                    <div v-else-if="isBooleanField(field.name)" class="boolean-field">
                      <q-icon
                        :name="rowData[field.name] ? 'check_circle' : 'cancel'"
                        :color="rowData[field.name] ? 'positive' : 'negative'"
                        size="18px"
                      />
                      <span class="boolean-text">{{ rowData[field.name] ? 'True' : 'False' }}</span>
                    </div>

                    <!-- Number Field -->
                    <div v-else-if="isNumberField(field.name)" class="number-field">
                      <span class="number-value">{{ formatNumber(rowData[field.name]) }}</span>
                    </div>

                    <!-- Relationship Field -->
                    <div v-else-if="isRelationshipField(field.name)" class="relationship-field">
                      <div class="relationship-value">
                        <q-icon name="link" class="relationship-icon" />
                        <span class="relationship-text">
                          {{ rowData[field.name] !== null && rowData[field.name] !== undefined ? rowData[field.name] : 'NULL' }}
                        </span>
                        <q-chip
                          size="xs"
                          color="purple"
                          text-color="white"
                          class="relationship-chip"
                        >
                          → {{ field.type }}
                        </q-chip>
                        <!-- Count Badge -->
                        <q-badge
                          v-if="relationshipCounts[field.name] !== undefined"
                          :label="relationshipCounts[field.name]"
                          :color="relationshipCounts[field.name] > 0 ? 'positive' : 'grey'"
                          class="relationship-count-badge"
                        />
                        <q-spinner-dots
                          v-else-if="loadingCounts"
                          size="16px"
                          color="purple"
                          class="q-ml-sm"
                        />
                      </div>
                    </div>

                    <!-- Text Field -->
                    <div v-else class="text-field">
                      <span class="text-value">
                        {{ rowData[field.name] !== null && rowData[field.name] !== undefined ? rowData[field.name] : '-' }}
                      </span>
                    </div>
                  </td>

                  <!-- Actions -->
                  <td class="field-actions-cell">
                    <div class="action-buttons">
                      <!-- View Related Button (only for relationship fields with counts > 0) -->
                      <q-btn
                        v-if="isRelationshipField(field.name) && relationshipCounts[field.name] > 0"
                        flat
                        round
                        dense
                        icon="arrow_forward"
                        size="sm"
                        @click="navigateToRelatedTable(field.name)"
                        class="view-related-btn"
                      >
                        <q-tooltip>View {{ relationshipCounts[field.name] }} related {{ field.type }} record{{ relationshipCounts[field.name] === 1 ? '' : 's' }}</q-tooltip>
                      </q-btn>
                      
                      <!-- Copy Button -->
                      <q-btn
                        flat
                        round
                        dense
                        icon="content_copy"
                        size="sm"
                        @click="copyFieldValue(field.name)"
                        class="copy-btn"
                      >
                        <q-tooltip>Copy value</q-tooltip>
                      </q-btn>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </q-card-section>

      <!-- Fixed Footer -->
      <q-card-section class="md3-dialog-footer">
        <div class="row items-center justify-between">
          <div class="footer-info">
            <span class="text-body2 text-grey-7">
              {{ fields?.filter(f => f.kind === 'scalar').length || 0 }} fields
            </span>
          </div>
          <div class="footer-actions">
            <q-btn
              flat
              no-caps
              label="Copy All Data"
              icon="content_copy"
              @click="copyAllData"
              class="md3-btn"
            />
            <q-btn
              flat
              no-caps
              label="Close"
              @click="dialog?.hide()"
              class="md3-btn q-ml-md"
            />
          </div>
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
</template>

<script lang="ts">
import { defineComponent, ref, computed, watch, getCurrentInstance } from 'vue';
import { useQuasar } from 'quasar';

interface Field {
  name: string;
  type: string;
  kind: string;
  isList?: boolean;
  relationName?: string;
  relationFromFields?: string[];
  relationToFields?: string[];
}

export default defineComponent({
  name: 'RowInformationDialog',
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
    rowData: {
      type: Object,
      default: null,
    },
    rowIndex: {
      type: Number,
      default: -1,
    },
  },
  emits: ['update:modelValue', 'navigate-to-related'],
  setup(props, { emit }) {
    const instance = getCurrentInstance();
    const $api = instance?.proxy?.$api;
    const $q = useQuasar();
    const dialog = ref();
    const jsonDialogOpen = ref(false);
    const jsonDialogContent = ref<any>(null);
    const relationshipCounts = ref<Record<string, number>>({});
    const loadingCounts = ref(false);

    const dialogOpen = computed({
      get: () => props.modelValue,
      set: (value) => emit('update:modelValue', value),
    });

    const getFieldIcon = (field: Field): string => {
      // Check if it's a relationship field first
      if (field.kind === 'object' || (field.relationName !== null && field.relationName !== undefined)) {
        return 'link';
      }
      
      const icons: Record<string, string> = {
        'String': 'text_fields',
        'Int': 'tag',
        'Float': 'tag',
        'Boolean': 'toggle_on',
        'DateTime': 'event',
        'Json': 'data_object',
      };
      return icons[field.type] || 'label';
    };

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

    const isRelationshipField = (fieldName: string): boolean => {
      const field = props.fields.find(f => f.name === fieldName);
      return field?.kind === 'object' || (field?.relationName !== null && field?.relationName !== undefined);
    };

    const getRelatedTableInfo = (fieldName: string) => {
      const field = props.fields.find(f => f.name === fieldName);
      if (!field || !isRelationshipField(fieldName)) return null;
      
      return {
        tableName: field.type,
        relationName: field.relationName,
        fromFields: field.relationFromFields || [],
        toFields: field.relationToFields || ['id'], // Default to 'id' if not specified
      };
    };

    const formatDate = (value: string): string => {
      if (!value) return '-';
      return new Date(value).toLocaleString();
    };

    const formatNumber = (value: any): string => {
      if (value === null || value === undefined) return '-';
      const num = Number(value);
      if (isNaN(num)) return value.toString();
      return num.toLocaleString();
    };

    const truncateJson = (value: any): string => {
      if (!value) return '-';
      const str = JSON.stringify(value);
      return str.length > 100 ? str.substring(0, 100) + '...' : str;
    };

    const formatJson = (value: any): string => {
      return JSON.stringify(value, null, 2);
    };

    const showJsonDialog = (value: any) => {
      jsonDialogContent.value = value;
      jsonDialogOpen.value = true;
    };

    const copyFieldValue = (fieldName: string) => {
      if (!props.rowData) return;
      
      const value = props.rowData[fieldName];
      const textValue = value !== null && value !== undefined ? String(value) : '';
      
      navigator.clipboard.writeText(textValue).then(() => {
        $q.notify({
          type: 'positive',
          message: `Copied "${fieldName}" value to clipboard`,
          position: 'top',
        });
      }).catch(() => {
        $q.notify({
          type: 'negative',
          message: 'Failed to copy to clipboard',
          position: 'top',
        });
      });
    };

    const copyAllData = () => {
      if (!props.rowData) return;
      
      const jsonData = JSON.stringify(props.rowData, null, 2);
      
      navigator.clipboard.writeText(jsonData).then(() => {
        $q.notify({
          type: 'positive',
          message: 'Copied all row data to clipboard',
          position: 'top',
        });
      }).catch(() => {
        $q.notify({
          type: 'negative',
          message: 'Failed to copy to clipboard',
          position: 'top',
        });
      });
    };

    const navigateToRelatedTable = (fieldName: string) => {
      const field = props.fields.find(f => f.name === fieldName);
      if (!field || !isRelationshipField(fieldName) || !props.rowData) return;

      let filters: Record<string, any> = {};
      
      // Check if this is a many-to-one relationship (this table has the foreign key)
      if (field.relationFromFields && field.relationFromFields.length > 0) {
        // Get the foreign key value from the actual foreign key field
        const foreignKeyField = field.relationFromFields[0];
        const foreignKeyValue = props.rowData[foreignKeyField];
        
        if (foreignKeyValue === null || foreignKeyValue === undefined) {
          $q.notify({
            type: 'warning',
            message: `No value in foreign key field: ${foreignKeyField}`,
            position: 'top',
          });
          return;
        }
        
        // Filter the related table by its ID matching our foreign key
        const targetField = field.relationToFields?.[0] || 'id';
        filters = {
          [targetField]: {
            operator: 'eq',
            value: foreignKeyValue
          }
        };
      } else {
        // This is a one-to-many relationship (the other table has the foreign key)
        // We need to find which field in the related table points back to us
        const currentRowId = props.rowData.id || props.rowData.Id || props.rowData.ID;
        
        if (!currentRowId) {
          $q.notify({
            type: 'warning',
            message: 'Current row has no ID field',
            position: 'top',
          });
          return;
        }
        
        // Note: We'll pass special filters to help find the correct foreign key field
        // The backend should handle finding the correct field based on the relationship
        filters = {
          _relationship_source: {
            table: props.tableName,
            field: fieldName,
            value: currentRowId
          }
        };
      }

      emit('navigate-to-related', {
        tableName: field.type,
        filters: filters,
        sourceTable: props.tableName,
        sourceField: fieldName,
        relationName: field.relationName
      });
    };

    const fetchRelationshipCounts = async () => {
      if (!$api || !props.rowData || !props.rowData.id) return;
      
      loadingCounts.value = true;
      try {
        const response = await $api.get(
          `/developer-database/table/${props.tableName}/row/${props.rowData.id}/relationship-counts`
        );
        relationshipCounts.value = response.data || {};
      } catch (error) {
        console.error('Failed to fetch relationship counts:', error);
        relationshipCounts.value = {};
      } finally {
        loadingCounts.value = false;
      }
    };

    // Watch for dialog open and row data changes
    watch([() => props.modelValue, () => props.rowData], ([isOpen, rowData]) => {
      if (isOpen && rowData) {
        fetchRelationshipCounts();
      }
    });

    return {
      dialog,
      dialogOpen,
      jsonDialogOpen,
      jsonDialogContent,
      getFieldIcon,
      getTypeColor,
      isJsonField,
      isDateField,
      isBooleanField,
      isNumberField,
      formatDate,
      formatNumber,
      truncateJson,
      formatJson,
      showJsonDialog,
      copyFieldValue,
      copyAllData,
      isRelationshipField,
      getRelatedTableInfo,
      navigateToRelatedTable,
      relationshipCounts,
      loadingCounts,
    };
  },
});
</script>

<style lang="scss" scoped>
/* Row Information Specific Styles */
.md3-dialog-card {
  display: flex;
  flex-direction: column;
  border-radius: 16px !important;
  background-color: #ffffff;
  max-width: 900px;
  width: 100%;
  height: 80vh;
  max-height: 800px;
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.28);
  overflow: hidden;
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
    color: #1f1f1f;
    font-weight: 500;
  }
  
  .text-body2 {
    font-size: 13px;
    line-height: 16px;
    margin-top: 4px !important;
    color: #5f6368;
  }
}

.md3-dialog-content {
  flex: 1;
  overflow: hidden;
  position: relative;
  padding: 0 !important;
}

.row-information-container {
  height: 100%;
  padding: 0;
  display: flex;
  flex-direction: column;
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  text-align: center;
  height: 100%;
}

.empty-title {
  font-size: 20px;
  font-weight: 500;
  color: #5f6368;
  margin: 16px 0 8px 0;
}

.empty-subtitle {
  font-size: 14px;
  color: #71757a;
  line-height: 20px;
}

/* Fields Table */
.fields-table-container {
  flex: 1;
  overflow: auto;
  background-color: #ffffff;
  border: none;
  margin: 16px 24px;
  border-radius: 12px;
  border: 1px solid #e3e3e3;
}

.fields-table {
  width: 100%;
  border-collapse: collapse;
  border-spacing: 0;
  
  thead {
    background-color: #f8f9fa;
    
    th {
      padding: 16px;
      text-align: left;
      font-weight: 500;
      font-size: 12px;
      color: #5f6368;
      border-bottom: 1px solid #e3e3e3;
      white-space: nowrap;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      
      &.field-name-header {
        width: 25%;
        min-width: 200px;
      }
      
      &.field-type-header {
        width: 15%;
        min-width: 120px;
        text-align: center;
      }
      
      &.field-value-header {
        width: 50%;
      }
      
      &.field-actions-header {
        width: 10%;
        min-width: 80px;
        text-align: center;
      }
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
        padding: 16px;
        vertical-align: middle;
        font-size: 14px;
        color: #1f1f1f;
      }
    }
  }
}

/* Field Name Cell */
.field-name-cell {
  .field-name-content {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .field-icon {
    color: #5f6368;
    font-size: 16px;
    flex-shrink: 0;
  }
  
  .field-name {
    font-weight: 500;
    color: #1f1f1f;
    font-size: 14px;
  }
}

/* Field Type Cell */
.field-type-cell {
  text-align: center;
  
  .field-type-chip {
    border-radius: 12px;
    font-size: 11px;
    font-weight: 500;
  }
}

/* Field Value Cell */
.field-value-cell {
  max-width: 0;
  word-wrap: break-word;
}

/* Field Actions Cell */

/* Field Type Styles */
.json-field {
  display: flex;
  align-items: center;
  gap: 8px;
  
  .view-json-btn {
    color: #1a237e;
    flex-shrink: 0;
  }
  
  .json-preview {
    font-family: 'Roboto Mono', monospace;
    font-size: 12px;
    color: #5f6368;
    background-color: #f5f5f5;
    padding: 4px 8px;
    border-radius: 4px;
    word-break: break-all;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

.date-field {
  .formatted-date {
    font-size: 14px;
    color: #1f1f1f;
    font-family: 'Roboto Mono', monospace;
  }
}

.boolean-field {
  display: flex;
  align-items: center;
  gap: 8px;
  
  .boolean-text {
    font-size: 14px;
    font-weight: 500;
  }
}

.number-field {
  .number-value {
    font-size: 14px;
    font-weight: 500;
    color: #1f1f1f;
    font-family: 'Roboto Mono', monospace;
  }
}

.text-field {
  .text-value {
    font-size: 14px;
    color: #1f1f1f;
    word-break: break-word;
    line-height: 1.4;
  }
}

.relationship-field {
  .relationship-value {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }
  
  .relationship-icon {
    color: #7b1fa2;
    font-size: 16px;
    flex-shrink: 0;
  }
  
  .relationship-text {
    font-size: 14px;
    color: #1f1f1f;
    font-family: 'Roboto Mono', monospace;
    font-weight: 500;
  }
  
  .relationship-chip {
    border-radius: 12px;
    font-size: 10px;
    font-weight: 500;
  }
  
  .relationship-count-badge {
    margin-left: 8px;
    font-weight: 600;
    border-radius: 10px;
  }
}

/* Field Actions */
.field-actions-cell {
  text-align: center;
  
  .action-buttons {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
  }
  
  .copy-btn, .view-related-btn {
    color: #5f6368;
    
    &:hover {
      background-color: #f1f3f4;
    }
  }
  
  .view-related-btn {
    color: #7b1fa2;
    
    &:hover {
      background-color: rgba(123, 31, 162, 0.08);
    }
  }
}

/* Footer */
.md3-dialog-footer {
  background-color: #ffffff;
  border-top: 1px solid #e3e3e3;
  padding: 16px 24px;
  flex-shrink: 0;
  border-radius: 0 0 16px 16px;
}

.footer-info {
  flex: 1;
}

.footer-actions {
  display: flex;
  align-items: center;
}

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

/* Responsive */
@media (max-width: 968px) {
  .md3-dialog-card {
    width: 95vw !important;
    height: 90vh !important;
    max-height: 90vh !important;
  }
  
  .fields-table-container {
    margin: 12px 16px;
    overflow-x: auto;
  }
  
  .fields-table {
    min-width: 600px;
    
    thead th {
      padding: 12px 8px;
      
      &.field-name-header {
        min-width: 150px;
      }
      
      &.field-type-header {
        min-width: 100px;
      }
      
      &.field-actions-header {
        min-width: 60px;
      }
    }
    
    tbody td {
      padding: 12px 8px;
    }
  }
  
  .md3-dialog-header {
    padding: 12px 16px;
  }
  
  .md3-dialog-footer {
    padding: 12px 16px;
  }
  
  .field-name-content {
    flex-direction: column;
    align-items: flex-start !important;
    gap: 4px !important;
    
    .field-icon {
      align-self: flex-start;
    }
  }
  
  .json-field {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
    
    .json-preview {
      width: 100%;
    }
  }
  
  .footer-actions {
    flex-direction: column;
    gap: 8px;
    width: 100%;
    
    .md3-btn {
      width: 100%;
    }
  }
}
</style>