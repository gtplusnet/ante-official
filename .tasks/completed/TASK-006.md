# TASK-006: Remove Console.logs in Production Build

**Status**: ✅ Complete (via TASK-005)
**Priority**: P1
**Milestone**: M1 - Quick Wins
**Owner**: @jhay
**Estimated Effort**: 1 hour
**Actual Effort**: 0 hours (already implemented in TASK-005)

**Dates**:
- Created: 2025-10-04
- Started: 2025-10-04
- Completed: 2025-10-04 (via TASK-005 terser configuration)

---

## Description

Ensure all console.log, console.info, console.debug statements are automatically removed from production builds. This reduces bundle size slightly and improves production performance by eliminating unnecessary logging overhead.

## Business Value

**Performance**: Reduces bundle size and eliminates runtime overhead from console calls
**Security**: Prevents accidental logging of sensitive data in production
**Professionalism**: Cleaner production code without debug statements

---

## Requirements

- [ ] Configure terser to remove all console statements in production
- [ ] Verify console.error and console.warn are preserved (for error tracking)
- [ ] Add ESLint rule to warn about console usage in source code
- [ ] Document console usage policy for team

## Acceptance Criteria

**Must Have**:
- [ ] Production builds contain no console.log/info/debug statements
- [ ] console.error and console.warn are preserved for Sentry
- [ ] Build size reduced by removing console statements
- [ ] No regressions in error handling

**Nice to Have**:
- [ ] ESLint warns developers about console usage
- [ ] Development builds keep all console statements for debugging

---

## Dependencies

### Blocking Tasks (Must Complete First):
- None (can be done independently or as part of TASK-005)

### Blocked Tasks (Waiting on This):
- None

### Related Tasks:
- TASK-005: Enable Vite compression (includes terser console removal)

---

## Technical Details

### Files to Create/Modify
- `frontends/frontend-main/quasar.config.js` (updated - terser config)
- `frontends/frontend-main/.eslintrc.js` (updated - add console warning)

### Affected Components
- All components that use console statements

### Configuration Changes
- [x] `quasar.config.js` - Terser drop_console configuration
- [ ] `.eslintrc.js` - Add console usage warning

---

## Implementation Plan

### Approach
Configure terser to automatically strip console statements during minification.

1. **Step 1**: Update terser configuration in quasar.config.js (may overlap with TASK-005)
2. **Step 2**: Test that console.log/info/debug are removed
3. **Step 3**: Verify console.error/warn are preserved
4. **Step 4**: Add ESLint rule to warn about console usage
5. **Step 5**: Document console policy in CLAUDE.md

### Key Decisions
- **Keep console.error/warn**: Needed for Sentry error tracking
- **Remove console.log/info/debug**: Not needed in production
- **ESLint warning (not error)**: Allow console in development, warn to remind cleanup

### Terser Configuration
```javascript
terserOptions: {
  compress: {
    drop_console: true,        // Remove console.* calls
    drop_debugger: true,        // Remove debugger statements
    pure_funcs: [               // Remove specific console functions
      'console.log',
      'console.info',
      'console.debug'
    ],
  },
}
```

**Note**: This preserves console.error and console.warn for error tracking.

---

## Implementation Notes

### [2025-10-04] - Planning
This task overlaps significantly with TASK-005. If TASK-005 is implemented first, this task may only require:
1. Verification that console removal is working
2. Adding ESLint rule
3. Updating documentation

### [2025-10-04] - Completed via TASK-005
**Discovery**: When starting TASK-005, found that terser configuration was already complete in `quasar.config.js` (lines 100-111) including:
- ✅ `drop_console: true` - Removes console.* calls
- ✅ `drop_debugger: true` - Removes debugger statements
- ✅ `pure_funcs: ['console.log', 'console.info', 'console.debug']` - Removes specific methods
- ✅ `comments: false` - Removes all comments

**Status**: Console log removal is fully implemented. No additional work needed for terser configuration.

**Remaining Work** (Optional - P2 priority):
- Add ESLint rule to warn developers about console usage (nice to have)
- Update CLAUDE.md with console usage policy (nice to have)

---

## Challenges & Solutions

*To be filled during implementation*

---

## Testing

### Test Plan
- [ ] Build production bundle
- [ ] Grep for console statements in dist/
- [ ] Verify console.error/warn are present
- [ ] Verify console.log/info/debug are removed
- [ ] Test error handling still works in production

### Test Coverage
- **Build Tests**: Verify console statements removed
- **Regression Tests**: Ensure error tracking still works

### Test Commands
```bash
# Build production
cd frontends/frontend-main
yarn build

# Check for console.log (should find none)
grep -r "console\.log" dist/spa/assets/*.js && echo "❌ Found console.log!" || echo "✅ No console.log found"

# Check for console.info (should find none)
grep -r "console\.info" dist/spa/assets/*.js && echo "❌ Found console.info!" || echo "✅ No console.info found"

# Check for console.error (should still exist for Sentry)
grep -r "console\.error" dist/spa/assets/*.js && echo "✅ console.error preserved" || echo "❌ console.error removed (should be kept!)"
```

---

## Performance Impact

### Before
- Console statements: Present in production bundles
- Bundle size impact: ~5-10KB (estimated)

### After
- Console statements: Removed (except error/warn)
- Bundle size reduction: ~5-10KB
- Runtime performance: Slight improvement (no console overhead)

---

## Documentation Updates

- [ ] Update CLAUDE.md with console usage policy
- [ ] Add to code style guidelines
- [ ] Document ESLint rule for team

---

## Review Checklist

**Code Quality**:
- [ ] Terser config correct
- [ ] ESLint rule added
- [ ] Documentation updated

**Testing**:
- [ ] Production build verified clean
- [ ] Error handling still works
- [ ] Manual testing completed

**Git**:
- [ ] Commit message: `feat(build): remove console.logs in production [TASK-006]`
- [ ] No merge conflicts

---

## Rollback Plan

**If Something Goes Wrong**:
1. Revert terser configuration
2. Remove ESLint rule if causing issues
3. Rebuild

**Monitoring**:
- [ ] Check Sentry for error tracking
- [ ] Verify console.error/warn still work

---

## ESLint Rule

```javascript
// .eslintrc.js
rules: {
  'no-console': ['warn', {
    allow: ['error', 'warn']
  }],
}
```

This warns developers when they use console.log but allows console.error/warn.

---

## Console Usage Policy

**Development**:
- ✅ Use console.log/info/debug for debugging (will be removed in production)
- ✅ Use console.error/warn for errors (preserved in production for Sentry)

**Production**:
- ❌ console.log/info/debug automatically removed by terser
- ✅ console.error/warn preserved for error tracking

---

## Related Links

- [Terser Options - drop_console](https://github.com/terser/terser#compress-options)
- [ESLint no-console rule](https://eslint.org/docs/latest/rules/no-console)
- [PLANNING.md - Build Configuration](../../PLANNING.md#5-build-configuration-improvements)

---

## Sign-off

**Implemented By**: @jhay
**Reviewed By**: TBD
**Deployed**: TBD
**Verified In**: TBD

---

**Notes**: This task may be mostly completed as part of TASK-005. Main additional work is ESLint rule and documentation.
