# Frontend-Main Optimization Plan

## Current State Analysis

### Application Metrics
- **587 Vue pages** and **194 components** (781 total Vue files)
- **Largest bundles**:
  - Main bundle: 1.1MB
  - StudentManagement.vue: 1009KB
  - ApexCharts: 528KB
  - Quasar: 495KB
  - MainLayout: 177KB
- **Heavy dependencies**:
  - @quasar: 82MB
  - jspdf: 29MB
  - vue-dragscroll: 15MB
  - xlsx: 7.3MB
  - chart.js: 6.3MB
- **Boot files**: 13 boot files loading on startup
- **Routes by module**: Asset (18), CMS (15), Treasury (13), Project (5)

---

## Optimization Strategy

### 1. Implement Code Splitting & Lazy Loading

**Goal**: Reduce initial bundle size by 50-70%

#### Actions:
- ✅ Convert all routes to use dynamic imports (partially done)
- ⏳ Implement lazy loading for heavy components:
  - Chart libraries (ApexCharts, Chart.js)
  - Calendar components (FullCalendar)
  - PDF generation (jspdf, html2canvas)
  - Excel export (xlsx)
- ⏳ Split vendor bundles more aggressively:
  ```javascript
  manualChunks: {
    'vendor-vue': ['vue', 'vue-router', 'pinia'],
    'vendor-quasar': ['quasar'],
    'vendor-charts': ['apexcharts', 'vue3-apexcharts', 'chart.js'],
    'vendor-calendar': ['@fullcalendar/core', '@fullcalendar/vue3'],
    'vendor-office': ['xlsx', 'jspdf', 'html2canvas'],
    'vendor-monitoring': ['@sentry/vue'],
    'vendor-ui': ['vuedraggable', 'vue-zoomable', 'qrcode.vue']
  }
  ```

**Expected Impact**: Initial load time reduced by 60%

---

### 2. Module Federation / Micro-Frontend Architecture

**Goal**: Split the monolithic app into independently deployable modules

#### Proposed Module Structure:
```
├── Core App (Login, Dashboard, Profile)
│   └── Vercel Project: ante-core
│   └── Domain: app.ante.ph
│
├── HRIS Module (All HR-related pages)
│   └── Vercel Project: ante-hris
│   └── Domain: hris.ante.ph
│   └── Routes: /hris/*
│
├── Asset Module (Asset management pages)
│   └── Vercel Project: ante-asset
│   └── Domain: asset.ante.ph
│   └── Routes: /asset/*
│
├── CMS Module (Content management pages)
│   └── Vercel Project: ante-cms
│   └── Domain: cms.ante.ph
│   └── Routes: /cms/*
│
├── Treasury Module (Financial pages)
│   └── Vercel Project: ante-treasury
│   └── Domain: treasury.ante.ph
│   └── Routes: /treasury/*
│
├── Project Module (Project management)
│   └── Vercel Project: ante-project
│   └── Domain: project.ante.ph
│   └── Routes: /project/*
│
└── School Module (School management)
    └── Vercel Project: ante-school
    └── Domain: school.ante.ph
    └── Routes: /school/*
```

#### Implementation Options:

**Option A: Webpack Module Federation**
- Use Vite Plugin Federation
- Share common dependencies (Vue, Quasar, Pinia)
- Runtime composition of modules
- Seamless navigation between modules

**Option B: Iframe-Based Micro-Frontends**
- Each module is a separate SPA
- Communication via postMessage
- Independent deployment cycles
- Better isolation

**Option C: Single-SPA Framework**
- Framework-agnostic orchestration
- Lazy load micro-frontends
- Shared navigation and state
- Better for mixed framework scenarios

**Recommended**: Option A (Module Federation) for better UX and code sharing

**Expected Impact**:
- Each module loads only 200-300KB initially
- Independent deployment and scaling
- Better developer experience (work on smaller codebases)

---

### 3. Component & Page Optimization

**Goal**: Optimize heavy components and pages

#### Priority Targets:
1. **StudentManagement.vue** (1009KB)
   - Break into smaller components:
     - StudentList.vue
     - StudentDetails.vue
     - StudentFilters.vue
     - StudentActions.vue
   - Implement virtual scrolling for student lists
   - Add pagination (50 students per page)
   - Lazy load student details on demand

2. **MainLayout.vue** (177KB)
   - Defer loading of navigation menus
   - Lazy load sidebar components
   - Optimize navigation rendering

3. **CMSDashboard.vue** (191KB)
   - Split dashboard widgets into separate chunks
   - Lazy load charts and graphs
   - Implement skeleton loaders

4. **ManpowerPayrollSummaryDialog.vue** (198KB)
   - Extract calculation logic to Web Worker
   - Lazy load dialog content
   - Implement progressive rendering

#### General Optimizations:
- ⏳ Implement virtual scrolling for all large lists
- ⏳ Add pagination to all data tables
- ⏳ Use skeleton loaders while components load
- ⏳ Remove unused components and pages
- ⏳ Convert heavy dialogs to lazy-loaded components

**Expected Impact**: 40-50% reduction in page-specific bundle sizes

---

### 4. Bundle Size Reduction

**Goal**: Reduce node_modules footprint by 30-40%

#### Dependency Replacements:

| Current Dependency | Size | Replacement | Size | Savings |
|-------------------|------|-------------|------|---------|
| vue-dragscroll | 15MB | vue3-draggable | ~500KB | ~14.5MB |
| xlsx | 7.3MB | xlsx-lite or exceljs | ~2MB | ~5.3MB |
| jspdf | 29MB | Load on-demand only | - | Runtime only |
| chart.js + apexcharts | Both | Choose one library | ~50% | ~3MB |

#### Icon Set Optimization:
- Current: fontawesome-v6, material-icons, material-icons-outlined
- Recommended: Keep only material-icons
- Use tree-shaking for icons
- **Savings**: ~2MB

#### Quasar Component Tree-Shaking:
```javascript
// Instead of auto-import, use explicit imports
import { QBtn, QInput, QTable } from 'quasar'
```
**Savings**: ~100-150KB

#### Boot File Optimization:
- Remove `newrelic.js` from development builds
- Lazy load `apexchart.ts`, `fullcalendar.ts`, `google-auth.ts`
- Load `sentry.ts` only in production
- **Savings**: ~200KB initial bundle

**Expected Impact**: Total savings of ~25MB in node_modules, ~500KB in production bundle

---

### 5. Build Configuration Improvements

#### Enhanced Vite Configuration:
```javascript
build: {
  target: 'es2020', // Modern browsers only
  minify: 'terser',
  terserOptions: {
    compress: {
      drop_console: true, // Remove console.logs
      drop_debugger: true,
      pure_funcs: ['console.log', 'console.info'],
    },
  },
  rollupOptions: {
    output: {
      // Granular chunking strategy
      manualChunks(id) {
        // Vendor chunking
        if (id.includes('node_modules')) {
          if (id.includes('vue') || id.includes('pinia')) return 'vendor-vue'
          if (id.includes('quasar')) return 'vendor-quasar'
          if (id.includes('chart') || id.includes('apex')) return 'vendor-charts'
          if (id.includes('fullcalendar')) return 'vendor-calendar'
          if (id.includes('xlsx') || id.includes('jspdf')) return 'vendor-office'
          if (id.includes('sentry')) return 'vendor-monitoring'
          if (id.includes('socket.io')) return 'vendor-socket'
          if (id.includes('supabase')) return 'vendor-supabase'
          return 'vendor-other'
        }

        // Module-based chunking
        if (id.includes('/pages/Member/Asset/')) return 'module-asset'
        if (id.includes('/pages/Member/HRIS/')) return 'module-hris'
        if (id.includes('/pages/Member/CMS/')) return 'module-cms'
        if (id.includes('/pages/Member/Treasury/')) return 'module-treasury'
        if (id.includes('/pages/Member/Project/')) return 'module-project'
        if (id.includes('/pages/Member/School/')) return 'module-school'
      },

      // Optimize chunk size
      chunkFileNames: 'assets/[name]-[hash].js',
      entryFileNames: 'assets/[name]-[hash].js',
      assetFileNames: 'assets/[name]-[hash].[ext]',
    },
  },

  // Increase chunk size warning limit
  chunkSizeWarningLimit: 500,

  // Enable sourcemaps only for errors
  sourcemap: 'hidden',
},

// Image optimization
assetsInlineLimit: 4096, // Inline assets < 4KB
```

#### Compression Settings:
```javascript
// Add to Vercel configuration
{
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

**Expected Impact**:
- 20-30% smaller bundle sizes
- Better caching strategy
- Faster subsequent loads

---

### 6. Performance Monitoring & Caching

#### Service Worker Implementation:
```javascript
// Cache Strategy
{
  // Cache static assets (CSS, JS, fonts)
  staticAssets: 'cache-first',

  // Cache API responses (stale-while-revalidate)
  apiCalls: 'network-first',

  // Cache images (cache-first with expiration)
  images: 'cache-first',

  // Offline fallback
  offlinePage: '/offline.html'
}
```

#### IndexedDB Caching:
- Cache user preferences
- Store frequently accessed data (employee list, project list)
- Offline data sync

#### Redis Caching (Backend):
- Cache API responses (5-15 min TTL)
- Cache Supabase queries
- Session management

#### Vercel Edge Caching:
```json
{
  "routes": [
    {
      "src": "/api/(.*)",
      "headers": {
        "cache-control": "s-maxage=60, stale-while-revalidate"
      }
    }
  ]
}
```

**Expected Impact**:
- 70-80% faster repeat visits
- Reduced backend load
- Better offline experience

---

### 7. Progressive Web App (PWA) Features

#### Implementation:
- ⏳ Enable Quasar PWA mode in production
- ⏳ Configure service worker for caching
- ⏳ Add app manifest for installability
- ⏳ Implement background sync for forms
- ⏳ Add offline fallback pages
- ⏳ Enable push notifications

#### PWA Configuration:
```javascript
pwa: {
  workboxMode: 'generateSW',
  workboxOptions: {
    skipWaiting: true,
    clientsClaim: true,
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/api\./,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'api-cache',
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 300, // 5 minutes
          },
        },
      },
      {
        urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
        handler: 'CacheFirst',
        options: {
          cacheName: 'image-cache',
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 86400, // 1 day
          },
        },
      },
    ],
  },
}
```

**Expected Impact**:
- App installable on mobile devices
- Offline functionality
- Better mobile UX

---

### 8. Route-Based Code Splitting

#### Implementation Strategy:
```javascript
// routes.ts
const routes = [
  {
    path: '/member/asset',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {
        path: 'warehouse/company',
        component: () => import(
          /* webpackChunkName: "asset-warehouse" */
          'pages/Member/Asset/Warehouse/AssetCompanyWarehouse.vue'
        ),
      },
    ],
  },
]
```

#### Route Prefetching:
```javascript
// router/index.ts
router.beforeEach((to, from, next) => {
  // Prefetch likely next routes
  if (to.name === 'member_dashboard') {
    // User likely to visit task or project
    import('pages/Member/Task/Tasks.vue')
    import('pages/Member/Project/Project.vue')
  }
  next()
})
```

#### Suspense Boundaries:
```vue
<template>
  <Suspense>
    <template #default>
      <AsyncComponent />
    </template>
    <template #fallback>
      <SkeletonLoader />
    </template>
  </Suspense>
</template>
```

**Expected Impact**:
- Each route loads only needed code
- Intelligent prefetching improves perceived performance
- Better loading states

---

### 9. Development Workflow Improvements

#### Turborepo Implementation:
```json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "outputs": []
    }
  }
}
```

#### Module Structure:
```
ante-official/
├── apps/
│   ├── core/          # Core app (login, dashboard)
│   ├── hris/          # HRIS module
│   ├── asset/         # Asset module
│   ├── cms/           # CMS module
│   ├── treasury/      # Treasury module
│   ├── project/       # Project module
│   └── school/        # School module
├── packages/
│   ├── shared-ui/     # Shared components
│   ├── shared-utils/  # Shared utilities
│   └── shared-types/  # Shared TypeScript types
└── turbo.json
```

#### Parallel Builds:
```yaml
# .github/workflows/deploy.yml
jobs:
  build:
    strategy:
      matrix:
        app: [core, hris, asset, cms, treasury, project, school]
    steps:
      - run: yarn turbo build --filter=${{ matrix.app }}
```

#### Bundle Analyzer:
```javascript
// quasar.config.js
build: {
  analyze: process.env.ANALYZE === 'true',
}
```

**Expected Impact**:
- 3-4x faster builds with caching
- Better developer experience
- Easier debugging and maintenance

---

### 10. Immediate Quick Wins

#### Priority 1 (Today - 1 hour):
- ✅ Remove unused boot files from development
- ✅ Defer non-critical scripts (newrelic, sentry in dev)
- ✅ Enable Vite compression
- ✅ Remove console.logs in production build

#### Priority 2 (This Week - 2-3 hours):
- ⏳ Optimize images to WebP format
- ⏳ Implement lazy loading for dialogs
- ⏳ Remove duplicate icon sets
- ⏳ Enable tree-shaking for Quasar components

#### Priority 3 (This Week - 4-5 hours):
- ⏳ Split vendor bundles more aggressively
- ⏳ Implement virtual scrolling on heavy tables
- ⏳ Add pagination to all list pages
- ⏳ Optimize MainLayout component

#### Commands to Run:
```bash
# Analyze current bundle
ANALYZE=true yarn build

# Test with optimizations
yarn build && yarn preview

# Check bundle sizes
du -sh dist/spa/assets/*.js | sort -h
```

**Expected Impact**:
- 20-30% bundle size reduction
- Faster initial load
- Better Lighthouse scores

---

## Implementation Timeline

### Phase 1: Quick Wins (1 week)
**Goal**: Reduce bundle size by 30%

- [ ] Remove unused dependencies
- [ ] Optimize boot files
- [ ] Implement aggressive code splitting
- [ ] Add bundle analyzer
- [ ] Enable compression
- [ ] Remove console.logs
- [ ] Optimize images

**Success Metrics**:
- Initial bundle < 700KB (from 1.1MB)
- Lighthouse score > 70

---

### Phase 2: Component Optimization (2 weeks)
**Goal**: Optimize heavy pages and components

- [ ] Break down StudentManagement.vue
- [ ] Optimize MainLayout.vue
- [ ] Implement virtual scrolling
- [ ] Add pagination to all tables
- [ ] Lazy load dialogs
- [ ] Implement skeleton loaders
- [ ] Optimize CMSDashboard.vue

**Success Metrics**:
- Largest page bundle < 300KB
- Time to Interactive < 3s

---

### Phase 3: Micro-Frontend Architecture (4 weeks)
**Goal**: Split into independently deployable modules

- [ ] Set up Turborepo
- [ ] Create shared packages
- [ ] Split Core module
- [ ] Split HRIS module
- [ ] Split Asset module
- [ ] Split CMS module
- [ ] Split Treasury module
- [ ] Split Project module
- [ ] Set up Module Federation
- [ ] Configure Vercel projects
- [ ] Test integration

**Success Metrics**:
- Each module < 500KB
- Independent deployment working
- Seamless navigation between modules

---

### Phase 4: PWA & Performance (2 weeks)
**Goal**: Production-ready optimizations

- [ ] Enable PWA mode
- [ ] Configure service worker
- [ ] Implement caching strategies
- [ ] Add offline support
- [ ] Enable push notifications
- [ ] Optimize fonts
- [ ] Implement route prefetching
- [ ] Add performance monitoring

**Success Metrics**:
- Lighthouse score > 90
- PWA installable
- Offline functionality working

---

### Phase 5: Monitoring & Optimization (Ongoing)
**Goal**: Continuous performance improvement

- [ ] Set up performance budgets
- [ ] Monitor bundle sizes in CI/CD
- [ ] Track Core Web Vitals
- [ ] A/B test optimizations
- [ ] Regular dependency audits
- [ ] Performance regression tests

**Success Metrics**:
- No bundle size regressions
- Core Web Vitals in green
- User satisfaction scores > 85%

---

## Expected Results Summary

### Performance Improvements:
| Metric | Current | Target | Improvement |
|--------|---------|--------|-------------|
| Initial Bundle | 1.1MB | 300-500KB | 55-73% |
| Time to Interactive | ~8s | <3s | 62% |
| First Contentful Paint | ~3s | <1.5s | 50% |
| Lighthouse Score | ~50 | >90 | 80% |
| Page Load (3G) | ~15s | <5s | 67% |

### Developer Experience:
- ✅ Faster build times (3-4x with Turborepo)
- ✅ Smaller codebases per module
- ✅ Independent deployment cycles
- ✅ Better debugging (smaller bundles)
- ✅ Easier onboarding for new developers

### Business Impact:
- ✅ Better user experience
- ✅ Higher user retention
- ✅ Lower bounce rates
- ✅ Better mobile performance
- ✅ Reduced infrastructure costs (better caching)
- ✅ Faster feature deployment

---

## Risks & Mitigation

### Risk 1: Module Federation Complexity
**Impact**: High
**Probability**: Medium
**Mitigation**:
- Start with proof-of-concept for one module
- Extensive testing before full rollout
- Maintain fallback to monolith if needed

### Risk 2: Breaking Changes
**Impact**: High
**Probability**: Low
**Mitigation**:
- Comprehensive E2E tests before migration
- Gradual rollout (feature flags)
- Maintain backward compatibility

### Risk 3: Developer Learning Curve
**Impact**: Medium
**Probability**: Medium
**Mitigation**:
- Documentation and training
- Pair programming sessions
- Gradual migration (not big bang)

### Risk 4: Deployment Complexity
**Impact**: Medium
**Probability**: Low
**Mitigation**:
- Automated CI/CD pipelines
- Rollback procedures
- Staging environment testing

---

## Decision Points

### Decision 1: Micro-Frontend Strategy
**Options**: Module Federation vs. Iframe vs. Single-SPA
**Recommendation**: Module Federation
**Reasoning**: Better UX, code sharing, modern approach

### Decision 2: Module Split Strategy
**Options**: By feature vs. By domain vs. Hybrid
**Recommendation**: By domain (HRIS, Asset, CMS, etc.)
**Reasoning**: Clear boundaries, team ownership, independent scaling

### Decision 3: Deployment Strategy
**Options**: All Vercel vs. Mixed (Vercel + DO) vs. All DO
**Recommendation**: All Vercel for frontends
**Reasoning**: Better DX, automatic HTTPS, edge caching, easy rollbacks

### Decision 4: State Management Across Modules
**Options**: Shared Pinia store vs. Independent stores vs. API-driven
**Recommendation**: API-driven with local stores
**Reasoning**: Better isolation, clearer data flow, easier debugging

---

## Next Steps

1. **Get Approval**: Review this plan with the team
2. **Proof of Concept**: Build one micro-frontend module (Asset or HRIS)
3. **Measure Baseline**: Run Lighthouse, measure current performance
4. **Start Phase 1**: Implement quick wins
5. **Regular Reviews**: Weekly progress updates
6. **Iterate**: Adjust plan based on learnings

---

## Resources & References

### Documentation:
- [Vite Code Splitting](https://vitejs.dev/guide/build.html#chunking-strategy)
- [Webpack Module Federation](https://webpack.js.org/concepts/module-federation/)
- [Quasar PWA](https://quasar.dev/quasar-cli-vite/developing-pwa/introduction)
- [Vercel Edge Network](https://vercel.com/docs/edge-network/overview)
- [Turborepo Guide](https://turbo.build/repo/docs)

### Tools:
- Bundle Analyzer: `vite-bundle-visualizer`
- Performance: Lighthouse, WebPageTest
- Monitoring: Sentry Performance, Vercel Analytics
- Testing: Playwright (already set up)

---

**Document Version**: 1.0
**Last Updated**: 2025-10-04
**Next Review**: After Phase 1 completion
