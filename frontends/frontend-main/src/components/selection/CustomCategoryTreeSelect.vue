<template>
  <div
    class="custom-category-select"
    :class="{
      'is-focused': isFocused,
      'is-disabled': disable,
      [`variant-${variant}`]: true,
      'is-dense': dense,
      'is-outlined': outlined
    }"
    tabindex="0"
    @focus="isFocused = true"
    @blur="handleBlur"
  >
    <!-- Category icon for standalone and md3-filter variants -->
    <q-icon
      v-if="(showIcon && variant === 'standalone') || variant === 'md3-filter'"
      name="category"
      class="variant-icon"
    />

    <!-- Wrapper for select and add button (when showAddButton is true) -->
    <div v-if="showAddButton" class="category-select-wrapper">
      <div
        class="select-container"
        @click="toggleDropdown"
      >
        <div class="select-label" v-if="label && !selectedCategory">{{ label }}</div>
        <div class="select-value" v-if="selectedCategory && selectedOption">
          <q-icon
            v-if="selectedOption.hasChildren"
            name="account_tree"
            size="14px"
            color="primary"
            class="category-icon"
          />
          <span class="category-name">{{ selectedOption.label }}</span>
          <span
            v-if="includeChildren && selectedOption.childCount && selectedOption.childCount > 0"
            class="child-count"
          >
            (+{{ selectedOption.childCount }})
          </span>
        </div>
        <div class="select-placeholder" v-else-if="!label">{{ placeholder }}</div>
        <q-icon
          name="arrow_drop_down"
          size="20px"
          class="dropdown-icon"
          :class="{ 'rotate': showDropdown }"
        />
      </div>
      <q-btn
        @click.stop="showAddDialog"
        class="add-button"
        color="dark"
        outline
        style="border-width: 0.5px !important;"
      >
        <q-icon size="16px" name="add"></q-icon>
      </q-btn>
    </div>

    <!-- Select container without add button -->
    <div
      v-else
      class="select-container"
      @click="toggleDropdown"
    >
      <div class="select-label" v-if="label && !selectedCategory">{{ label }}</div>
      <div class="select-value" v-if="selectedCategory && selectedOption">
        <q-icon
          v-if="selectedOption.hasChildren"
          name="account_tree"
          size="14px"
          color="primary"
          class="category-icon"
        />
        <span class="category-name">{{ selectedOption.label }}</span>
        <span
          v-if="includeChildren && selectedOption.childCount && selectedOption.childCount > 0"
          class="child-count"
        >
          (+{{ selectedOption.childCount }})
        </span>
      </div>
      <div class="select-placeholder" v-else-if="!label">{{ placeholder }}</div>
      <q-icon
        name="arrow_drop_down"
        size="20px"
        class="dropdown-icon"
        :class="{ 'rotate': showDropdown }"
      />
    </div>

    <teleport to="body">
      <div
        v-show="showDropdown"
        class="dropdown-menu"
        :style="dropdownStyle"
      >
        <div class="search-box" v-if="options.length > 10">
          <q-input
            v-model="searchText"
            placeholder="Search categories..."
            dense
            outlined
            @click.stop
            class="search-input"
          >
            <template v-slot:prepend>
              <q-icon name="search" />
            </template>
          </q-input>
        </div>

        <div class="options-container">
          <div
            v-if="showAllOption"
            class="option-item"
            :class="{ 'is-selected': selectedCategory === 'all' }"
            @click="selectOption('all')"
          >
            <q-icon name="select_all" size="18px" color="primary" class="q-mr-sm" />
            <span class="option-label">All Categories</span>
          </div>

          <div
            v-for="option in filteredOptions"
            :key="option.key"
            class="option-item"
            :class="{ 'is-selected': selectedCategory === option.key }"
            :style="{ paddingLeft: `${option.depth * 24 + 12}px` }"
            @click="selectOption(option.key)"
          >
            <q-icon
              v-if="option.hasChildren"
              name="account_tree"
              size="18px"
              color="primary"
              class="q-mr-sm"
            />
            <q-icon
              v-else-if="option.depth > 0"
              name="subdirectory_arrow_right"
              size="18px"
              color="grey-6"
              class="q-mr-sm"
            />
            <span class="option-label">{{ option.label }}</span>
            <q-chip
              v-if="option.childCount > 0"
              size="sm"
              color="blue-1"
              text-color="primary"
              dense
              class="q-ml-auto"
            >
              {{ option.childCount }}
            </q-chip>
          </div>

          <div v-if="filteredOptions.length === 0" class="no-options">
            No categories found
          </div>
        </div>
      </div>
    </teleport>

    <q-linear-progress v-if="loading" indeterminate color="primary" class="loading-bar" />

    <!-- Add Category Dialog -->
    <AssetAddEditItemCategoryDialog
      v-if="showAddButton"
      v-model="showCategoryDialog"
      @saveDone="handleCategorySaved"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, defineAsyncComponent, ref, onMounted, onUnmounted, computed, watch, getCurrentInstance } from 'vue';
import type { ComponentInternalInstance, PropType } from 'vue';

const AssetAddEditItemCategoryDialog = defineAsyncComponent(() =>
  import('../../pages/Member/Asset/dialogs/AssetAddEditItemCategoryDialog.vue')
);

interface CategoryOption {
  key: number | string;
  label: string;
  value: number | string;
  depth: number;
  hasChildren: boolean;
  childCount: number;
  parentId?: number | string;
}

export default defineComponent({
  name: 'CustomCategoryTreeSelect',
  components: {
    AssetAddEditItemCategoryDialog,
  },
  props: {
    modelValue: {
      type: Array,
      default: () => [],
    },
    label: {
      type: String,
      default: '',
    },
    placeholder: {
      type: String,
      default: 'Select a category',
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
    variant: {
      type: String as PropType<'default' | 'md3-filter' | 'standalone'>,
      default: 'default',
      validator: (value: string) => ['default', 'md3-filter', 'standalone'].includes(value),
    },
    showIcon: {
      type: Boolean,
      default: false,
    },
    dense: {
      type: Boolean,
      default: false,
    },
    outlined: {
      type: Boolean,
      default: false,
    },
    showAddButton: {
      type: Boolean,
      default: false,
    },
    addButtonTooltip: {
      type: String,
      default: 'Add Category',
    },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const loading = ref(false);
    const options = ref<CategoryOption[]>([]);
    const selectedCategory = ref<number | string | null>(null);
    const searchText = ref('');
    const showDropdown = ref(false);
    const isFocused = ref(false);
    const dropdownPosition = ref({ top: 0, left: 0, width: 0 });
    const showCategoryDialog = ref(false);

    // Get the $api instance
    const instance = getCurrentInstance() as ComponentInternalInstance;
    const $api = instance?.proxy?.$api;

    // Load categories from API
    const loadCategories = async () => {
      if (!$api) {
        console.error('API instance not available');
        return;
      }

      loading.value = true;
      try {
        const response = await $api.get('/select-box/category-tree');

        if (response.data && response.data.list) {
          // Check if "All Categories" is already in the list from backend
          const hasAllOption = response.data.list.some((item: any) => item.key === 'all');

          options.value = response.data.list.map((item: any) => ({
            ...item,
            value: item.key,
          }));


          // Only add "All Categories" if not already present and enabled
          if (props.showAllOption && !hasAllOption) {
            options.value.unshift({
              key: 'all',
              label: 'All Categories',
              value: 'all',
              depth: 0,
              hasChildren: false,
              childCount: options.value.length,
            });
          }
        }
      } catch (error) {
        console.error('Error loading categories:', error);
        options.value = [];
      } finally {
        loading.value = false;
      }
    };

    // Get all child IDs for a category
    const getChildIds = (categoryId: number | string): (number | string)[] => {
      const children: (number | string)[] = [];
      const category = options.value.find(c => c.key === categoryId);

      if (!category || !category.hasChildren) {
        return children;
      }

      // Find all categories that have this as parent
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

      findChildren(categoryId);
      return children;
    };

    // Calculate dropdown position
    const updateDropdownPosition = () => {
      const element = instance?.vnode.el as HTMLElement;
      if (element) {
        const rect = element.getBoundingClientRect();
        dropdownPosition.value = {
          top: rect.bottom + window.scrollY,
          left: rect.left + window.scrollX,
          width: rect.width,
        };
      }
    };

    // Toggle dropdown
    const toggleDropdown = () => {
      if (props.disable || props.readonly) return;

      if (!showDropdown.value) {
        updateDropdownPosition();
      }

      showDropdown.value = !showDropdown.value;
    };

    // Select an option
    const selectOption = (value: number | string) => {
      selectedCategory.value = value;
      showDropdown.value = false;

      if (value === 'all') {
        // Return empty array when "All Categories" is selected (no filtering needed)
        emit('update:modelValue', []);
        return;
      }

      // Always return an array of IDs
      const categoryIds: (number | string)[] = [value];

      // If including children, add all child IDs
      if (props.includeChildren) {
        categoryIds.push(...getChildIds(value));
      }

      // Remove duplicates and emit
      const uniqueCategoryIds = [...new Set(categoryIds)];
      emit('update:modelValue', uniqueCategoryIds);
    };

    // Computed filtered options
    const filteredOptions = computed(() => {
      if (!searchText.value) {
        return options.value.filter(opt => opt.key !== 'all');
      }

      const needle = searchText.value.toLowerCase();
      return options.value.filter(opt =>
        opt.key !== 'all' && opt.label.toLowerCase().indexOf(needle) > -1
      );
    });

    // Get selected option details
    const selectedOption = computed(() => {
      return options.value.find(opt => opt.key === selectedCategory.value);
    });

    // Computed dropdown style
    const dropdownStyle = computed(() => ({
      top: `${dropdownPosition.value.top}px`,
      left: `${dropdownPosition.value.left}px`,
      width: `${dropdownPosition.value.width}px`,
    }));

    // Handle blur to close dropdown
    const handleBlur = (e: FocusEvent) => {
      // Delay to allow click events to fire first
      setTimeout(() => {
        isFocused.value = false;
        if (!e.relatedTarget || !(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)) {
          showDropdown.value = false;
        }
      }, 200);
    };

    // Watch for external model value changes
    watch(() => props.modelValue, (newVal) => {
      const categoryIds = newVal as (number | string)[];
      // If modelValue is null/undefined or empty array from "All Categories" selection
      if (!categoryIds) {
        selectedCategory.value = null;
      } else if (categoryIds.length === 0) {
        // If empty array, set to 'all' (means no filtering - "All Categories" selected)
        selectedCategory.value = 'all';
      } else {
        // Otherwise, find the primary category (the one without parent in the selection)
        const primaryCategory = categoryIds.find(id => {
          const category = options.value.find(opt => opt.key === id);
          return category && (!category.parentId || !categoryIds.includes(category.parentId));
        });
        selectedCategory.value = primaryCategory || categoryIds[0];
      }
    });

    // Close dropdown when clicking outside
    const handleClickOutside = (e: MouseEvent) => {
      if (!showDropdown.value) return;

      const target = e.target as HTMLElement;
      const element = instance?.vnode.el as HTMLElement;

      if (element && !element.contains(target)) {
        showDropdown.value = false;
      }
    };

    onMounted(async () => {
      // Small delay to ensure $api is available
      await new Promise(resolve => setTimeout(resolve, 100));
      await loadCategories();

      // Set default to "All Categories" if no initial value
      if (!props.modelValue || props.modelValue.length === 0) {
        selectedCategory.value = 'all';
        emit('update:modelValue', []);
      }

      document.addEventListener('click', handleClickOutside);
    });

    onUnmounted(() => {
      document.removeEventListener('click', handleClickOutside);
    });

    // Public method for reloading categories and selecting a specific one
    const reloadAndSelect = async (categoryId: number | string) => {
      await loadCategories();
      if (categoryId) {
        selectOption(categoryId);
      }
    };

    // Show add category dialog
    const showAddDialog = () => {
      showCategoryDialog.value = true;
    };

    // Handle when a new category is saved
    const handleCategorySaved = async (data: any) => {
      if (data && data.id) {
        await reloadAndSelect(data.id);
      }
    };

    return {
      loading,
      options,
      selectedCategory,
      searchText,
      showDropdown,
      isFocused,
      filteredOptions,
      selectedOption,
      dropdownStyle,
      toggleDropdown,
      selectOption,
      handleBlur,
      reloadAndSelect,
      showCategoryDialog,
      showAddDialog,
      handleCategorySaved,
    };
  },
});
</script>

<style lang="scss" scoped>
.custom-category-select {
  position: relative;
  width: 100%;
  outline: none;

  &.is-disabled {
    opacity: 0.6;
    pointer-events: none;
    cursor: not-allowed;
  }
}

.category-select-wrapper {
  display: grid;
  grid-gap: 10px;
  grid-template-columns: 1fr auto;

  .add-button {
    width: 40px;
    min-height: 40px;
  }
}

.select-container {
  position: relative;
  background: #f5f5f5;
  border-radius: 4px;
  padding: 8px 36px 8px 24px;
  min-height: 40px;
  display: flex;
  align-items: center;
  transition: all 0.2s ease;
  cursor: pointer;

  .custom-category-select:hover:not(.is-disabled) & {
    background: #ebebeb;
  }

  .custom-category-select.is-focused & {
    background: #e8e8e8;
  }
}

.select-label {
  position: absolute;
  top: -8px;
  left: 12px;
  background: white;
  padding: 0 4px;
  font-size: 12px;
  color: #666;
}

.select-value {
  display: flex;
  align-items: center;
  font-size: 13px;
  color: #333;
  width: 100%;
  overflow: hidden;
  gap: 4px;

  .category-icon {
    flex-shrink: 0;
    margin-right: 4px;
  }

  .category-name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .child-count {
    color: #666;
    font-size: 11px;
    font-weight: 500;
    margin-left: 4px;
    flex-shrink: 0;
  }
}

.select-placeholder {
  color: #999;
  font-size: 13px;
}

.dropdown-icon {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  transition: transform 0.2s ease;
  color: #666;

  &.rotate {
    transform: translateY(-50%) rotate(180deg);
  }
}

.dropdown-menu {
  position: fixed;
  margin-top: 4px;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  max-height: 300px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  z-index: 9999;
}

.search-box {
  padding: 8px;
  border-bottom: 1px solid #e0e0e0;

  .search-input {
    :deep(.q-field__control) {
      height: 32px;
    }
  }
}

.options-container {
  flex: 1;
  overflow-y: auto;
  max-height: 250px;
}

.option-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  cursor: pointer;
  transition: background 0.2s ease;

  &:hover {
    background: #f5f5f5;
  }

  &.is-selected {
    background: #e3f2fd;
    color: #1976d2;
    font-weight: 500;
  }

  .option-label {
    flex: 1;
  }

  :deep(.q-chip) {
    height: 18px;
    font-size: 11px;
    padding: 0 6px;

    .q-chip__content {
      padding: 0;
    }
  }
}

.no-options {
  padding: 16px;
  text-align: center;
  color: #999;
  font-size: 13px;
}

.loading-bar {
  position: absolute;
  bottom: -2px;
  left: 0;
  right: 0;
  height: 2px;
}

// Dropdown animation
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

// Scrollbar styling
.options-container {
  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: #f5f5f5;
  }

  &::-webkit-scrollbar-thumb {
    background: #ccc;
    border-radius: 3px;

    &:hover {
      background: #999;
    }
  }
}

// Variant-specific styles
.custom-category-select {
  // Standalone variant - has its own icon and more spacing
  &.variant-standalone {
    display: flex;
    align-items: center;
    gap: 8px;

    .variant-icon {
      color: #666;
      font-size: 20px;
    }

    .select-container {
      flex: 1;
    }
  }

  // MD3 filter variant - self-contained with icon and full styling
  &.variant-md3-filter {
    position: relative;
    background-color: #f5f5f7;
    border-radius: 22px;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    height: 40px;
    display: flex;
    align-items: center;
    padding: 0 16px;

    &:hover:not(.is-disabled) {
      background-color: #ebebed;
    }

    &.is-focused {
      background-color: #e8e8ea;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
    }

    .variant-icon {
      position: absolute;
      left: 16px;
      top: 50%;
      transform: translateY(-50%);
      color: #5f6368;
      font-size: 18px;
      z-index: 1;
    }

    .select-container {
      background: transparent;
      border: none;
      padding: 0 24px 0 32px; // Left padding for icon
      border-radius: 0;
      min-height: auto;
      width: 100%;

      &:hover {
        background: transparent; // No additional hover, parent handles it
      }
    }

    &.is-focused .select-container {
      background: transparent; // No additional focus styling
    }
  }

  // Dense variant
  &.is-dense {
    .select-container {
      min-height: 32px;
      padding: 4px 32px 4px 12px;
    }

    .select-value,
    .select-placeholder {
      font-size: 12px;
    }
  }

  // Outlined variant
  &.is-outlined {
    .select-container {
      background: transparent;
      border: 1px solid #e0e0e0;

      &:hover {
        border-color: #ccc;
      }
    }

    &.is-focused .select-container {
      border-color: #1976d2;
      background: transparent;
    }
  }
}
</style>
