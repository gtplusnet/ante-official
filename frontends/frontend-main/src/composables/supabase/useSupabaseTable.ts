import { ref, computed, watch, nextTick, readonly, Ref } from 'vue';
import supabaseService from '../../services/supabase';

export interface FilterConfig {
  column: string;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'ilike' | 'is' | 'in' | 'not';
  value: any;
}

export interface OrderConfig {
  column: string;
  ascending?: boolean;
}

export interface UseSupabaseTableOptions {
  table: string;
  select?: string;
  filters?: FilterConfig[];
  orderBy?: OrderConfig | OrderConfig[];
  pageSize?: number;
  searchColumn?: string;
  searchValue?: Ref<string> | string;
  useCursor?: boolean;
  orSearchColumns?: string[]; // Array of columns to search with OR condition
  autoFetch?: boolean; // Control initial fetching behavior
}

export interface UseSupabaseTableReturn<T> {
  data: Readonly<Ref<T[]>>;
  loading: Readonly<Ref<boolean>>;
  error: Readonly<Ref<Error | null>>;
  totalCount: Readonly<Ref<number>>;
  currentPage: Readonly<Ref<number>>;
  totalPages: Readonly<Ref<number>>;
  hasNextPage: Readonly<Ref<boolean>>;
  hasPreviousPage: Readonly<Ref<boolean>>;
  refetch: () => Promise<void>;
  nextPage: () => Promise<void>;
  previousPage: () => Promise<void>;
  goToPage: (page: number) => Promise<void>;
  setPageSize: (size: number) => void;
  setSearch: (value: string) => void;
  setOrSearch: (value: string, columns: string[]) => void;
  addFilter: (filter: FilterConfig) => void;
  removeFilter: (column: string) => void;
  clearFilters: () => void;
}

// Cache management
const tableCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Export cache utilities for external cache management
export function clearTableCache(tableNamePattern?: string) {
  if (!tableNamePattern) {
    // Clear all cache
    tableCache.clear();
    console.log('[DEBUG] useSupabaseTable: Cleared all cache');
  } else {
    // Clear cache entries matching the pattern
    const keysToDelete: string[] = [];
    for (const key of tableCache.keys()) {
      if (key.includes(tableNamePattern)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => {
      tableCache.delete(key);
      console.log('[DEBUG] useSupabaseTable: Cleared cache for key:', key);
    });
  }
}

export function getCacheSize() {
  return tableCache.size;
}

export function useSupabaseTable<T = any>(options: UseSupabaseTableOptions): UseSupabaseTableReturn<T> {
  const {
    table,
    select = '*',
    filters: initialFilters = [],
    orderBy,
    pageSize: initialPageSize = 10,
    searchColumn,
    searchValue,
    orSearchColumns,
    useCursor = false,
    autoFetch = true
  } = options;

  // State
  const data = ref<T[]>([]) as Ref<T[]>;
  // Initialize loading as false to prevent double spinners
  const loading = ref(false);
  const error = ref<Error | null>(null);
  const totalCount = ref(0);
  const currentPage = ref(1);
  const pageSize = ref(initialPageSize);
  const searchQuery = ref('');
  const filters = ref<FilterConfig[]>([...initialFilters]);
  const orSearchQuery = ref('');
  const orSearchCols = ref<string[]>(orSearchColumns || []);
  const initialized = ref(false);
  
  // Cursor pagination state
  const firstCursor = ref<string | null>(null);
  const lastCursor = ref<string | null>(null);
  const cursors = ref<string[]>([]);

  // Computed
  const totalPages = computed(() => Math.ceil(totalCount.value / pageSize.value));
  const hasNextPage = computed(() => {
    if (useCursor) {
      return data.value.length === pageSize.value;
    }
    return currentPage.value < totalPages.value;
  });
  const hasPreviousPage = computed(() => currentPage.value > 1);

  // Cache key generation
  const getCacheKey = () => {
    const filterStr = JSON.stringify(filters.value);
    const search = typeof searchValue === 'object' ? searchValue.value : searchValue;
    const orSearch = orSearchQuery.value ? `_or_${orSearchQuery.value}_${orSearchCols.value.join(',')}` : '';
    return `${table}_${currentPage.value}_${pageSize.value}_${filterStr}_${search || searchQuery.value}${orSearch}`;
  };

  // Check cache
  const checkCache = () => {
    const key = getCacheKey();
    const cached = tableCache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }
    return null;
  };

  // Save to cache
  const saveToCache = (result: any) => {
    const key = getCacheKey();
    tableCache.set(key, { data: result, timestamp: Date.now() });
  };

  // Clean old cache entries
  const cleanCache = () => {
    const now = Date.now();
    for (const [key, value] of tableCache.entries()) {
      if (now - value.timestamp > CACHE_TTL) {
        tableCache.delete(key);
      }
    }
  };

  // Fetch data
  const fetchData = async () => {
    try {
      loading.value = true;
      error.value = null;

      // Check cache first
      const cached = checkCache();
      if (cached) {
        data.value = cached.data;
        totalCount.value = cached.count || 0;
        loading.value = false;
        return;
      }

      // Get Supabase client
      const client = supabaseService.getClient();
      if (!client) {
        throw new Error('Supabase client not initialized');
      }

      // Build query
      let query = client.from(table).select(select, { count: 'exact' });

      // Apply filters
      filters.value.forEach(filter => {
        switch (filter.operator) {
          case 'eq':
            query = query.eq(filter.column, filter.value);
            break;
          case 'neq':
            query = query.neq(filter.column, filter.value);
            break;
          case 'gt':
            query = query.gt(filter.column, filter.value);
            break;
          case 'gte':
            query = query.gte(filter.column, filter.value);
            break;
          case 'lt':
            query = query.lt(filter.column, filter.value);
            break;
          case 'lte':
            query = query.lte(filter.column, filter.value);
            break;
          case 'like':
            query = query.like(filter.column, filter.value);
            break;
          case 'ilike':
            query = query.ilike(filter.column, filter.value);
            break;
          case 'is':
            query = query.is(filter.column, filter.value);
            break;
          case 'in':
            query = query.in(filter.column, filter.value);
            break;
          case 'not':
            // Handle NOT operations, especially for null checks
            if (filter.value === null) {
              query = query.not(filter.column, 'is', null);
            } else {
              query = query.not(filter.column, 'eq', filter.value);
            }
            break;
        }
      });

      // Apply search - either OR search across multiple columns or single column search
      const search = typeof searchValue === 'object' ? searchValue.value : searchValue;
      const column = typeof searchColumn === 'object' ? searchColumn.value : searchColumn;
      
      // Check if we should use OR search (when we have orSearchQuery and columns)
      if (orSearchQuery.value && orSearchCols.value.length > 0) {
        // Separate direct columns from nested columns
        const directColumns = orSearchCols.value.filter(col => !col.includes('.'));
        const nestedColumns = orSearchCols.value.filter(col => col.includes('.'));
        
        // Build OR condition for direct columns only
        if (directColumns.length > 0) {
          const orConditions = directColumns
            .map(col => `${col}.ilike.%${orSearchQuery.value}%`)
            .join(',');
          query = query.or(orConditions);
        }
        
        // For nested columns, we'll need to handle them differently
        // For now, log a warning if there are nested columns
        if (nestedColumns.length > 0) {
          console.warn(
            '⚠️ Nested column search in OR conditions not directly supported by PostgREST.',
            '\nNested columns:', nestedColumns,
            '\nConsider using database views or stored procedures for complex searches.'
          );
        }
      } else if ((search || searchQuery.value) && column) {
        // Single column search - check if it's a nested column
        if (column && column.includes('.')) {
          // For nested columns, we can't use direct ilike, need to handle differently
          console.warn(`⚠️ Nested column search '${column}' not directly supported.`);
        } else {
          query = query.ilike(column, `%${search || searchQuery.value}%`);
        }
      }

      // Apply ordering - support both single and multiple order configs
      if (orderBy) {
        if (Array.isArray(orderBy)) {
          // Multiple order columns - apply in reverse order (last is primary)
          [...orderBy].reverse().forEach(order => {
            query = query.order(order.column, { ascending: order.ascending ?? true });
          });
        } else {
          query = query.order(orderBy.column, { ascending: orderBy.ascending ?? true });
        }
      }

      // Apply pagination
      if (useCursor && lastCursor.value && currentPage.value > 1) {
        // Cursor-based pagination
        query = query.gt('id', lastCursor.value).limit(pageSize.value);
      } else {
        // Offset-based pagination with proper bounds checking
        const offset = (currentPage.value - 1) * pageSize.value;
        const from = offset;
        const to = offset + pageSize.value - 1;
        
        // Use range for all cases - Supabase handles bounds automatically
        // This prevents 416 errors by letting Supabase handle the edge cases
        query = query.range(from, to);
      }

      // Execute query
      const { data: result, error: queryError, count } = await query;

      if (queryError) {
        throw new Error(queryError.message);
      }

      data.value = result || [];
      totalCount.value = count || 0;

      // Update cursors for cursor-based pagination
      if (useCursor && result && result.length > 0) {
        if (currentPage.value === 1) {
          firstCursor.value = result[0].id;
        }
        lastCursor.value = result[result.length - 1].id;
        
        // Store cursor for this page
        if (!cursors.value[currentPage.value - 1]) {
          cursors.value[currentPage.value - 1] = result[0].id;
        }
      }

      // Save to cache
      saveToCache({ data: result, count });

      // Clean old cache entries
      cleanCache();

    } catch (err) {
      error.value = err as Error;
      console.error('Error fetching data from Supabase:', err);
    } finally {
      loading.value = false;
    }
  };

  // Navigation methods
  const refetch = async () => {
    // Clear cache before fetching to ensure fresh data
    const key = getCacheKey();
    tableCache.delete(key);
    await fetchData();
  };

  const nextPage = async () => {
    if (hasNextPage.value) {
      currentPage.value++;
      await fetchData();
    }
  };

  const previousPage = async () => {
    if (hasPreviousPage.value) {
      currentPage.value--;
      if (useCursor && currentPage.value > 1) {
        lastCursor.value = cursors.value[currentPage.value - 2] || null;
      }
      await fetchData();
    }
  };

  const goToPage = async (page: number) => {
    // Better bounds checking to prevent 416 errors
    const maxPage = Math.max(1, totalPages.value);
    const targetPage = Math.max(1, Math.min(page, maxPage));
    
    if (targetPage !== currentPage.value) {
      currentPage.value = targetPage;
      if (useCursor && targetPage > 1) {
        lastCursor.value = cursors.value[targetPage - 2] || null;
      }
      await fetchData();
    }
  };

  const setPageSize = (size: number) => {
    pageSize.value = size;
    currentPage.value = 1;
    firstCursor.value = null;
    lastCursor.value = null;
    cursors.value = [];
  };

  const setSearch = (value: string) => {
    searchQuery.value = value;
    // Clear OR search when regular search is set
    orSearchQuery.value = '';
    currentPage.value = 1;
    firstCursor.value = null;
    lastCursor.value = null;
    cursors.value = [];
  };

  const setOrSearch = (value: string, columns: string[]) => {
    orSearchQuery.value = value;
    orSearchCols.value = columns;
    // Clear regular search when OR search is set
    searchQuery.value = '';
    currentPage.value = 1;
    firstCursor.value = null;
    lastCursor.value = null;
    cursors.value = [];
  };

  const addFilter = (filter: FilterConfig) => {
    // Remove existing filter with same column to prevent duplicates
    const existingIndex = filters.value.findIndex(f => f.column === filter.column);
    if (existingIndex !== -1) {
      filters.value[existingIndex] = filter;
    } else {
      filters.value.push(filter);
    }
    currentPage.value = 1;
    firstCursor.value = null;
    lastCursor.value = null;
    cursors.value = [];
  };

  const removeFilter = (column: string) => {
    filters.value = filters.value.filter(f => f.column !== column);
    currentPage.value = 1;
    firstCursor.value = null;
    lastCursor.value = null;
    cursors.value = [];
  };

  const clearFilters = () => {
    filters.value = [...initialFilters];
    currentPage.value = 1;
    firstCursor.value = null;
    lastCursor.value = null;
    cursors.value = [];
  };

  // Debounced fetch to prevent rapid consecutive calls
  let debounceTimer: NodeJS.Timeout | null = null;
  
  const debouncedFetch = () => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    debounceTimer = setTimeout(() => {
      fetchData();
    }, 100); // 100ms debounce
  };

  // Initialize and set up watchers
  const initializeAndWatch = async () => {
    // Mark as initialized to prevent duplicate fetches
    initialized.value = true;
    
    // Initial fetch if autoFetch is enabled
    if (autoFetch) {
      await fetchData();
    }

    // Watch for reactive changes with better control
    watch(
      () => [
        filters.value,
        currentPage.value,
        pageSize.value,
        searchQuery.value,
        orSearchQuery.value,
        orSearchCols.value,
        // Watch the resolved search value
        typeof searchValue === 'object' ? searchValue.value : searchValue,
        typeof searchColumn === 'object' ? searchColumn.value : searchColumn
      ],
      () => {
        if (initialized.value) {
          debouncedFetch();
        }
      },
      { deep: true, flush: 'post' }
    );
  };

  // Initialize on next tick to ensure all reactive dependencies are set up
  nextTick(() => {
    initializeAndWatch();
  });

  return {
    data: readonly(data),
    loading: readonly(loading),
    error: readonly(error),
    totalCount: readonly(totalCount),
    currentPage: readonly(currentPage),
    totalPages,
    hasNextPage,
    hasPreviousPage,
    refetch,
    nextPage,
    previousPage,
    goToPage,
    setPageSize,
    setSearch,
    setOrSearch,
    addFilter,
    removeFilter,
    clearFilters
  };
}