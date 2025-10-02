# Cache Method Reference Guide

## Quick Decision Tree

```
Need to fetch data?
│
├─ Is it initial component load?
│  └─ YES → Use load()
│
├─ Is it a user-triggered refresh?
│  └─ YES → Use refresh()
│
├─ Is it an event-based update?
│  └─ YES → Use invalidation events (automatic)
│
└─ Is it a periodic update?
   └─ YES → Use refreshInterval option
```

## Method Comparison

| Aspect | `load()` | `refresh()` |
|--------|----------|-------------|
| **Cache Check** | ✅ Yes | ❌ No |
| **API Call** | Only if no cache | Always |
| **Loading State** | Only if no cache | Always |
| **Use Case** | Initial load | Manual refresh |
| **Performance** | Fast (cache hit) | Slower (API call) |
| **Background Refresh** | Yes | No |

## Implementation Examples

### ✅ CORRECT: Initial Load Pattern

```typescript
export default defineComponent({
  setup() {
    const { data, load, refresh } = useCache(
      myCache,
      fetchFunction,
      options
    );

    onMounted(() => {
      load(); // ✅ Checks cache first
    });

    const handleRefreshButton = () => {
      refresh(); // ✅ User action forces refresh
    };

    return { data, handleRefreshButton };
  }
});
```

### ✅ CORRECT: Dynamic Cache Keys

```typescript
// For reactive values like tabs or filters
const activeTab = ref('active');

const { data, load, refresh } = useCache(
  taskCache,
  fetchTaskList,
  {
    cacheKey: () => ({ // ✅ Function for dynamic keys
      tab: activeTab.value,
      filter: currentFilter.value
    }),
    ttl: CacheTTL.DEFAULT
  }
);
```

### ❌ WRONG: Common Mistakes

```typescript
// ❌ DON'T: Use refresh() on mount
onMounted(() => {
  refresh(); // Always hits API, ignores cache
});

// ❌ DON'T: Call load() multiple times
onMounted(() => {
  load();
  load(); // Duplicate - useCache handles this
});

// ❌ DON'T: Mix autoFetch with manual load
const { load } = useCache(cache, fetch, {
  autoFetch: true // Already fetches automatically
});
onMounted(() => {
  load(); // Redundant with autoFetch
});

// ❌ DON'T: Use static cache key for reactive values
const activeTab = ref('active');
const { data } = useCache(cache, fetch, {
  cacheKey: { tab: activeTab.value } // ❌ Evaluated once!
});
// Should be: cacheKey: () => ({ tab: activeTab.value })
```

## Component Lifecycle

### First Visit (No Cache)
```
Component Mounts
    ↓
load() called
    ↓
Cache miss
    ↓
Show loading skeleton
    ↓
Fetch from API
    ↓
Save to cache
    ↓
Display data
```

### Return Visit (With Cache)
```
Component Mounts
    ↓
load() called
    ↓
Cache hit
    ↓
Display cached data immediately
    ↓
Background refresh (silent)
    ↓
Update if changed
```

### Manual Refresh
```
User clicks refresh
    ↓
refresh() called
    ↓
Show loading state
    ↓
Fetch from API
    ↓
Update cache
    ↓
Display new data
```

## Options Configuration

### Basic Setup
```typescript
const { data, load, refresh } = useCache(
  cacheManager,
  fetchFunction,
  {
    cacheKey: 'unique-key',
    ttl: CacheTTL.DEFAULT,        // 24 hours
    autoFetch: false,              // Manual control
    invalidateEvents: ['updated']  // Auto-refresh triggers
  }
);
```

### AutoFetch vs Manual Load

| Option | Behavior | When to Use |
|--------|----------|-------------|
| `autoFetch: true` | Calls `load()` on mount automatically | Simple components |
| `autoFetch: false` | Manual control with `load()` | Complex loading logic |

### With AutoFetch (Simple)
```typescript
// No need to call load() manually
const { data } = useCache(cache, fetch, {
  autoFetch: true // Handles everything
});
```

### Without AutoFetch (Complex)
```typescript
// Full control over when to load
const { data, load } = useCache(cache, fetch, {
  autoFetch: false
});

onMounted(async () => {
  if (someCondition) {
    await load();
  }
});
```

## Performance Tips

1. **Always use `load()` for initial loads**
   - Prevents unnecessary API calls
   - Provides instant UI with cached data

2. **Reserve `refresh()` for user actions**
   - Refresh button clicks
   - Pull-to-refresh gestures
   - Force update scenarios

3. **Use invalidation events for automatic updates**
   - Better than polling
   - Reactive to actual changes

4. **Set appropriate TTLs**
   - Frequent changes: 5 minutes
   - Daily updates: 24 hours
   - Static data: 7 days

## Debugging

### Check Cache Usage
```javascript
// Browser console
localStorage.getItem('dashboardCache_userId_counters')
```

### Monitor API Calls
```javascript
// Network tab should show:
// - First visit: API call
// - Return visit: No immediate API call (background only)
// - Refresh button: API call
```

### Common Issues

| Problem | Cause | Solution |
|---------|-------|----------|
| Always fetching | Using `refresh()` instead of `load()` | Change to `load()` |
| Never updating | TTL too long | Reduce TTL or add events |
| Loading skeleton with cache | Wrong loading logic | Check `isCached` in template |
| Double fetching | Both autoFetch and manual load | Choose one approach |

## Summary

- **`load()`** = Smart, cache-aware loading
- **`refresh()`** = Force fresh data from API
- **Default to `load()`** for better performance
- **Only use `refresh()`** when users explicitly request fresh data