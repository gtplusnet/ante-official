# Centralized Caching Strategy

## Overview

The ANTE application uses a **centralized, account-aware caching system** that automatically handles cache invalidation on account switches, provides configurable TTLs, and offers consistent caching behavior across all components.

## Architecture

### Core Components

```
/frontends/frontend-main/src/utils/cache/
├── CacheManager.ts           # Base abstract class
└── implementations/
    ├── TaskCache.ts          # Task-specific cache
    ├── DashboardCache.ts     # Dashboard cache
    └── index.ts              # Export singleton instances

/frontends/frontend-main/src/composables/
└── useCache.ts               # Vue composable for cache operations

/frontends/frontend-main/src/components/shared/common/
└── CacheIndicator.vue        # Visual feedback component
```

## Key Features

### 1. Account-Aware Caching
- **Automatic Invalidation**: Cache automatically clears when switching accounts
- **Account Isolation**: Each account has separate cache entries
- **Key Format**: `{cachePrefix}_{accountId}_{hashedParams}`

### 2. Configurable TTLs (Time To Live)

| Cache Type | Default TTL | Use Case |
|------------|-------------|----------|
| **TASK_LIST** | 5 minutes | Frequently changing task lists |
| **TASK_COUNT** | 1 hour | Task count badges |
| **NOTIFICATION_COUNT** | 1 hour | Notification badges |
| **DASHBOARD_COUNTERS** | 24 hours | Dashboard statistics |
| **USER_PREFERENCES** | 24 hours | User settings |
| **EMPLOYEE_LIST** | 24 hours | Employee data |
| **STATIC_CONFIG** | 7 days | Rarely changing configuration |
| **DEFAULT** | 24 hours | General purpose |

### 3. Event-Driven Invalidation
Caches automatically invalidate when specific events occur:
- Account switch events
- Data mutation events (create, update, delete)
- Custom invalidation events

### 4. Smart Loading with Cache
- **load()** method: Checks cache first, only fetches if needed
- **refresh()** method: Forces fresh fetch, bypasses cache
- Shows cached data immediately
- Background refresh updates UI seamlessly

### 5. Visual Feedback
- **Sync Icon**: Rotating icon when refreshing data
- **Cached Icon**: Static icon when showing cached data
- **Age Display**: "Updated X minutes ago" timestamp

## Implementation Guide

### ⚠️ Important: load() vs refresh()

The cache system provides two methods for fetching data:

| Method | When to Use | Behavior | Example Use Case |
|--------|-------------|----------|------------------|
| **load()** | Initial component load | Checks cache first, fetches if needed | `onMounted(() => load())` |
| **refresh()** | Manual refresh action | Forces API call, bypasses cache | Refresh button click |

**Critical**: Always use `load()` for initial loads to utilize caching. Only use `refresh()` when you explicitly need fresh data.

### Dynamic Cache Keys

The cache system supports dynamic cache keys that re-evaluate based on reactive values:

```typescript
// Function that returns cache key based on reactive values
const generateCacheKey = () => ({
  status: activeTab.value,
  search: searchTerm.value,
  sortBy: currentSort.value
});

// Pass the function to useCache
const { data, load, refresh } = useCache(
  cacheManager,
  fetchFunction,
  {
    cacheKey: generateCacheKey, // Function is called on each cache operation
    ttl: CacheTTL.DEFAULT
  }
);
```

This ensures different cache entries for different states (e.g., different tabs, search terms).

### Basic Usage

#### 1. Using the Cache Composable

```typescript
import { useCache } from '@/composables/useCache';
import { dashboardCache } from '@/utils/cache/implementations';

export default defineComponent({
  setup() {
    // Use centralized cache
    const {
      data,           // Reactive data ref
      isCached,       // Boolean: showing cached data
      isRefreshing,   // Boolean: fetching fresh data
      lastUpdated,    // Date: last update time
      load,           // Function: smart load (checks cache first)
      refresh         // Function: force refresh (bypasses cache)
    } = useCache(
      dashboardCache,
      async () => {
        // Fetch function
        const response = await api.get('/dashboard/counters');
        return response.data;
      },
      {
        cacheKey: 'counters',
        ttl: CacheTTL.DASHBOARD_COUNTERS, // 24 hours
        invalidateEvents: [
          'filing-approved',
          'filing-rejected',
          'leave-request-changed'
        ]
      }
    );

    return { data, isCached, isRefreshing, lastUpdated, load, refresh };
  }
});
```

#### 2. Adding Visual Indicators

```vue
<template>
  <div>
    <!-- Cache indicator -->
    <CacheIndicator
      :is-cached="isCached"
      :is-refreshing="isRefreshing"
      :last-updated="lastUpdated"
      :show-label="true"
      :show-age="true"
      size="14px"
    />

    <!-- Your content -->
    <div v-if="data">
      {{ data.value }}
    </div>
  </div>
</template>
```

### Creating New Cache Implementations

#### 1. Extend CacheManager

```typescript
// src/utils/cache/implementations/MyCustomCache.ts
import { CacheManager, CacheTTL } from '../CacheManager';

export interface MyCustomData {
  // Define your data structure
}

export class MyCustomCacheManager extends CacheManager<MyCustomData> {
  protected cachePrefix = 'myCustomCache';

  // Custom methods for specific cache operations
  getCustomData(params: any, accountId: string): MyCustomData | null {
    return this.get(params, accountId);
  }

  setCustomData(
    params: any,
    data: MyCustomData,
    accountId: string,
    ttl = CacheTTL.DEFAULT
  ): void {
    this.set(params, data, accountId, ttl);
  }
}

// Export singleton instance
export const myCustomCache = new MyCustomCacheManager();
```

#### 2. Register in Index

```typescript
// src/utils/cache/implementations/index.ts
export { myCustomCache } from './MyCustomCache';
```

## Account Switching Behavior

### Automatic Cache Invalidation

When a user switches accounts:

1. **Old Account Cache Cleared**: All cache entries for the previous account are removed
2. **Account-Switched Event**: Emitted by auth/multiAccount stores
3. **Components Re-fetch**: All components using `useCache` automatically refetch data
4. **New Cache Created**: Fresh cache entries created for the new account

### Event Flow

```
User switches account
    ↓
multiAccount.switchAccount()
    ↓
Emit 'account-switched' event
    ↓
CacheManager.onAccountSwitch()
    ↓
Clear old account cache
    ↓
Components refetch data
    ↓
New cache populated
```

## Cache Invalidation Events

### Global Events

| Event | Trigger | Effect |
|-------|---------|--------|
| `account-switched` | Account change | Clears old account cache |
| `logout` | User logout | Clears all caches |

### Module-Specific Events

#### Task Module
- `task-created`
- `task-changed`
- `task-completed`
- `approval-processed`

#### Filing Module
- `filing-created`
- `filing-updated`
- `filing-approved`
- `filing-rejected`

#### Payroll Module
- `cutoff-date-range-status-updated`
- `payroll-cutoff-list-changed`

#### Leave Module
- `leave-request-changed`

## Storage Structure

### LocalStorage Format

```json
{
  "taskCache_userId123_taskList_active_noSearch_createdAt_asc": {
    "data": { /* actual cached data */ },
    "metadata": {
      "timestamp": 1758086213000,
      "ttl": 300000,
      "version": "1.0.0",
      "accountId": "userId123"
    }
  }
}
```

### Cache Entry Validation

A cache entry is considered valid if:
1. Version matches current version
2. Not expired (current time - timestamp < ttl)
3. Account ID matches current user (if specified)

## Performance Considerations

### Quota Management
- Automatic cleanup of expired entries
- Handles `QuotaExceededError` gracefully
- Removes oldest entries when space needed

### Loading Strategy - load() vs refresh()

#### load() Method (Recommended for initial loads)
1. Check cache first - display immediately if found
2. If no cache or expired, fetch from API
3. Start background refresh if cache exists
4. No loading spinners when cached data exists

```typescript
onMounted(() => {
  // Use load() for initial component load
  load(); // Checks cache first
});
```

#### refresh() Method (For manual refresh only)
1. Bypass cache completely
2. Force fresh API fetch
3. Update cache with new data
4. Show loading state

```typescript
// Manual refresh button
const handleRefresh = () => {
  refresh(); // Forces fresh fetch
};
```

### Recommended TTLs

| Data Volatility | Recommended TTL | Examples |
|-----------------|-----------------|----------|
| **High** | 1-5 minutes | Active tasks, notifications |
| **Medium** | 1-6 hours | Statistics, counts |
| **Low** | 24 hours | User profiles, settings |
| **Static** | 7+ days | Configuration, constants |

## Testing Cache Behavior

### Manual Testing

1. **Test Cache Hit**
   ```javascript
   // Browser console
   localStorage.getItem('dashboardCache_userId_counters')
   ```

2. **Test Account Switch**
   - Switch accounts in UI
   - Verify old cache cleared
   - Verify new data fetched

3. **Test TTL Expiration**
   - Modify timestamp in localStorage
   - Refresh page
   - Verify data refetched

### Clear Cache Manually

```javascript
// Clear all cache for current user
Object.keys(localStorage)
  .filter(k => k.includes('Cache'))
  .forEach(k => localStorage.removeItem(k));

// Clear specific cache type
Object.keys(localStorage)
  .filter(k => k.startsWith('taskCache_'))
  .forEach(k => localStorage.removeItem(k));
```

## Migration Guide

### Migrating Existing Components

1. **Identify Current Caching**
   ```typescript
   // OLD: Direct localStorage or custom cache
   const cached = localStorage.getItem('myData');
   ```

2. **Create/Use Cache Implementation**
   ```typescript
   // NEW: Use centralized cache
   import { useCache } from '@/composables/useCache';
   import { myCache } from '@/utils/cache/implementations';
   ```

3. **Replace Logic**
   ```typescript
   // Replace manual cache checks with useCache
   const { data, isCached, refresh } = useCache(
     myCache,
     fetchFunction,
     options
   );
   ```

4. **Add Visual Feedback**
   ```vue
   <CacheIndicator
     :is-cached="isCached"
     :is-refreshing="isRefreshing"
   />
   ```

## Best Practices

### DO's
- ✅ Use `load()` for initial component loads
- ✅ Use `refresh()` only for manual refresh actions
- ✅ Use appropriate TTLs based on data volatility
- ✅ Add invalidation events for data mutations
- ✅ Test account switching behavior
- ✅ Handle errors gracefully with cache fallback

### DON'Ts
- ❌ Don't use `refresh()` for initial loads (use `load()` instead)
- ❌ Don't cache sensitive data that shouldn't persist
- ❌ Don't use very short TTLs unnecessarily (defeats purpose)
- ❌ Don't ignore account switching implications
- ❌ Don't cache data that changes in real-time
- ❌ Don't forget to add invalidation events

## Troubleshooting

### Common Issues

1. **Cache Not Being Used (Always Fetching)**
   - Ensure you're using `load()` not `refresh()` for initial loads
   - Check if cache key is consistent
   - Verify TTL hasn't expired

2. **Cache Not Updating**
   - Check if invalidation events are configured
   - Verify TTL hasn't been set too long
   - Ensure account ID is correct

3. **QuotaExceededError**
   - Cache automatically cleans up old entries
   - Can manually clear cache if needed
   - Consider shorter TTLs for large data

4. **Account Data Mixing**
   - Verify account-switched events firing
   - Check cache keys include accountId
   - Ensure stores emit proper events

5. **Performance Issues**
   - Use appropriate TTLs (not too short)
   - Batch API calls where possible
   - Consider cache warming for critical data

6. **Same Cache Used for Different States**
   - Ensure cache key is a function if using reactive values
   - Verify the function returns different values for different states
   - Check that reactive values are properly tracked

7. **Console Shows CanceledError**
   - This is now handled automatically
   - axios.isCancel() checks prevent logging canceled requests
   - Normal behavior when requests are intentionally canceled

## Future Enhancements

### Planned Features
1. **Cache Warming**: Pre-fetch critical data
2. **Partial Updates**: Update specific cache fields
3. **Cache Sync**: Cross-tab cache synchronization
4. **Analytics**: Cache hit/miss ratios
5. **Compression**: Compress large cache entries

### Potential Optimizations
- IndexedDB for larger datasets
- Service Worker integration
- Cache versioning for gradual migrations
- Selective cache persistence

## References

- [Cache Manager Source](/frontends/frontend-main/src/utils/cache/CacheManager.ts)
- [useCache Composable](/frontends/frontend-main/src/composables/useCache.ts)
- [Implementation Examples](/frontends/frontend-main/src/utils/cache/implementations/)
- [Cache Indicator Component](/frontends/frontend-main/src/components/shared/common/CacheIndicator.vue)