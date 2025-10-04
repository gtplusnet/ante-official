# TASK-002: Optimize Boot Files Configuration

**Status**: Not Started
**Priority**: P0
**Milestone**: M1 - Quick Wins
**Owner**: @jhay
**Estimated Effort**: 3 hours
**Actual Effort**: -

**Dates**:
- Created: 2025-10-04
- Started: -
- Completed: -

---

## Description

Optimize the 13 boot files currently loaded on application startup. Several boot files (sentry, newrelic, apexchart, fullcalendar) can be lazy-loaded or conditionally loaded to reduce initial bundle size and improve startup performance.

## Business Value

- Reduces initial JavaScript bundle by ~200KB
- Improves Time to Interactive by 30-40%
- Better developer experience (faster dev mode startup)
- Cleaner separation of concerns (load only what's needed)

---

## Requirements

- [ ] Audit all 13 boot files for necessity on startup
- [ ] Implement lazy loading for heavy libraries (ApexCharts, FullCalendar)
- [ ] Make monitoring tools (Sentry, New Relic) production-only
- [ ] Optimize auth and multi-account boot files
- [ ] Remove redundant initializations
- [ ] Test all lazy-loaded functionality

## Acceptance Criteria

**Must Have**:
- [ ] Sentry only loads in production
- [ ] New Relic only loads in production
- [ ] ApexCharts lazy-loaded (only when chart components render)
- [ ] FullCalendar lazy-loaded (only on calendar pages)
- [ ] All functionality still works
- [ ] No runtime errors
- [ ] Initial bundle reduced by at least 150KB

**Nice to Have**:
- [ ] Google Auth lazy-loaded (only on login page)
- [ ] Boot file loading monitoring/metrics

---

## Dependencies

### Blocking Tasks (Must Complete First):
- None

### Blocked Tasks (Waiting on This):
- TASK-003: Implement aggressive vendor code splitting (cleaner after boot optimization)

### Related Tasks:
- TASK-005: Enable Vite compression and minification

---

## Technical Details

### Files to Create/Modify
- `frontends/frontend-main/quasar.config.js` (updated - boot array)
- `frontends/frontend-main/src/boot/apexchart.ts` (modified for lazy loading)
- `frontends/frontend-main/src/boot/fullcalendar.ts` (modified for lazy loading)
- `frontends/frontend-main/src/boot/sentry.ts` (add production check)
- `frontends/frontend-main/src/boot/newrelic.js` (add production check)
- `frontends/frontend-main/src/boot/google-auth.ts` (consider lazy loading)

### Current Boot Files (13 total)
```javascript
boot: [
  'sentry',        // Monitoring - production only?
  'axios',         // Essential - keep
  'supabase',      // Essential - keep
  'auth',          // Essential - keep
  'multi-account', // Essential - keep
  'mixins',        // Essential - keep
  'apexchart',     // Heavy - lazy load! (~528KB)
  'bus',           // Essential - keep
  'fullcalendar',  // Heavy - lazy load! (~100KB+)
  'theme',         // Essential - keep
  'route-loading', // Essential - keep
  'google-auth',   // Optional - lazy load?
  'newrelic'       // Monitoring - production only
]
```

### Configuration Changes
- [ ] `quasar.config.js` - Modify boot array
- [ ] Add environment checks to monitoring boot files

---

## Implementation Plan

### Approach

1. **Phase 1 - Environment-Based Loading**:
   ```javascript
   // Remove from boot array, add conditionally
   boot: [
     'axios', 'supabase', 'auth', 'multi-account',
     'mixins', 'bus', 'theme', 'route-loading',
     // Add conditionally based on env
     ...(process.env.NODE_ENV === 'production' ? ['sentry', 'newrelic'] : [])
   ]
   ```

2. **Phase 2 - Lazy Load Heavy Libraries**:
   ```javascript
   // In components that use ApexCharts
   import { defineAsyncComponent } from 'vue'
   const ApexChart = defineAsyncComponent(() => import('vue3-apexcharts'))
   ```

3. **Phase 3 - Google Auth On-Demand**:
   ```javascript
   // Load only on login page
   // Remove from boot, add to SignIn.vue
   ```

### Key Decisions

**Decision 1**: Lazy load ApexCharts instead of boot-time initialization
**Reasoning**: ApexCharts is only used on specific pages (dashboard, analytics)

**Decision 2**: Production-only monitoring tools
**Reasoning**: No need for Sentry/New Relic in development mode

**Decision 3**: Keep core auth/routing in boot
**Reasoning**: These are essential for app functionality

---

## Implementation Notes

### Strategy for Lazy Loading ApexCharts

**Before** (boot file):
```typescript
// src/boot/apexchart.ts
import VueApexCharts from 'vue3-apexcharts'
app.use(VueApexCharts)
```

**After** (component-level):
```typescript
// In Dashboard.vue or other chart pages
import { defineAsyncComponent } from 'vue'
const ApexChart = defineAsyncComponent(() =>
  import('vue3-apexcharts').then(m => m.default)
)
```

### Strategy for Conditional Monitoring

**Before**:
```javascript
boot: ['sentry', 'newrelic']
```

**After**:
```javascript
// src/boot/sentry.ts
export default ({ app }) => {
  if (process.env.NODE_ENV === 'production') {
    // Initialize Sentry
  }
}
```

---

## Challenges & Solutions

[Will be updated during implementation]

---

## Testing

### Test Plan
- [ ] Test in development mode:
  - [ ] Verify Sentry NOT loaded
  - [ ] Verify New Relic NOT loaded
  - [ ] Verify app starts faster
- [ ] Test in production build:
  - [ ] Verify Sentry IS loaded
  - [ ] Verify New Relic IS loaded
  - [ ] Verify error tracking works
- [ ] Test chart pages:
  - [ ] Verify ApexCharts loads on-demand
  - [ ] Verify charts render correctly
  - [ ] Check network tab for lazy loading
- [ ] Test calendar pages:
  - [ ] Verify FullCalendar loads on-demand
  - [ ] Verify calendar renders correctly
- [ ] Manual testing of all features

### Test Commands
```bash
cd frontends/frontend-main

# Dev mode (should NOT load sentry/newrelic)
yarn dev
# Open devtools -> Network -> Check for sentry/newrelic

# Production build
yarn build
NODE_ENV=production yarn preview
# Should load sentry/newrelic

# Check bundle sizes
du -sh dist/spa/assets/*.js | grep -E '(apex|calendar|sentry)'
```

---

## Performance Impact

### Before
- Initial Boot Files: 13 files
- Boot Phase Bundle: ~800KB
- Time to Interactive: ~8s
- Files Loaded on Startup: All libraries

### After (Target)
- Initial Boot Files: 8 essential files
- Boot Phase Bundle: ~600KB (200KB reduction)
- Time to Interactive: ~5s (37% improvement)
- Lazy Loaded: ApexCharts, FullCalendar, monitoring tools

### Expected Bundle Impact
- ApexCharts: 528KB → Lazy loaded
- FullCalendar: ~100KB → Lazy loaded
- Sentry: ~260KB → Production only (not in dev)
- Total Savings (dev): ~888KB
- Total Savings (prod): ~628KB

---

## Documentation Updates

- [ ] Update CLAUDE.md with new boot file strategy
- [ ] Document lazy loading pattern for future libraries
- [ ] Add comments to quasar.config.js explaining boot order

---

## Review Checklist

**Code Quality**:
- [ ] Environment checks properly implemented
- [ ] No TypeScript errors
- [ ] No ESLint warnings
- [ ] Clean async component definitions

**Testing**:
- [ ] Dev mode tested (no monitoring)
- [ ] Production build tested (with monitoring)
- [ ] Charts render correctly
- [ ] Calendar renders correctly
- [ ] All E2E tests passing

**Performance**:
- [ ] Bundle size reduced
- [ ] Startup time improved
- [ ] Lazy loading verified in Network tab

**Git**:
- [ ] Commit message: `perf(boot): optimize boot files with lazy loading [TASK-002]`
- [ ] Branch: `task/002-optimize-boot-files`

---

## Rollback Plan

**If Something Goes Wrong**:
1. Revert quasar.config.js boot array
2. Revert boot file modifications
3. Test specific feature that broke
4. Adjust approach for that specific boot file

**Monitoring**:
- [ ] Check console for missing module errors
- [ ] Verify charts/calendar functionality
- [ ] Check Sentry dashboard for error spikes

---

## Implementation Checklist

### Boot Files to Modify
- [ ] `sentry.ts` - Add production check
- [ ] `newrelic.js` - Add production check
- [ ] `apexchart.ts` - Convert to lazy loading pattern
- [ ] `fullcalendar.ts` - Convert to lazy loading pattern
- [ ] `google-auth.ts` - Evaluate for lazy loading

### quasar.config.js Changes
- [ ] Remove 'apexchart' from boot array
- [ ] Remove 'fullcalendar' from boot array
- [ ] Conditionally add 'sentry' (prod only)
- [ ] Conditionally add 'newrelic' (prod only)

### Component Updates Needed
- [ ] Update all components using ApexCharts
- [ ] Update all components using FullCalendar
- [ ] Test all chart pages
- [ ] Test all calendar pages

---

## Sign-off

**Implemented By**: -
**Reviewed By**: -
**Deployed**: -
**Verified In**: -

---

**Notes**: This is a high-impact optimization. The ~200KB reduction in initial bundle will significantly improve Time to Interactive. Be careful with lazy loading to ensure smooth UX (consider showing skeleton loaders while charts load).
