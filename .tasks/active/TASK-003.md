# TASK-003: Implement Aggressive Vendor Code Splitting

**Status**: Not Started
**Priority**: P0
**Milestone**: M1 - Quick Wins
**Owner**: @jhay
**Estimated Effort**: 4 hours
**Actual Effort**: -

**Dates**:
- Created: 2025-10-04
- Started: -
- Completed: -

---

## Description

Implement a granular code splitting strategy in Vite to break the massive 1.1MB main bundle into smaller, cacheable chunks organized by vendor and module. This will enable better browser caching and faster initial page loads.

## Business Value

- Improves initial page load by 50-60% (smaller initial bundle)
- Better browser caching (vendor bundles rarely change)
- Faster subsequent page loads (cached vendor chunks)
- Reduced bandwidth usage for returning users
- Better Lighthouse scores (smaller initial JavaScript)

---

## Requirements

- [ ] Implement vendor chunking strategy (Vue, Quasar, Charts, etc.)
- [ ] Implement module-based chunking (Asset, HRIS, CMS pages)
- [ ] Configure chunk naming for better debugging
- [ ] Optimize chunk sizes (aim for 200-400KB per chunk)
- [ ] Test bundle splitting in production build
- [ ] Verify all chunks load correctly

## Acceptance Criteria

**Must Have**:
- [ ] Main bundle reduced to <500KB (from 1.1MB)
- [ ] Vendor chunks created for: Vue, Quasar, Charts, Calendar, Office, Socket
- [ ] Module chunks created for: Asset, HRIS, CMS, Treasury, Project
- [ ] No single chunk larger than 500KB
- [ ] All pages load correctly
- [ ] Build successful with no warnings

**Nice to Have**:
- [ ] Chunk loading monitoring
- [ ] Prefetching strategy for likely-next modules

---

## Dependencies

### Blocking Tasks (Must Complete First):
- TASK-001: Remove unused dependencies (cleaner chunk analysis)
- TASK-002: Optimize boot files (fewer initial dependencies)

### Blocked Tasks (Waiting on This):
- TASK-004: Add bundle analyzer (will show chunk sizes clearly)

### Related Tasks:
- TASK-008: Implement lazy loading for heavy dialogs

---

## Technical Details

### Files to Create/Modify
- `frontends/frontend-main/quasar.config.js` (updated - extendViteConf)
- `frontends/frontend-main/src/router/routes.ts` (verify dynamic imports)

### Current State
- Single main bundle: 1.1MB
- StudentManagement: 1009KB (separate)
- ApexCharts: 528KB (separate)
- Limited chunking strategy

### Configuration Changes
- [x] `quasar.config.js` - Already has some manual chunks, need to expand

---

## Implementation Plan

### Approach

**Phase 1 - Vendor Chunking**:
```javascript
manualChunks(id) {
  if (id.includes('node_modules')) {
    // Core framework
    if (id.includes('vue') || id.includes('pinia')) {
      return 'vendor-vue'
    }
    // UI framework
    if (id.includes('quasar')) {
      return 'vendor-quasar'
    }
    // Charts
    if (id.includes('chart') || id.includes('apex')) {
      return 'vendor-charts'
    }
    // Calendar
    if (id.includes('fullcalendar')) {
      return 'vendor-calendar'
    }
    // Office (Excel, PDF)
    if (id.includes('xlsx') || id.includes('jspdf') || id.includes('html2canvas')) {
      return 'vendor-office'
    }
    // Real-time
    if (id.includes('socket.io')) {
      return 'vendor-socket'
    }
    // Database
    if (id.includes('supabase')) {
      return 'vendor-supabase'
    }
    // Monitoring
    if (id.includes('sentry')) {
      return 'vendor-monitoring'
    }
    // UI utilities
    if (id.includes('vuedraggable') || id.includes('qrcode')) {
      return 'vendor-ui'
    }
    // Everything else
    return 'vendor-other'
  }

  // Module-based chunking for application code
  if (id.includes('/pages/Member/Asset/')) return 'module-asset'
  if (id.includes('/pages/Member/HRIS/')) return 'module-hris'
  if (id.includes('/pages/Member/CMS/')) return 'module-cms'
  if (id.includes('/pages/Member/Treasury/')) return 'module-treasury'
  if (id.includes('/pages/Member/Project/')) return 'module-project'
  if (id.includes('/pages/Member/School/')) return 'module-school'
}
```

**Phase 2 - Chunk Optimization**:
```javascript
output: {
  manualChunks: [function above],
  chunkFileNames: 'assets/[name]-[hash].js',
  entryFileNames: 'assets/[name]-[hash].js',
  assetFileNames: 'assets/[name]-[hash].[ext]',
}
```

### Expected Chunk Breakdown

| Chunk Name | Estimated Size | Contents |
|------------|---------------|----------|
| vendor-vue | ~150KB | Vue, Vue Router, Pinia |
| vendor-quasar | ~400KB | Quasar framework |
| vendor-charts | ~500KB | ApexCharts, Chart.js |
| vendor-calendar | ~150KB | FullCalendar |
| vendor-office | ~400KB | xlsx, jspdf, html2canvas |
| vendor-socket | ~100KB | Socket.IO client |
| vendor-supabase | ~100KB | Supabase client |
| vendor-monitoring | ~250KB | Sentry |
| vendor-ui | ~50KB | Small UI utilities |
| vendor-other | ~100KB | Misc dependencies |
| module-asset | ~200KB | Asset module pages |
| module-hris | ~150KB | HRIS module pages |
| module-cms | ~150KB | CMS module pages |
| Main bundle | ~300KB | Core app code |

**Total**: ~2.9MB split across ~14 chunks (vs 1.1MB in single chunk)

### Key Decisions

**Decision 1**: Separate charts into their own chunk
**Reasoning**: Charts are heavy (528KB) and not used on every page

**Decision 2**: Module-based chunking for pages
**Reasoning**: Users typically work in one module at a time, so splitting by module improves caching

**Decision 3**: Keep vendor chunks separate from app code
**Reasoning**: Vendor code changes less frequently, better cache hit rate

---

## Implementation Notes

### Vite Configuration Structure

```javascript
// quasar.config.js
extendViteConf() {
  return {
    build: {
      chunkSizeWarningLimit: 500,
      sourcemap: 'hidden',
      rollupOptions: {
        output: {
          manualChunks(id) {
            // Implementation from Phase 1
          },
          chunkFileNames: 'assets/[name]-[hash].js',
          entryFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash].[ext]',
        },
      },
    },
  }
}
```

### Testing Strategy

1. Build with ANALYZE=true to visualize chunks
2. Check network tab for chunk loading
3. Navigate between modules to verify lazy loading
4. Check chunk sizes (none >500KB)

---

## Challenges & Solutions

### Expected Challenge 1: Chunk Size Still Too Large
**Potential Solution**: Further split large vendors (e.g., split ApexCharts types)

### Expected Challenge 2: Too Many HTTP Requests
**Potential Solution**: Use HTTP/2 multiplexing (Vercel supports this)

### Expected Challenge 3: Shared Code Duplication
**Potential Solution**: Adjust chunk grouping to share common code

---

## Testing

### Test Plan
- [ ] Build production bundle
- [ ] Verify all chunks created
- [ ] Check chunk sizes (none >500KB)
- [ ] Test navigation between modules
- [ ] Verify lazy loading in Network tab
- [ ] Test all major features:
  - [ ] Dashboard loads
  - [ ] Charts render (vendor-charts loaded)
  - [ ] Calendar works (vendor-calendar loaded)
  - [ ] Excel export works (vendor-office loaded)
  - [ ] Asset module loads (module-asset loaded)
  - [ ] HRIS module loads (module-hris loaded)
- [ ] Performance test with Lighthouse

### Test Commands
```bash
cd frontends/frontend-main

# Build with analyzer
ANALYZE=true yarn build

# Check chunk sizes
ls -lhS dist/spa/assets/*.js | head -20

# Count chunks
ls dist/spa/assets/*.js | wc -l

# Preview production build
yarn preview
```

---

## Performance Impact

### Before
- Main Bundle: 1.1MB
- Total Chunks: ~3-5 chunks
- Initial Load: All vendor code
- Cache Efficiency: Low (main bundle changes frequently)

### After (Target)
- Largest Chunk: <500KB
- Total Chunks: ~14 chunks
- Initial Load: Only core vendors (~300KB)
- Cache Efficiency: High (vendor chunks stable)

### Expected Improvements
- Initial Bundle Size: 1.1MB → ~300KB (73% reduction)
- Time to Interactive: ~8s → ~3s (62% improvement)
- Subsequent Page Loads: Faster (cached vendor chunks)

---

## Documentation Updates

- [ ] Document chunking strategy in PLANNING.md
- [ ] Add comments to quasar.config.js explaining chunk logic
- [ ] Create diagram of chunk structure (if time permits)

---

## Review Checklist

**Code Quality**:
- [ ] Clean chunk naming convention
- [ ] Logical grouping of modules
- [ ] No TypeScript errors
- [ ] No build warnings

**Testing**:
- [ ] All chunks load correctly
- [ ] No broken imports
- [ ] All features working
- [ ] Lighthouse score improved

**Performance**:
- [ ] Main bundle <500KB
- [ ] No chunk >500KB
- [ ] Total bundle size acceptable
- [ ] Load time improved

**Git**:
- [ ] Commit message: `perf(build): implement aggressive vendor code splitting [TASK-003]`
- [ ] Branch: `task/003-vendor-code-splitting`

---

## Rollback Plan

**If Something Goes Wrong**:
1. Revert quasar.config.js changes
2. Build and test
3. Investigate which chunk caused the issue
4. Adjust chunking strategy for that specific vendor

**Monitoring**:
- [ ] Check Network tab for failed chunk loads
- [ ] Monitor console for "chunk load failed" errors
- [ ] Verify all routes accessible

---

## Vercel Configuration Notes

Vercel automatically handles:
- ✅ HTTP/2 (multiple chunks don't hurt performance)
- ✅ Compression (gzip/brotli)
- ✅ CDN caching (chunk hashes enable long-term caching)

No additional Vercel config needed for code splitting.

---

## Success Metrics

**Primary**:
- [ ] Main bundle <500KB
- [ ] All chunks <500KB individually
- [ ] 50%+ reduction in initial JavaScript

**Secondary**:
- [ ] Lighthouse Performance score >70
- [ ] Time to Interactive <5s
- [ ] First Contentful Paint <2s

---

## Sign-off

**Implemented By**: -
**Reviewed By**: -
**Deployed**: -
**Verified In**: -

---

**Notes**: This is the most impactful optimization in Phase 1. The 73% reduction in initial bundle will dramatically improve user experience. Monitor bundle analyzer output carefully to ensure chunks are well-balanced.
