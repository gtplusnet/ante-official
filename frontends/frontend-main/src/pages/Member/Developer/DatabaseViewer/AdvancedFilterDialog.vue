<template>
  <q-dialog v-model="dialogOpen" ref="dialog" persistent maximized>
    <q-card flat class="md3-dialog-card">
      <!-- Fixed Header -->
      <q-card-section class="md3-dialog-header">
        <div class="row items-center">
          <div class="col">
            <div class="text-h5 text-weight-regular">Advanced Filters</div>
            <div class="text-body2 text-grey-7 q-mt-xs">Build complex filter conditions for {{ tableName }}</div>
          </div>
          <div>
            <q-btn flat round icon="close" @click="dialog?.hide()" />
          </div>
        </div>
      </q-card-section>

      <!-- Filter Builder Content -->
      <q-card-section class="md3-dialog-content">
        <div class="filter-builder-container">
          <!-- Filter Conditions -->
          <div class="filter-conditions-section">
            <div class="section-header">
              <h6 class="section-title">Filter Conditions</h6>
              <q-btn
                flat
                dense
                no-caps
                icon="add"
                label="Add Condition"
                @click="addFilterCondition"
                class="md3-add-btn"
                color="primary"
              />
            </div>

            <div v-if="filterConditions.length === 0" class="empty-filters">
              <q-icon name="filter_list" size="48px" color="grey-4" />
              <div class="empty-title">No filter conditions</div>
              <div class="empty-subtitle">Click "Add Condition" to start building your filter</div>
            </div>

            <div v-else class="filter-conditions-list">
              <div
                v-for="(condition, index) in filterConditions"
                :key="condition.id"
                class="filter-condition-item"
              >
                <!-- Logic Operator (AND/OR) -->
                <div v-if="index > 0" class="logic-operator">
                  <q-select
                    v-model="condition.logic"
                    :options="logicOptions"
                    dense
                    borderless
                    class="logic-select"
                  />
                </div>

                <!-- Filter Condition Card -->
                <q-card flat bordered class="condition-card">
                  <q-card-section class="condition-content">
                    <div class="condition-row">
                      <!-- Field Selection -->
                      <div class="condition-field">
                        <label class="field-label">Field</label>
                        <q-select
                          v-model="condition.field"
                          :options="fieldOptions"
                          option-value="name"
                          option-label="name"
                          emit-value
                          map-options
                          dense
                          outlined
                          @update:model-value="onFieldChange(condition)"
                        >
                          <template v-slot:option="scope">
                            <q-item v-bind="scope.itemProps">
                              <q-item-section avatar>
                                <q-icon :name="getFieldIcon(scope.opt.type)" />
                              </q-item-section>
                              <q-item-section>
                                <q-item-label>{{ scope.opt.name }}</q-item-label>
                                <q-item-label caption>{{ scope.opt.type }}</q-item-label>
                              </q-item-section>
                            </q-item>
                          </template>
                        </q-select>
                      </div>

                      <!-- Operator Selection -->
                      <div class="condition-operator">
                        <label class="field-label">Operator</label>
                        <q-select
                          v-model="condition.operator"
                          :options="getOperatorOptions(condition.fieldType)"
                          option-value="value"
                          option-label="label"
                          emit-value
                          map-options
                          dense
                          outlined
                          :disable="!condition.field"
                        />
                      </div>

                      <!-- Value Input -->
                      <div class="condition-value">
                        <label class="field-label">Value</label>
                        <div class="value-input-container">
                          <!-- String Input -->
                          <q-input
                            v-if="condition.fieldType === 'String'"
                            v-model="condition.value"
                            dense
                            outlined
                            placeholder="Enter text..."
                          />
                          
                          <!-- Number Input -->
                          <q-input
                            v-else-if="condition.fieldType === 'Int' || condition.fieldType === 'Float'"
                            v-model.number="condition.value"
                            type="number"
                            dense
                            outlined
                            placeholder="Enter number..."
                          />
                          
                          <!-- Boolean Select -->
                          <q-select
                            v-else-if="condition.fieldType === 'Boolean'"
                            v-model="condition.value"
                            :options="booleanOptions"
                            dense
                            outlined
                          />
                          
                          <!-- DateTime Input -->
                          <q-input
                            v-else-if="condition.fieldType === 'DateTime'"
                            v-model="condition.value"
                            dense
                            outlined
                          >
                            <template v-slot:append>
                              <q-icon name="event" class="cursor-pointer">
                                <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                                  <q-date v-model="condition.value" mask="YYYY-MM-DD HH:mm:ss">
                                    <div class="row items-center justify-end">
                                      <q-btn v-close-popup label="Close" color="primary" flat />
                                    </div>
                                  </q-date>
                                </q-popup-proxy>
                              </q-icon>
                            </template>
                          </q-input>
                          
                          <!-- Default Input -->
                          <q-input
                            v-else
                            v-model="condition.value"
                            dense
                            outlined
                            placeholder="Enter value..."
                          />
                        </div>
                      </div>

                      <!-- Remove Button -->
                      <div class="condition-actions">
                        <q-btn
                          flat
                          round
                          dense
                          icon="delete"
                          @click="removeFilterCondition(index)"
                          class="remove-condition-btn"
                          color="negative"
                        >
                          <q-tooltip>Remove condition</q-tooltip>
                        </q-btn>
                      </div>
                    </div>
                  </q-card-section>
                </q-card>
              </div>
            </div>
          </div>

          <!-- Filter Preview -->
          <div v-if="filterConditions.length > 0" class="filter-preview-section">
            <h6 class="section-title">Filter Preview</h6>
            <q-card flat bordered class="preview-card">
              <q-card-section>
                <div class="preview-content">
                  <div class="preview-sql">
                    {{ getFilterPreview() }}
                  </div>
                </div>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </q-card-section>

      <!-- Fixed Footer -->
      <q-card-section class="md3-dialog-footer">
        <div class="row items-center justify-between">
          <div class="footer-info">
            <span class="text-body2 text-grey-7">
              {{ filterConditions.length }} condition{{ filterConditions.length !== 1 ? 's' : '' }}
            </span>
          </div>
          <div class="footer-actions">
            <q-btn
              flat
              no-caps
              label="Clear All"
              @click="clearAllConditions"
              class="md3-btn"
              :disable="filterConditions.length === 0"
            />
            <q-btn
              flat
              no-caps
              label="Cancel"
              @click="dialog?.hide()"
              class="md3-btn q-ml-md"
            />
            <q-btn
              unelevated
              no-caps
              label="Apply Filters"
              @click="applyFilters"
              color="primary"
              class="md3-btn q-ml-md"
            />
          </div>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script lang="ts">
import { defineComponent, ref, computed, watch } from 'vue';

interface Field {
  name: string;
  type: string;
  kind: string;
}

interface FilterCondition {
  id: string;
  field: string;
  fieldType: string;
  operator: string;
  value: any;
  logic: 'AND' | 'OR';
}

interface OperatorOption {
  label: string;
  value: string;
}

export default defineComponent({
  name: 'AdvancedFilterDialog',
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
      type: Object,
      default: () => ({}),
    },
  },
  emits: ['update:modelValue', 'apply-filters'],
  setup(props, { emit }) {
    const dialog = ref();
    const filterConditions = ref<FilterCondition[]>([]);

    const dialogOpen = computed({
      get: () => props.modelValue,
      set: (value) => emit('update:modelValue', value),
    });

    const fieldOptions = computed(() => {
      return props.fields.filter(field => field.kind === 'scalar');
    });

    const logicOptions = [
      { label: 'AND', value: 'AND' },
      { label: 'OR', value: 'OR' },
    ];

    const booleanOptions = [
      { label: 'True', value: true },
      { label: 'False', value: false },
    ];

    const stringOperators: OperatorOption[] = [
      { label: 'equals', value: 'eq' },
      { label: 'contains', value: 'contains' },
      { label: 'starts with', value: 'startsWith' },
      { label: 'ends with', value: 'endsWith' },
      { label: 'not equals', value: 'neq' },
    ];

    const numberOperators: OperatorOption[] = [
      { label: 'equals', value: 'eq' },
      { label: 'not equals', value: 'neq' },
      { label: 'greater than', value: 'gt' },
      { label: 'greater than or equal', value: 'gte' },
      { label: 'less than', value: 'lt' },
      { label: 'less than or equal', value: 'lte' },
    ];

    const booleanOperators: OperatorOption[] = [
      { label: 'equals', value: 'eq' },
    ];

    const dateOperators: OperatorOption[] = [
      { label: 'equals', value: 'eq' },
      { label: 'not equals', value: 'neq' },
      { label: 'before', value: 'lt' },
      { label: 'after', value: 'gt' },
      { label: 'on or before', value: 'lte' },
      { label: 'on or after', value: 'gte' },
    ];

    const getOperatorOptions = (fieldType: string): OperatorOption[] => {
      switch (fieldType) {
        case 'String':
          return stringOperators;
        case 'Int':
        case 'Float':
          return numberOperators;
        case 'Boolean':
          return booleanOperators;
        case 'DateTime':
          return dateOperators;
        default:
          return stringOperators;
      }
    };

    const getFieldIcon = (fieldType: string): string => {
      const icons: Record<string, string> = {
        'String': 'text_fields',
        'Int': 'tag',
        'Float': 'tag',
        'Boolean': 'toggle_on',
        'DateTime': 'event',
        'Json': 'data_object',
      };
      return icons[fieldType] || 'label';
    };

    const generateId = (): string => {
      return Math.random().toString(36).substr(2, 9);
    };

    const addFilterCondition = () => {
      const newCondition: FilterCondition = {
        id: generateId(),
        field: '',
        fieldType: '',
        operator: '',
        value: null,
        logic: 'AND',
      };
      filterConditions.value.push(newCondition);
    };

    const removeFilterCondition = (index: number) => {
      filterConditions.value.splice(index, 1);
    };

    const clearAllConditions = () => {
      filterConditions.value = [];
    };

    const onFieldChange = (condition: FilterCondition) => {
      const field = fieldOptions.value.find(f => f.name === condition.field);
      if (field) {
        condition.fieldType = field.type;
        condition.operator = '';
        condition.value = null;
      }
    };

    const getFilterPreview = (): string => {
      if (filterConditions.value.length === 0) return '';
      
      const parts = filterConditions.value.map((condition, index) => {
        const fieldName = condition.field || '[field]';
        const operator = condition.operator || '[operator]';
        const value = condition.value !== null && condition.value !== undefined ? condition.value : '[value]';
        
        const conditionText = `${fieldName} ${operator} ${value}`;
        
        if (index === 0) {
          return conditionText;
        } else {
          return `${condition.logic} ${conditionText}`;
        }
      });
      
      return parts.join(' ');
    };

    const applyFilters = () => {
      const validConditions = filterConditions.value.filter(
        condition => condition.field && condition.operator && (condition.value !== null && condition.value !== undefined && condition.value !== '')
      );
      
      const filtersObject: Record<string, any> = {};
      
      validConditions.forEach(condition => {
        filtersObject[condition.field] = {
          operator: condition.operator,
          value: condition.value,
          logic: condition.logic,
        };
      });
      
      emit('apply-filters', filtersObject);
      dialog.value?.hide();
    };

    // Initialize with existing filters when dialog opens
    watch(() => props.modelValue, (newVal) => {
      if (newVal && Object.keys(props.initialFilters).length > 0) {
        filterConditions.value = Object.entries(props.initialFilters).map(([fieldName, filterConfig]: [string, any]) => ({
          id: generateId(),
          field: fieldName,
          fieldType: props.fields.find(f => f.name === fieldName)?.type || 'String',
          operator: filterConfig.operator || 'eq',
          value: filterConfig.value,
          logic: filterConfig.logic || 'AND',
        }));
      }
    });

    return {
      dialog,
      dialogOpen,
      filterConditions,
      fieldOptions,
      logicOptions,
      booleanOptions,
      getOperatorOptions,
      getFieldIcon,
      addFilterCondition,
      removeFilterCondition,
      clearAllConditions,
      onFieldChange,
      getFilterPreview,
      applyFilters,
    };
  },
});
</script>

<style lang="scss" scoped>
/* Import Material Design 3 dialog styles */
@import '../../../../components/shared/styles/md3-dialog.scss';

/* Filter Builder Specific Styles */
.filter-builder-container {
  max-width: 1000px;
  margin: 0 auto;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.section-title {
  font-size: 16px;
  font-weight: 500;
  color: #1f1f1f;
  margin: 0;
}

.md3-add-btn {
  border-radius: 16px;
  text-transform: none;
  font-weight: 500;
  letter-spacing: 0.1px;
  padding: 6px 16px;
  
  &:hover {
    background-color: rgba(26, 35, 126, 0.04);
  }
}

/* Empty State */
.empty-filters {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  text-align: center;
}

.empty-title {
  font-size: 16px;
  font-weight: 500;
  color: #5f6368;
  margin: 16px 0 8px 0;
}

.empty-subtitle {
  font-size: 14px;
  color: #71757a;
  line-height: 20px;
}

/* Filter Conditions */
.filter-conditions-section {
  margin-bottom: 32px;
}

.filter-conditions-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.filter-condition-item {
  position: relative;
}

.logic-operator {
  display: flex;
  justify-content: center;
  margin-bottom: 8px;
  
  .logic-select {
    width: 80px;
    
    :deep(.q-field__control) {
      background-color: #f5f5f7;
      border-radius: 16px;
      height: 32px;
    }
    
    :deep(.q-field__native) {
      text-align: center;
      font-weight: 500;
      font-size: 12px;
      color: #1f1f1f;
    }
  }
}

.condition-card {
  border: 1px solid #e3e3e3;
  border-radius: 12px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  
  &:hover {
    border-color: #dadce0;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
  }
}

.condition-content {
  padding: 20px;
}

.condition-row {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr auto;
  gap: 16px;
  align-items: end;
}

.field-label {
  display: block;
  font-size: 12px;
  font-weight: 500;
  color: #5f6368;
  margin-bottom: 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.condition-field,
.condition-operator,
.condition-value {
  display: flex;
  flex-direction: column;
}

.value-input-container {
  width: 100%;
}

.condition-actions {
  display: flex;
  align-items: center;
}

.remove-condition-btn {
  color: #ea4335;
  
  &:hover {
    background-color: rgba(234, 67, 53, 0.04);
  }
}

/* Filter Preview */
.filter-preview-section {
  margin-bottom: 24px;
}

.preview-card {
  border: 1px solid #e3e3e3;
  border-radius: 12px;
}

.preview-content {
  padding: 4px 0;
}

.preview-sql {
  font-family: 'Roboto Mono', monospace;
  font-size: 14px;
  color: #1f1f1f;
  background-color: #f8f9fa;
  padding: 12px 16px;
  border-radius: 8px;
  border: 1px solid #e8eaed;
  white-space: pre-wrap;
  word-break: break-word;
}

/* Footer */
.md3-dialog-footer {
  background-color: #ffffff;
  border-top: 1px solid #e3e3e3;
  padding: 16px 24px;
  flex-shrink: 0;
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

/* Responsive */
@media (max-width: 768px) {
  .condition-row {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  
  .condition-actions {
    justify-content: center;
    margin-top: 8px;
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