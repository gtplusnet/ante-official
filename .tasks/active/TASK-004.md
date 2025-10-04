# TASK-004: Add Bundle Analyzer to Build Process

**Status**: Not Started
**Priority**: P0
**Milestone**: M1 - Quick Wins
**Owner**: @jhay
**Estimated Effort**: 1 hour
**Actual Effort**: -

**Dates**:
- Created: 2025-10-04
- Started: -
- Completed: -

---

## Description

Integrate bundle analysis tools into the build process to visualize bundle composition, identify bloat, and track optimization progress. This will provide visibility into what's in each chunk and help guide future optimizations.

## Business Value

- Visual understanding of bundle composition
- Easy identification of optimization opportunities
- Track progress of optimization efforts over time
- Prevent bundle size regressions in CI/CD
- Better decision-making for code splitting

---

## Requirements

- [ ] Install bundle analyzer package (rollup-plugin-visualizer)
- [ ] Configure analyzer in quasar.config.js
- [ ] Add npm script for bundle analysis
- [ ] Generate initial bundle report
- [ ] Document how to use analyzer
- [ ] (Optional) Add bundle size monitoring to CI/CD

## Acceptance Criteria

**Must Have**:
- [ ] Bundle analyzer installed and configured
- [ ] Can run `ANALYZE=true yarn build` to generate report
- [ ] Visual report shows all chunks and their contents
- [ ] Report accessible in browser (HTML file)
- [ ] Documentation added for team usage

**Nice to Have**:
- [ ] Automated bundle size tracking in GitHub Actions
- [ ] Bundle size comparison between branches
- [ ] Alerts when bundle grows >5%

---

## Dependencies

### Blocking Tasks (Must Complete First):
- None (Can run in parallel with other tasks)

### Blocked Tasks (Waiting on This):
- TASK-003: Will benefit from visualization after code splitting

### Related Tasks:
- TASK-001: Remove unused dependencies
- TASK-005: Enable compression (need to measure impact)

---

## Technical Details

### Files to Create/Modify
- `frontends/frontend-main/package.json` (add dev dependency)
- `frontends/frontend-main/quasar.config.js` (add visualizer plugin)
- `frontends/frontend-main/.gitignore` (ignore stats.html)

### Package to Install
```bash
yarn add -D rollup-plugin-visualizer
```

### Configuration Changes
```javascript
// quasar.config.js
const { visualizer } = require('rollup-plugin-visualizer')

extendViteConf() {
  return {
    plugins: [
      process.env.ANALYZE === 'true' && visualizer({
        filename: 'dist/stats.html',
        open: true,
        gzipSize: true,
        brotliSize: true,
      })
    ].filter(Boolean),
  }
}
```

---

## Implementation Plan

### Approach

**Step 1**: Install Package
```bash
cd frontends/frontend-main
yarn add -D rollup-plugin-visualizer
```

**Step 2**: Configure in quasar.config.js
- Add visualizer plugin to Vite config
- Enable only when ANALYZE=true
- Configure output location and options

**Step 3**: Update Scripts
```json
// package.json
{
  "scripts": {
    "build:analyze": "ANALYZE=true yarn build"
  }
}
```

**Step 4**: Generate Initial Report
- Run build with analyzer
- Review generated stats.html
- Document findings

**Step 5**: Add to Documentation
- Update CLAUDE.md with usage instructions
- Add note to PLANNING.md about monitoring

### Key Decisions

**Decision 1**: Use rollup-plugin-visualizer
**Reasoning**: Works well with Vite, interactive visualization, shows gzip/brotli sizes

**Decision 2**: Manual trigger (not automatic)
**Reasoning**: Don't slow down every build, only when needed

---

## Implementation Notes

### Visualizer Configuration Options

```javascript
visualizer({
  filename: 'dist/stats.html',     // Output location
  open: true,                       // Auto-open in browser
  gzipSize: true,                   // Show gzipped sizes
  brotliSize: true,                 // Show brotli sizes
  template: 'treemap',              // Visualization type (treemap/sunburst/network)
  sourcemap: true,                  // Use sourcemaps for better accuracy
})
```

### Alternative Templates
- `treemap`: Best for finding large modules (recommended)
- `sunburst`: Good for hierarchical view
- `network`: Shows module relationships

---

## Testing

### Test Plan
- [ ] Install package successfully
- [ ] Build with ANALYZE=true
- [ ] Verify stats.html generated in dist/
- [ ] Open stats.html in browser
- [ ] Verify all chunks visible
- [ ] Check gzip/brotli sizes shown
- [ ] Test without ANALYZE flag (no stats.html)

### Test Commands
```bash
cd frontends/frontend-main

# Install
yarn add -D rollup-plugin-visualizer

# Test analyzer
ANALYZE=true yarn build

# Should open stats.html automatically
# If not: open dist/stats.html

# Test normal build (no analyzer)
yarn build
# Should NOT generate stats.html
```

---

## Performance Impact

### Build Time Impact
- **Without Analyzer**: 5-6 minutes
- **With Analyzer**: 5-7 minutes (slight increase)
- **Impact**: ~1 minute slower (acceptable for analysis)

### Benefits
- Easy identification of large modules
- Track optimization progress
- Prevent regressions

---

## Documentation Updates

- [ ] Add to CLAUDE.md:
  ```markdown
  ## Bundle Analysis

  To analyze bundle composition:
  ```bash
  cd frontends/frontend-main
  ANALYZE=true yarn build
  ```

  This will:
  1. Build the production bundle
  2. Generate `dist/stats.html`
  3. Auto-open in your browser

  Use this to:
  - Identify large dependencies
  - Verify code splitting working
  - Find optimization opportunities
  ```

- [ ] Add to PLANNING.md (Phase 5 - Monitoring section)

---

## Review Checklist

**Code Quality**:
- [ ] Package installed in devDependencies
- [ ] Configuration clean and well-commented
- [ ] .gitignore updated (dist/stats.html)

**Testing**:
- [ ] Analyzer works with ANALYZE=true
- [ ] Normal builds unaffected
- [ ] Visual report loads correctly

**Documentation**:
- [ ] Usage documented in CLAUDE.md
- [ ] Team notified of new capability

**Git**:
- [ ] Commit message: `chore(build): add bundle analyzer [TASK-004]`
- [ ] Branch: `task/004-bundle-analyzer`

---

## Rollback Plan

**If Something Goes Wrong**:
1. Remove rollup-plugin-visualizer from package.json
2. Remove visualizer config from quasar.config.js
3. Run `yarn install` to clean up

**Monitoring**:
- [ ] Verify builds still work
- [ ] Check for any Vite plugin conflicts

---

## CI/CD Integration (Optional - Nice to Have)

### GitHub Actions Bundle Size Tracking

```yaml
# .github/workflows/bundle-size.yml
name: Bundle Size Check

on: [pull_request]

jobs:
  check-size:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: yarn install

      - name: Build with analyzer
        run: |
          cd frontends/frontend-main
          ANALYZE=true yarn build

      - name: Upload bundle stats
        uses: actions/upload-artifact@v3
        with:
          name: bundle-stats
          path: frontends/frontend-main/dist/stats.html
```

**Note**: This is optional for Phase 1, can be added in Phase 5

---

## Expected Output

After running `ANALYZE=true yarn build`, you should see:

```
✓ building for production...
✓ analyzing bundle with visualizer...
Generated stats.html at dist/stats.html
Opening in browser...

dist/spa/index.html                    5.23 kB
dist/spa/assets/vendor-vue-[hash].js   150.45 kB │ gzip: 52.34 kB
dist/spa/assets/vendor-quasar-[hash].js 398.23 kB │ gzip: 125.67 kB
...
```

The stats.html will show:
- Interactive treemap of all chunks
- Size breakdown (parsed/gzip/brotli)
- Module hierarchy
- Ability to search for specific modules

---

## Success Metrics

- [ ] Analyzer installed and working
- [ ] Initial report generated successfully
- [ ] Team can use tool independently
- [ ] Bundle composition clearly visible

---

## Follow-up Tasks

After this task:
1. Use analyzer to verify TASK-003 (code splitting) effectiveness
2. Identify any unexpected large modules
3. Create follow-up tasks for optimization opportunities found

---

## Sign-off

**Implemented By**: -
**Reviewed By**: -
**Deployed**: -
**Verified In**: -

---

**Notes**: This is a quick win that provides huge value for ongoing optimization. The visual feedback makes it much easier to understand bundle composition and identify opportunities. Should be one of the first tasks completed.
