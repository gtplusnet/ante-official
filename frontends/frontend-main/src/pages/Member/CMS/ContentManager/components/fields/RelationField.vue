<template>
  <div class="relation-field">
    <!-- Single Relation -->
    <div v-if="!field.multiple" class="single-relation">
      <q-select
        :model-value="modelValue"
        @update:model-value="updateValue"
        :options="relationOptions"
        :option-label="getOptionLabel"
        :option-value="getOptionValue"
        :placeholder="`Select ${field.displayName || field.name}`"
        :error="!!error"
        :error-message="error"
        :loading="loading"
        :required="field.required"
        :readonly="field.readonly"
        :disable="field.disabled"
        outlined
        dense
        clearable
        use-input
        emit-value
        map-options
        @filter="filterOptions"
        @popup-show="loadRelationData"
      >
        <template v-slot:option="scope">
          <q-item v-bind="scope.itemProps">
            <q-item-section>
              <q-item-label>{{ getOptionLabel(scope.opt) }}</q-item-label>
              <q-item-label caption v-if="getOptionDescription(scope.opt)">
                {{ getOptionDescription(scope.opt) }}
              </q-item-label>
            </q-item-section>
          </q-item>
        </template>
        
        <template v-slot:no-option>
          <q-item>
            <q-item-section class="text-grey">
              No {{ field.target || 'related' }} entries found
            </q-item-section>
          </q-item>
        </template>
      </q-select>
      
      <!-- Quick Create Button -->
      <q-btn
        v-if="field.allowCreate"
        flat
        icon="add"
        size="sm"
        class="q-mt-xs"
        @click="openCreateDialog"
      >
        Create new {{ field.target || 'item' }}
      </q-btn>
    </div>

    <!-- Multiple Relations -->
    <div v-else class="multiple-relations">
      <!-- Selected Items -->
      <div v-if="selectedItems.length > 0" class="selected-items q-mb-sm">
        <div class="selected-items-label text-caption text-grey-6 q-mb-xs">
          Selected ({{ selectedItems.length }})
        </div>
        <div class="selected-chips">
          <q-chip
            v-for="item in selectedItems"
            :key="getItemId(item)"
            removable
            color="primary"
            text-color="white"
            @remove="removeItem(item)"
          >
            {{ getItemLabel(item) }}
          </q-chip>
        </div>
      </div>
      
      <!-- Add New Selection -->
      <q-select
        :model-value="null"
        @update:model-value="addItem"
        :options="availableOptions"
        :option-label="getOptionLabel"
        :option-value="getOptionValue"
        :placeholder="`Add ${field.displayName || field.name}`"
        :loading="loading"
        outlined
        dense
        clearable
        use-input
        emit-value
        map-options
        @filter="filterOptions"
        @popup-show="loadRelationData"
      >
        <template v-slot:option="scope">
          <q-item v-bind="scope.itemProps">
            <q-item-section>
              <q-item-label>{{ getOptionLabel(scope.opt) }}</q-item-label>
              <q-item-label caption v-if="getOptionDescription(scope.opt)">
                {{ getOptionDescription(scope.opt) }}
              </q-item-label>
            </q-item-section>
          </q-item>
        </template>
      </q-select>
    </div>

    <!-- Create Dialog -->
    <q-dialog v-model="showCreateDialog">
      <q-card style="min-width: 400px">
        <q-card-section>
          <div class="text-h6">Create New {{ field.target || 'Item' }}</div>
        </q-card-section>

        <q-separator />

        <q-card-section>
          <!-- Simple form for quick creation -->
          <q-input
            v-model="newItemData.title"
            label="Title"
            outlined
            dense
            autofocus
          />
          
          <q-input
            v-if="hasDescriptionField"
            v-model="newItemData.description"
            label="Description"
            type="textarea"
            outlined
            dense
            class="q-mt-sm"
            :rows="3"
          />
        </q-card-section>

        <q-separator />

        <q-card-actions align="right">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn
            color="primary"
            label="Create"
            :loading="creating"
            @click="createNewItem"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, watch, PropType } from 'vue';
import type { Field } from '@components/shared/cms/types/content-type';

interface RelationItem {
  id: string;
  title?: string;
  name?: string;
  displayName?: string;
  description?: string;
  [key: string]: any;
}

export default defineComponent({
  name: 'RelationField',
  props: {
    modelValue: {
      type: [Object, Array, String, null] as PropType<RelationItem | RelationItem[] | string | string[] | null>,
      default: null
    },
    field: {
      type: Object as PropType<Field>,
      required: true
    },
    error: {
      type: String,
      default: ''
    }
  },
  emits: ['update:modelValue', 'validate'],
  setup(props, { emit }) {
    const loading = ref(false);
    const creating = ref(false);
    const relationOptions = ref<RelationItem[]>([]);
    const filteredOptions = ref<RelationItem[]>([]);
    const showCreateDialog = ref(false);
    const newItemData = ref({
      title: '',
      description: ''
    });
    
    const selectedItems = computed(() => {
      if (!props.field.multiple) return [];
      if (Array.isArray(props.modelValue)) {
        return props.modelValue as RelationItem[];
      }
      return [];
    });
    
    const availableOptions = computed(() => {
      if (!props.field.multiple) return filteredOptions.value;
      
      const selectedIds = selectedItems.value.map(item => getItemId(item));
      return filteredOptions.value.filter(option => 
        !selectedIds.includes(getItemId(option))
      );
    });
    
    const hasDescriptionField = computed(() => {
      // Check if the target content type likely has a description field
      return true; // For now, assume all relations can have descriptions
    });
    
    // Watch for field changes to reload data
    watch(() => props.field.target, () => {
      loadRelationData();
    }, { immediate: true });
    
    const getItemId = (item: RelationItem | string): string => {
      if (typeof item === 'string') return item;
      return item.id;
    };
    
    const getItemLabel = (item: RelationItem | string): string => {
      if (typeof item === 'string') {
        // Find the full item data
        const fullItem = relationOptions.value.find(opt => opt.id === item);
        return fullItem ? getOptionLabel(fullItem) : item;
      }
      return getOptionLabel(item);
    };
    
    const getOptionLabel = (option: RelationItem): string => {
      return option.title || option.displayName || option.name || option.id;
    };
    
    const getOptionValue = (option: RelationItem): string => {
      return option.id;
    };
    
    const getOptionDescription = (option: RelationItem): string => {
      return option.description || '';
    };
    
    const loadRelationData = async () => {
      if (!props.field.target) return;
      
      loading.value = true;
      try {
        // TODO: Replace with actual API call
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Mock data for demonstration
        const mockData: RelationItem[] = [
          { 
            id: '1', 
            title: 'Sample Article 1', 
            description: 'This is a sample article for testing' 
          },
          { 
            id: '2', 
            title: 'Sample Article 2', 
            description: 'Another sample article' 
          },
          { 
            id: '3', 
            title: 'Sample Article 3', 
            description: 'Yet another sample article' 
          }
        ];
        
        relationOptions.value = mockData;
        filteredOptions.value = mockData;
        
      } catch (error) {
        console.error('Failed to load relation data:', error);
        relationOptions.value = [];
        filteredOptions.value = [];
      } finally {
        loading.value = false;
      }
    };
    
    const filterOptions = (val: string, update: (callback: () => void) => void) => {
      update(() => {
        if (val === '') {
          filteredOptions.value = relationOptions.value;
        } else {
          const needle = val.toLowerCase();
          filteredOptions.value = relationOptions.value.filter(option => {
            const label = getOptionLabel(option).toLowerCase();
            const description = getOptionDescription(option).toLowerCase();
            return label.includes(needle) || description.includes(needle);
          });
        }
      });
    };
    
    const updateValue = (value: string | null) => {
      emit('update:modelValue', value);
      validateField();
    };
    
    const addItem = (value: string | null) => {
      if (!value) return;
      
      const currentItems = Array.isArray(props.modelValue) ? props.modelValue : [];
      const newItems = [...currentItems, value];
      emit('update:modelValue', newItems);
      validateField();
    };
    
    const removeItem = (item: RelationItem | string) => {
      const itemId = getItemId(item);
      const currentItems = Array.isArray(props.modelValue) ? props.modelValue : [];
      const newItems = currentItems.filter(existing => getItemId(existing) !== itemId);
      emit('update:modelValue', newItems);
      validateField();
    };
    
    const validateField = () => {
      let isValid = true;
      
      if (props.field.required) {
        if (props.field.multiple) {
          isValid = Array.isArray(props.modelValue) && props.modelValue.length > 0;
        } else {
          isValid = !!props.modelValue;
        }
      }
      
      emit('validate', isValid);
    };
    
    const openCreateDialog = () => {
      newItemData.value = {
        title: '',
        description: ''
      };
      showCreateDialog.value = true;
    };
    
    const createNewItem = async () => {
      if (!newItemData.value.title) return;
      
      creating.value = true;
      try {
        // TODO: Replace with actual API call to create new item
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Create mock item
        const newItem: RelationItem = {
          id: Date.now().toString(),
          title: newItemData.value.title,
          description: newItemData.value.description
        };
        
        // Add to options
        relationOptions.value.push(newItem);
        filteredOptions.value.push(newItem);
        
        // Select the new item
        if (props.field.multiple) {
          addItem(newItem.id);
        } else {
          updateValue(newItem.id);
        }
        
        showCreateDialog.value = false;
        
      } catch (error) {
        console.error('Failed to create new item:', error);
      } finally {
        creating.value = false;
      }
    };
    
    return {
      loading,
      creating,
      relationOptions,
      showCreateDialog,
      newItemData,
      selectedItems,
      availableOptions,
      hasDescriptionField,
      getItemId,
      getItemLabel,
      getOptionLabel,
      getOptionValue,
      getOptionDescription,
      loadRelationData,
      filterOptions,
      updateValue,
      addItem,
      removeItem,
      openCreateDialog,
      createNewItem
    };
  }
});
</script>

<style scoped lang="scss">
.relation-field {
  .selected-items {
    .selected-items-label {
      font-weight: 500;
    }
    
    .selected-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
    }
  }
  
  .multiple-relations {
    .q-select {
      margin-top: 8px;
    }
  }
}
</style>