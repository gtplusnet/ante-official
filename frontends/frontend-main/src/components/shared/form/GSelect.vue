<template>
  <q-select
    :borderless="borderless"
    maxlength="20"
    class="q-select"
    emit-value
    map-options
    @filter="filterFn"
    :loading="isLoading"
    v-model="selected"
    :outlined="!borderless"
    :options="filteredOptions"
    dense
    :readonly="readonly"
    :data-testid="$attrs['data-testid']"
  />
</template>

<style lang="scss" scoped></style>

<script>
import { api } from 'src/boot/axios';
import { openDB } from 'idb';

export default {
  props: {
    borderless: {
      type: Boolean,
      default: false,
    },
    apiUrl: {
      type: String,
      default: '',
    },
    options: {
      type: Array,
      default: () => [],
    },
    nullOption: {
      type: String,
      default: null,
    },
    storeCache: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      noData: 'No Data',
      isLoading: true,
      selected: null,
      optionsPreservedData: [],
      optionsList: [],
      filteredOptions: [],
      autoSelect: null,
      error: null,
    };
  },
  watch: {
    modelValue: {
      handler(newValue) {
        this.selected = newValue;
      },
    },
    apiUrl: {
      immediate: true,
      handler() {
        if (!this.options || this.options.length === 0) {
          this.selected = null;
          this.label = null;
          this.optionsPreservedData = [];
          this.fetchOptions();
        }
      },
    },
    options: {
      handler(newOptions) {
        if (newOptions && newOptions.length > 0) {
          this.processOptionsList(newOptions);
          this.isLoading = false;
        }
      },
      deep: true,
    },
  },
  mounted() {
    if (this.options && this.options.length > 0) {
      this.processOptionsList(this.options);
      this.isLoading = false;
    } else {
      this.fetchOptions();
    }
  },
  computed: {
    readonly() {
      return this.optionsList.length === 0 ? true : false;
    },
  },
  methods: {
    async initIndexedDB() {
      try {
        return await openDB('anteSelectCache', 1, {
          upgrade(db) {
            if (!db.objectStoreNames.contains('selectOptions')) {
              db.createObjectStore('selectOptions', { keyPath: 'apiUrl' });
            }
          },
        });
      } catch (error) {
        console.error('Error initializing IndexedDB:', error);
        return null;
      }
    },

    async saveToCache(apiUrl, data) {
      if (!this.storeCache) return;

      try {
        const db = await this.initIndexedDB();
        if (!db) return;

        const tx = db.transaction('selectOptions', 'readwrite');
        await tx.store.put({
          apiUrl,
          data,
          timestamp: Date.now(),
          userId: this.getUserId(),
        });
        await tx.done;
      } catch (error) {
        console.error('Error saving to cache:', error);
      }
    },

    async getFromCache(apiUrl) {
      if (!this.storeCache) return null;

      try {
        const db = await this.initIndexedDB();
        if (!db) return null;

        const cachedData = await db.get('selectOptions', apiUrl);
        if (!cachedData) return null;

        // Verify the user ID matches to prevent using another user's cache
        if (cachedData.userId !== this.getUserId()) {
          return null;
        }

        return cachedData.data;
      } catch (error) {
        console.error('Error getting from cache:', error);
        return null;
      }
    },

    getUserId() {
      // Get user ID from localStorage to associate cache with user
      const accountInfo = localStorage.getItem('accountInformation');
      if (!accountInfo) return 'guest';

      try {
        const parsed = JSON.parse(accountInfo);
        return parsed.id || 'guest';
      } catch (e) {
        return 'guest';
      }
    },
    getSelectData() {
      try {
        return this.optionsList.find((item) => item.value == this.selected);
      } catch (error) {
        console.error('Error in getSelectData:', error);
        this.error = 'Failed to get selected data';
        return null;
      }
    },
    async setAutoSelect(autoSelect) {
      this.autoSelect = autoSelect;
      this.selected = autoSelect;
      this.$emit('update:modelValue', this.selected);
    },
    selectFirstOption() {
      try {
        if (this.filteredOptions.length === 0) return false;

        // Find the null option if it exists
        const nullOption = this.nullOption ? this.filteredOptions.find((opt) => opt.value === 0 || opt.value === null) : null;

        // If we have a null option and no valid selection, select it
        if (nullOption && (this.selected === null || this.selected === undefined || this.selected === '')) {
          this.selected = nullOption.value;
          this.label = nullOption.label;
          this.$emit('update:modelValue', this.selected);
          this.$emit('first-option-selected', nullOption);
          return true;
        }

        // If no null option or we have a valid selection, try to select the first non-null option
        const firstOption = this.filteredOptions.find((opt) => opt.value !== 0 && opt.value !== null);
        if (firstOption && (this.selected === null || this.selected === undefined || this.selected === '')) {
          this.selected = firstOption.value;
          this.label = firstOption.label;
          this.$emit('update:modelValue', this.selected);
          this.$emit('first-option-selected', firstOption);
          return true;
        }

        return false;
      } catch (error) {
        console.error('Error in selectFirstOption:', error);
        this.error = 'Failed to select first option';
        return false;
      }
    },
    async fetchOptions(autoSelect = null) {
      this.isLoading = true;
      this.error = null;

      // Set the autoSelect value if provided
      if (autoSelect !== null && autoSelect !== undefined) {
        this.autoSelect = autoSelect;
      }

      try {
        // If local options are provided, use them instead of fetching from API
        if (this.options && this.options.length > 0) {
          this.processOptionsList(this.options);
          this.isLoading = false;
          return;
        }

        if (!this.apiUrl) {
          throw new Error('API URL is required');
        }

        this.optionsList = [];

        // Try to get data from cache first if storeCache is enabled
        let dataList = [];
        if (this.storeCache) {
          const cachedData = await this.getFromCache(this.apiUrl);
          if (cachedData) {
            dataList = cachedData;
            this.processOptionsList(dataList);
            this.isLoading = false;
            return;
          }
        }

        // If no cache or cache miss, fetch from API
        const response = await api.get(this.apiUrl);

        if (!response || !response.data) {
          throw new Error('Invalid response from server');
        }

        const { data } = response;

        if (Array.isArray(data)) {
          dataList = data;
        } else if (data && data.list) {
          dataList = data.list;
        } else {
          console.warn('Unexpected response format. Expected array or object with list property.');
          dataList = [];
        }

        // Save to cache if storeCache is enabled
        if (this.storeCache) {
          await this.saveToCache(this.apiUrl, dataList);
        }

        this.processOptionsList(dataList);
      } catch (error) {
        console.error('Error fetching options:', error);
        this.error = `Failed to load options: ${error.message || 'Unknown error'}`;
        this.$emit('error', {
          message: this.error,
          details: error,
          component: 'GSelect',
          timestamp: new Date().toISOString(),
        });
        this.filteredOptions = [{ label: 'Error loading options', value: null }];
      } finally {
        this.isLoading = false;
      }
    },
    processOptionsList(list) {
      // Debug: Log the raw data to understand structure
      
      this.optionsList = list.map((item) => {
        // Handle both string arrays and object arrays
        if (typeof item === 'string') {
          // For plain string arrays, use the string as both label and value
          return {
            label: item,
            value: item
          };
        } else {
          // For object arrays, try to extract label and value
          const label = item.label || item.name || item.title || item.description || 
                       (item.value ? String(item.value) : '') || 'Unknown';
          const value = item.value !== undefined ? item.value : 
                       (item.id !== undefined ? item.id : 
                       (item.key !== undefined ? item.key : item));
          
          return {
            ...item,
            label: String(label), // Ensure label is always a string
            value: value
          };
        }
      });

      if (this.nullOption) {
        this.optionsList.unshift({ label: this.nullOption, value: 0 });
      }

      if (!this.optionsList.length) {
        this.filteredOptions = this.nullOption ? [{ label: this.nullOption, value: null }] : [{ label: this.noData, value: null }];
        this.selected = null;
        this.$emit('update:modelValue', this.selected);
        return;
      }

      this.filteredOptions = this.optionsList;

      // Handle modelValue if provided
      if (this.modelValue !== null && this.modelValue !== undefined) {
        const selectFilter = this.filteredOptions.find((item) => item.value == this.modelValue);
        if (selectFilter) {
          this.label = selectFilter.label;
          this.selected = selectFilter.value;
          this.autoSelect = this.selected;
          this.$emit('update:modelValue', this.selected);
          return;
        }
      }

      // Handle autoSelect if provided
      if (this.autoSelect !== null && this.autoSelect !== undefined) {
        const selectFilter = this.filteredOptions.find((item) => item.value == this.autoSelect);
        if (selectFilter) {
          this.label = selectFilter.label;
          this.selected = selectFilter.value;
          this.$emit('update:modelValue', this.selected);
          return;
        }
      }

      // If we get here, try to select the first option
      this.selectFirstOption();
    },

    filterFn(val, update) {
      update(() => {
        const needle = val.toLowerCase();
        this.filteredOptions = this.optionsList.filter((v) => {
          // Ensure label exists and is a string before calling toLowerCase()
          const label = v.label || '';
          return label.toString().toLowerCase().indexOf(needle) > -1;
        });
      });
    },

    // Method to refresh options and optionally auto-select a value
    async refreshOptions(autoSelectValue = null) {
      // Clear cache if using cache
      if (this.storeCache) {
        await this.clearCache(this.apiUrl);
      }
      
      // Refresh options
      await this.fetchOptions();
      
      // Auto-select if value provided
      if (autoSelectValue !== null && autoSelectValue !== undefined) {
        await this.setAutoSelect(autoSelectValue);
      }
    },

    async clearCache(apiUrl) {
      if (!this.storeCache) return;

      try {
        const db = await this.initIndexedDB();
        if (!db) return;

        const tx = db.transaction('selectOptions', 'readwrite');
        await tx.store.delete(apiUrl);
        await tx.done;
      } catch (error) {
        console.error('Error clearing cache:', error);
      }
    },
  },
};
</script>
