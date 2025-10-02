<template>
  <div>
    <!-- Always show table structure - never show white loading spinner -->
    <div>
      <div v-if="!noFilter && tableSettings" class="filters q-mb-md">
        <div class="left-side">
          <template v-for="filter in filters" :key="filter.key">
            <div v-if="filter.hasOwnProperty('selectBoxAPI')">
              <g-input
                class="q-mr-sm text-body-medium"
                :storeCache="true"
                :nullOption="`All ${filter.label}`"
                required
                type="select"
                :apiUrl="filter.selectBoxAPI"
                v-model="filterData[filter.key]"
                @update:model-value="onFilterChange"
              ></g-input>
            </div>
          </template>
        </div>
        <div class="right-side">
          <!-- search by -->
          <select v-if="searchBy" v-model="searchBy" class="filter-option text-body-medium" @change="onSearchByChange">
            <option v-for="search in tableSettings.search" :key="search.key" :value="search.column || search.key">
              {{ search.label }}
            </option>
          </select>

          <!-- search input -->
          <q-input 
            v-if="searchBy" 
            v-model="searchKeyword" 
            outlined 
            dense 
            class="text-body-medium" 
            placeholder="Search"
            @update:model-value="onSearchChange"
            debounce="300"
          >
            <template v-slot:append>
              <q-icon name="search" />
            </template>
          </q-input>

          <slot name="actions"></slot>
        </div>
      </div>
      
      <div class="g-table">
        <!-- Error message -->
        <div v-if="error" class="text-center q-pa-md text-negative">
          <q-icon name="error" size="48px" />
          <div class="q-mt-sm">{{ error.message || 'An error occurred while loading data' }}</div>
          <q-btn @click="refetch" label="Retry" color="primary" class="q-mt-md" />
        </div>

        <!-- Table -->
        <table v-if="tableSettings && !error">
          <thead>
            <tr>
              <th v-for="column in tableSettings.columns" :key="column.key" :class="column.class" class="text-title-small">
                {{ column.label }}
              </th>
              <th v-if="isRowActionEnabled" class="text-title-small">Actions</th>
            </tr>
          </thead>
          <!-- Skeleton loading tbody -->
          <tbody v-if="isLoading" class="skeleton-tbody text-body-small">
            <tr v-for="n in skeletonRowCount" :key="`skeleton-${n}`" class="skeleton-row">
              <td v-for="column in tableSettings.columns" :key="`${n}-${column.key}`" :class="column.class">
                <q-skeleton 
                  type="text" 
                  :width="getSkeletonWidth(column)"
                  height="20px"
                />
              </td>
              <td v-if="isRowActionEnabled" class="text-center">
                <q-skeleton type="rect" width="40px" height="32px" />
              </td>
            </tr>
          </tbody>

          <!-- Regular data tbody -->
          <tbody v-else class="text-body-small">
            <tr class="text-label-medium" v-if="tableData.length === 0">
              <td :colspan="tableSettings.columns.length + (isRowActionEnabled ? 1 : 0)" class="text-center text-label-medium">
                No data available
              </td>
            </tr>

            <tr 
              :class="isClickableRow ? 'clickable' : 'not-clickable'" 
              v-for="data in tableData" 
              :key="data.id || data.accountId" 
              @click="$emit('row-click', data)"
            >
              <td v-for="column in tableSettings.columns" :key="column.key" :class="column.class">
                <template v-if="column.hasOwnProperty('slot')">
                  <!-- badge -->
                  <table-badges v-if="column.slot == 'badge'" :badgeData="getNestedValue(data, column.key)"></table-badges>

                  <!-- percentage -->
                  <table-percentage v-if="column.slot == 'percentage'" :data="getNestedValue(data, column.key)"></table-percentage>

                  <slot v-else :name="column.slot" :data="data"></slot>
                </template>
                <template v-else>
                  {{ getNestedValue(data, column.key) }}
                </template>
              </td>
              <td class="text-center" v-if="isRowActionEnabled">
                <slot name="row-actions" :data="data"></slot>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Pagination -->
        <div class="pagination q-pa-md text-center" v-if="totalPages > 1">
          <q-btn
            @click="previousPage"
            :disable="!hasPreviousPage"
            flat
            round
            icon="chevron_left"
            class="q-ma-xs"
          />
          
          <template v-for="page in paginationRange" :key="page">
            <q-btn
              v-if="typeof page === 'number'"
              @click="goToPage(page)"
              :flat="currentPage !== page"
              :unelevated="currentPage === page"
              :color="currentPage === page ? 'primary' : 'grey-8'"
              :label="page"
              class="q-ma-xs"
            />
            <span v-else class="q-ma-xs">...</span>
          </template>
          
          <q-btn
            @click="nextPage"
            :disable="!hasNextPage"
            flat
            round
            icon="chevron_right"
            class="q-ma-xs"
          />
        </div>
      </div>
    </div>
    
    <!-- Removed v-else white spinner - we now always have tableSettings -->
  </div>
</template>

<style scoped src="./GTable.scss"></style>

<script lang="ts">
import { ref, computed, onMounted, nextTick, defineComponent } from 'vue';
import GInput from '../form/GInput.vue';
import TableBadges from './TableBadges.vue';
import TablePercentage from './TablePercentage.vue';
import tableDefs from 'src/references/table.reference';
import { useHRISEmployees, TabType } from 'src/composables/supabase/useHRISEmployees';

export default defineComponent({
  name: 'SupabaseGTable',
  components: {
    GInput,
    TableBadges,
    TablePercentage,
  },
  expose: ['refetch', 'reload', 'refresh'],
  props: {
    noFilter: {
      type: Boolean,
      default: false,
    },
    isRowActionEnabled: {
      type: Boolean,
      default: false,
    },
    tableKey: {
      type: String,
      required: true,
    },
    supabaseTab: {
      type: String as () => TabType,
      required: true,
    },
    isClickableRow: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['row-click'],
  setup(props) {
    // Initialize table settings with fallback to prevent white spinner
    const settings = tableDefs[props.tableKey];
    
    // Create default table settings if none found to prevent null state
    const defaultTableSettings = {
      columns: [
        {
          key: 'loading',
          label: 'Loading...',
          class: 'text-center',
        },
      ],
      search: [],
      filter: [],
      perPage: 10,
    };
    
    const tableSettings = ref<any>(settings || defaultTableSettings);
    const filters = ref<any[]>(settings?.filter || []);
    const filterData = ref<Record<string, any>>({});
    const searchBy = ref<string>('');
    const searchKeyword = ref<string>('');

    // Initialize all reactive data synchronously
    if (settings) {
      if (settings.search?.length > 0) {
        searchBy.value = settings.search[0].column || settings.search[0].key;
      }
      
      if (settings.filter) {
        // Initialize filterData with no default values to prevent branchId=0 issue
        const initialFilterData: Record<string, any> = {};
        settings.filter.forEach((filter: any) => {
          initialFilterData[filter.key] = null; // Use null instead of default values
        });
        filterData.value = initialFilterData;
      }
    }

    // Use the HRIS composable with autoFetch disabled initially
    const hrisComposable = useHRISEmployees(
      props.supabaseTab,
      {
        column: computed(() => searchBy.value),
        value: searchKeyword
      }
    );

    // Trigger initial fetch after all initialization is complete
    onMounted(() => {
      // Give the component a moment to fully settle before fetching
      nextTick(() => {
        hrisComposable.refetch();
      });
    });

    // Computed properties from composable
    const tableData = computed(() => hrisComposable.data.value);
    const isLoading = computed(() => hrisComposable.loading.value);
    const error = computed(() => hrisComposable.error.value);
    const currentPage = computed(() => hrisComposable.currentPage.value);
    const totalPages = computed(() => hrisComposable.totalPages.value);
    const hasNextPage = computed(() => hrisComposable.hasNextPage.value);
    const hasPreviousPage = computed(() => hrisComposable.hasPreviousPage.value);

    // Pagination range calculation
    const paginationRange = computed(() => {
      const range: (number | string)[] = [];
      const total = totalPages.value;
      const current = currentPage.value;
      
      if (total <= 7) {
        for (let i = 1; i <= total; i++) {
          range.push(i);
        }
      } else {
        if (current <= 3) {
          for (let i = 1; i <= 5; i++) {
            range.push(i);
          }
          range.push('...');
          range.push(total);
        } else if (current >= total - 2) {
          range.push(1);
          range.push('...');
          for (let i = total - 4; i <= total; i++) {
            range.push(i);
          }
        } else {
          range.push(1);
          range.push('...');
          for (let i = current - 1; i <= current + 1; i++) {
            range.push(i);
          }
          range.push('...');
          range.push(total);
        }
      }
      
      return range;
    });

    // Methods
    const getNestedValue = (obj: any, path: string) => {
      return path.split('.').reduce((current, key) => current?.[key], obj);
    };

    const onFilterChange = () => {
      // Apply filters to the composable
      const unsupportedFilters: string[] = [];
      
      Object.entries(filterData.value).forEach(([key, value]) => {
        // Skip empty, null, undefined values to prevent unnecessary filters
        if (value === null || value === undefined || value === '' || value === 0) {
          hrisComposable.removeFilter(key);
          return;
        }
        
        // Skip nested relation filters as Supabase doesn't support them directly
        if (key.includes('.')) {
          unsupportedFilters.push(key);
          return;
        }
        
        if (value !== null && value !== undefined) {
          hrisComposable.addFilter({
            column: key,
            operator: 'eq',
            value: value
          });
        } else {
          hrisComposable.removeFilter(key);
        }
      });
      
      // Log all unsupported filters at once
      if (unsupportedFilters.length > 0) {
        console.warn(
          `⚠️ HRIS Supabase Integration: The following nested filters are not yet supported in direct database queries:`,
          unsupportedFilters,
          '\nThese filters require backend API implementation or client-side filtering.'
        );
      }
    };

    const onSearchChange = (value: string) => {
      hrisComposable.setSearch(value);
    };

    const onSearchByChange = () => {
      // Search column changed, trigger new search
      if (searchKeyword.value) {
        hrisComposable.setSearch(searchKeyword.value);
      }
    };

    const refetch = () => {
      console.log('[DEBUG] SupabaseGTable: refetch method called');
      return hrisComposable.refetch();
    };
    const reload = () => {
      console.log('[DEBUG] SupabaseGTable: reload method called');
      return hrisComposable.refetch();
    };
    const refresh = () => {
      console.log('[DEBUG] SupabaseGTable: refresh method called');
      return hrisComposable.refetch();
    };
    const previousPage = () => hrisComposable.previousPage();
    const nextPage = () => hrisComposable.nextPage();
    const goToPage = (page: number) => hrisComposable.goToPage(page);

    // Skeleton helper methods
    const getSkeletonWidth = (column: any) => {
      const key = column.key?.toLowerCase() || '';
      
      // Map column types to appropriate widths
      if (key.includes('id') || key.includes('code')) return '80px';
      if (key.includes('name') || key.includes('fullname')) return '180px';
      if (key.includes('email')) return '200px';
      if (key.includes('date')) return '120px';
      if (key.includes('status')) return '100px';
      if (key.includes('department') || key.includes('position')) return '140px';
      if (key.includes('company') || key.includes('branch')) return '150px';
      
      // Default width
      return '120px';
    };

    const skeletonRowCount = computed(() => {
      // Show skeleton rows based on page size or default to 7 (matches employeeListTable setting)
      return tableSettings.value?.perPage || 7;
    });

    return {
      // Data
      tableSettings,
      tableData,
      isLoading,
      error,
      filters,
      filterData,
      searchBy,
      searchKeyword,
      currentPage,
      totalPages,
      hasNextPage,
      hasPreviousPage,
      paginationRange,
      
      // Methods
      getNestedValue,
      onFilterChange,
      onSearchChange,
      onSearchByChange,
      refetch,
      reload,
      refresh,
      previousPage,
      nextPage,
      goToPage,
      
      // Skeleton helpers
      getSkeletonWidth,
      skeletonRowCount,
    };
  },
});
</script>