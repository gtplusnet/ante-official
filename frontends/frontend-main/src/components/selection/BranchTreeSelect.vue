<template>
  <q-select
    v-model="selectedBranch"
    :options="filteredOptions"
    :label="label"
    :placeholder="placeholder"
    :dense="dense"
    :outlined="outlined"
    :disable="disable"
    :readonly="readonly"
    :loading="loading"
    emit-value
    map-options
    use-input
    input-debounce="300"
    @filter="filterOptions"
    @update:model-value="handleSelectionChange"
    class="branch-tree-select"
  >
    <template v-slot:option="scope">
      <q-item v-bind="scope.itemProps">
        <q-item-section>
          <q-item-label :style="{ paddingLeft: `${scope.opt.depth * 24}px` }">
            <div class="branch-option">
              <q-icon 
                v-if="scope.opt.hasChildren" 
                name="account_tree" 
                size="18px" 
                color="primary" 
                class="q-mr-sm"
              />
              <q-icon 
                v-else-if="scope.opt.depth > 0" 
                name="subdirectory_arrow_right" 
                size="18px" 
                color="grey-6" 
                class="q-mr-sm"
              />
              <span class="branch-label">{{ scope.opt.label }}</span>
              <q-chip 
                v-if="scope.opt.childCount > 0" 
                size="sm" 
                color="blue-1" 
                text-color="primary"
                dense
                class="q-ml-sm"
              >
                {{ scope.opt.childCount }}
              </q-chip>
            </div>
          </q-item-label>
        </q-item-section>
      </q-item>
    </template>

    <template v-slot:selected-item="scope">
      <span class="selected-branch-text">
        <q-icon 
          v-if="scope.opt.hasChildren" 
          name="account_tree" 
          size="14px" 
          color="primary" 
          class="q-mr-xs"
          style="vertical-align: middle;"
        />
        {{ scope.opt.label }}
        <span 
          v-if="includeChildren && scope.opt.childCount > 0" 
          class="child-count"
        >
          (+{{ scope.opt.childCount }})
        </span>
      </span>
    </template>

    <template v-slot:no-option>
      <q-item>
        <q-item-section class="text-grey">
          No branches found
        </q-item-section>
      </q-item>
    </template>
  </q-select>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, computed, watch } from 'vue';
import { api } from 'src/boot/axios';

interface BranchOption {
  key: number | string;
  label: string;
  value: number | string;
  depth: number;
  hasChildren: boolean;
  childCount: number;
  parentId?: number | string;
}

export default defineComponent({
  name: 'BranchTreeSelect',
  props: {
    modelValue: {
      type: Array,
      default: () => [],
    },
    label: {
      type: String,
      default: 'Select Branch',
    },
    placeholder: {
      type: String,
      default: 'Select a branch',
    },
    dense: {
      type: Boolean,
      default: false,
    },
    outlined: {
      type: Boolean,
      default: true,
    },
    disable: {
      type: Boolean,
      default: false,
    },
    readonly: {
      type: Boolean,
      default: false,
    },
    includeChildren: {
      type: Boolean,
      default: true,
    },
    showAllOption: {
      type: Boolean,
      default: true,
    },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const loading = ref(false);
    const options = ref<BranchOption[]>([]);
    const selectedBranch = ref<number | string | null>(null);
    const filterText = ref('');

    // Load branches from API
    const loadBranches = async () => {
      loading.value = true;
      try {
        const response = await api.get('/select-box/branch-tree');
        if (response.data && response.data.list) {
          options.value = response.data.list.map((item: any) => ({
            ...item,
            value: item.key,
          }));
        }
      } catch (error) {
        console.error('Error loading branches:', error);
        options.value = [];
      } finally {
        loading.value = false;
      }
    };

    // Get all child IDs for a branch
    const getChildIds = (branchId: number | string): (number | string)[] => {
      const children: (number | string)[] = [];
      const branch = options.value.find(b => b.key === branchId);
      
      if (!branch || !branch.hasChildren) {
        return children;
      }

      // Find all branches that have this as parent
      const findChildren = (parentId: number | string) => {
        options.value.forEach(opt => {
          if (opt.parentId === parentId) {
            children.push(opt.key);
            if (opt.hasChildren) {
              findChildren(opt.key);
            }
          }
        });
      };

      findChildren(branchId);
      return children;
    };

    // Handle selection change
    const handleSelectionChange = (value: any) => {
      selectedBranch.value = value;
      
      if (value === null) {
        emit('update:modelValue', []);
        return;
      }

      if (value === 'all') {
        // Return all branch IDs when "All Branches" is selected
        const allBranchIds = options.value
          .filter(opt => opt.key !== 'all')
          .map(opt => opt.key);
        emit('update:modelValue', allBranchIds);
        return;
      }

      // Always return an array of IDs
      const branchIds: (number | string)[] = [value];
      
      // If including children, add all child IDs
      if (props.includeChildren) {
        branchIds.push(...getChildIds(value));
      }

      // Remove duplicates and emit
      const uniqueBranchIds = [...new Set(branchIds)];
      emit('update:modelValue', uniqueBranchIds);
    };

    // Filter options based on search text
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const filterOptions = (val: string, update: (callbackFn: () => void, afterFn?: (ref: any) => void) => void, _abort: () => void) => {
      filterText.value = val;
      update(() => {
        // Callback function is required, even if empty
      });
    };

    // Computed filtered options
    const filteredOptions = computed(() => {
      if (!filterText.value) {
        return options.value;
      }

      const needle = filterText.value.toLowerCase();
      return options.value.filter(opt => 
        opt.label.toLowerCase().indexOf(needle) > -1
      );
    });

    // Watch for external model value changes
    watch(() => props.modelValue, (newVal) => {
      const branchIds = newVal as (number | string)[];
      // If modelValue is an empty array, clear selection
      if (!branchIds || branchIds.length === 0) {
        selectedBranch.value = null;
      } else if (branchIds.length === options.value.length - 1) {
        // If all branches are selected, set to 'all'
        selectedBranch.value = 'all';
      } else {
        // Otherwise, find the primary branch (the one without parent in the selection)
        const primaryBranch = branchIds.find(id => {
          const branch = options.value.find(opt => opt.key === id);
          return branch && (!branch.parentId || !branchIds.includes(branch.parentId));
        });
        selectedBranch.value = primaryBranch || branchIds[0];
      }
    });

    // Watch for options loading - fixes race condition when modelValue is set before options load
    watch(() => options.value.length, (newLength, oldLength) => {
      // Only trigger when options just finished loading (transition from 0 to N)
      if (oldLength === 0 && newLength > 0) {
        const branchIds = props.modelValue as (number | string)[];
        // If there's a modelValue but no selectedBranch set, process it now
        if (branchIds && branchIds.length > 0 && !selectedBranch.value) {
          if (branchIds.length === options.value.length - 1) {
            selectedBranch.value = 'all';
          } else {
            const primaryBranch = branchIds.find(id => {
              const branch = options.value.find(opt => opt.key === id);
              return branch && (!branch.parentId || !branchIds.includes(branch.parentId));
            });
            selectedBranch.value = primaryBranch || branchIds[0];
          }
        }
      }
    });

    onMounted(() => {
      loadBranches();
    });

    return {
      loading,
      options,
      selectedBranch,
      filterText,
      filteredOptions,
      filterOptions,
      handleSelectionChange,
    };
  },
});
</script>

<style lang="scss" scoped>
.branch-tree-select {
  width: 100%;
}

.branch-option {
  display: flex;
  align-items: center;
}

.branch-label {
  flex: 1;
}

.selected-branch-text {
  display: inline-block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  width: 100%;
  font-size: 13px;
}

.child-count {
  color: #666;
  font-size: 11px;
  font-weight: 500;
}

:deep(.q-chip) {
  height: 18px;
  font-size: 11px;
  padding: 0 6px;
  
  .q-chip__content {
    padding: 0;
  }
}
</style>