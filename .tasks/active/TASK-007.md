# TASK-007: Optimize Images to WebP Format

**Status**: Not Started
**Priority**: P1
**Milestone**: M1 - Quick Wins
**Owner**: @jhay
**Estimated Effort**: 3 hours
**Actual Effort**: TBD

**Dates**:
- Created: 2025-10-04
- Started: TBD
- Completed: TBD

---

## Description

Convert all PNG and JPEG images to modern WebP format for 30-50% file size reduction. Implement automatic WebP conversion during build process and add fallback support for older browsers.

## Business Value

**Performance**: 30-50% smaller image sizes lead to faster page loads
**Mobile Experience**: Significant bandwidth savings on mobile connections
**SEO**: Faster load times improve Lighthouse scores and search rankings

---

## Requirements

- [ ] Audit current images in src/assets/
- [ ] Convert existing PNG/JPEG to WebP
- [ ] Set up automatic WebP conversion in build process
- [ ] Add picture element with WebP + fallback
- [ ] Optimize image loading (lazy loading for below-fold images)

## Acceptance Criteria

**Must Have**:
- [ ] All images in src/assets/ converted to WebP
- [ ] Total image size reduced by 30%+
- [ ] Fallback support for older browsers
- [ ] No broken images on any page
- [ ] Lazy loading implemented for below-fold images

**Nice to Have**:
- [ ] Image size reduced by 50%+
- [ ] Automatic WebP conversion on upload
- [ ] Responsive images for different screen sizes

---

## Dependencies

### Blocking Tasks (Must Complete First):
- None (independent optimization)

### Blocked Tasks (Waiting on This):
- None

### Related Tasks:
- Future: Implement CDN for image delivery

---

## Technical Details

### Files to Create/Modify
- `frontends/frontend-main/src/assets/` (convert images)
- `frontends/frontend-main/quasar.config.js` (add image optimization plugin)
- Image components (update to use picture element)

### Affected Components
- Any component using images from assets/
- Logo components
- Background images
- Icons (if using PNG/JPEG instead of SVG)

### Configuration Changes
- [ ] `quasar.config.js` - Add vite-plugin-imagemin or similar
- [ ] Package.json - Add image optimization dependencies

---

## Implementation Plan

### Approach
Two-phase approach: Manual conversion + automated build-time optimization

1. **Step 1**: Audit - Find all images in src/assets/
2. **Step 2**: Manual conversion - Convert existing images to WebP
3. **Step 3**: Update components - Use picture element with WebP + fallback
4. **Step 4**: Build automation - Add vite-plugin-imagemin
5. **Step 5**: Lazy loading - Implement Intersection Observer for below-fold images
6. **Step 6**: Test - Verify all images load correctly

### Key Decisions
- **WebP with fallback**: Use picture element for maximum compatibility
- **Manual + automated**: Convert existing manually, automate future images
- **Keep originals**: Store originals in separate folder for backup
- **Lazy loading**: Use native loading="lazy" attribute

### Image Optimization Tools
```bash
# Install dependencies
yarn add -D vite-plugin-imagemin imagemin-webp

# Or use command-line tool for batch conversion
yarn add -D @squoosh/cli
npx @squoosh/cli --webp auto src/assets/**/*.{png,jpg,jpeg}
```

### Picture Element Pattern
```vue
<picture>
  <source srcset="image.webp" type="image/webp">
  <img src="image.png" alt="Description" loading="lazy">
</picture>
```

---

## Implementation Notes

### [2025-10-04] - Planning
Based on PLANNING.md recommendations:
- WebP offers 30-50% size reduction vs PNG/JPEG
- Modern browsers support WebP (97%+ coverage)
- Fallback needed for Safari < 14 (small percentage)

---

## Challenges & Solutions

### Challenge 1: Browser Support
**Solution**: Use picture element with WebP source + PNG/JPEG fallback

### Challenge 2: Large Number of Images
**Solution**: Use CLI tool for batch conversion, then automate in build

### Challenge 3: Dynamic Images (User Uploads)
**Solution**: Backend should handle conversion (future task, not in this scope)

---

## Testing

### Test Plan
- [ ] Audit all images in src/assets/
- [ ] Convert images to WebP
- [ ] Verify images display correctly in Chrome, Firefox, Safari
- [ ] Test lazy loading on long pages
- [ ] Measure before/after sizes
- [ ] Check Lighthouse score improvement

### Test Coverage
- **Visual Tests**: All pages with images checked
- **Browser Tests**: Chrome, Firefox, Safari, Edge
- **Performance Tests**: Image load times, Lighthouse score

### Test Commands
```bash
# Find all images
find src/assets -type f \( -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" \)

# Check image sizes before
du -sh src/assets/**/*.{png,jpg,jpeg} | awk '{sum+=$1} END {print sum}'

# Convert to WebP (example with squoosh)
npx @squoosh/cli --webp auto src/assets/**/*.{png,jpg,jpeg}

# Check image sizes after
du -sh src/assets/**/*.webp | awk '{sum+=$1} END {print sum}'

# Run Lighthouse
lighthouse http://localhost:9000 --view
```

---

## Performance Impact

### Before
- Total image size: TBD (to measure)
- Image load time: TBD
- Lighthouse Performance: ~50

### After
- Total image size: 30-50% reduction
- Image load time: 30-50% faster
- Lighthouse Performance: +5-10 points

---

## Documentation Updates

- [ ] Document image optimization process in CLAUDE.md
- [ ] Update developer guidelines for image usage
- [ ] Document picture element pattern for team

---

## Review Checklist

**Code Quality**:
- [ ] All images converted successfully
- [ ] No broken images
- [ ] Picture elements implemented correctly
- [ ] Lazy loading working

**Testing**:
- [ ] Visual regression tests passed
- [ ] Cross-browser testing completed
- [ ] Performance improved

**Performance**:
- [ ] Image sizes reduced by 30%+
- [ ] Lazy loading verified
- [ ] Lighthouse score improved

**Git**:
- [ ] Commit message: `feat(assets): optimize images to WebP format [TASK-007]`
- [ ] Consider splitting commits (conversion + implementation)
- [ ] No merge conflicts

---

## Rollback Plan

**If Something Goes Wrong**:
1. Keep original PNG/JPEG as backup
2. Revert to original images if WebP causes issues
3. Remove picture elements if causing layout issues

**Monitoring**:
- [ ] Check for broken images on all pages
- [ ] Monitor Lighthouse scores
- [ ] Check browser console for image load errors

---

## Image Optimization Checklist

**Audit Phase**:
- [ ] List all images in src/assets/
- [ ] Measure total size (before)
- [ ] Identify candidates for SVG (icons, logos)

**Conversion Phase**:
- [ ] Backup originals to backup/ folder
- [ ] Convert to WebP with quality 80-85
- [ ] Verify visual quality acceptable
- [ ] Measure total size (after)

**Implementation Phase**:
- [ ] Update components to use picture element
- [ ] Add lazy loading to below-fold images
- [ ] Configure build-time optimization
- [ ] Test all pages

---

## WebP Conversion Quality Settings

```javascript
// vite.config.js (via quasar.config.js)
import viteImagemin from 'vite-plugin-imagemin'

export default {
  plugins: [
    viteImagemin({
      webp: {
        quality: 85, // 80-90 recommended
      },
      optipng: {
        optimizationLevel: 7,
      },
      mozjpeg: {
        quality: 85,
      },
    }),
  ],
}
```

---

## Related Links

- [WebP Documentation](https://developers.google.com/speed/webp)
- [vite-plugin-imagemin](https://github.com/vbenjs/vite-plugin-imagemin)
- [Squoosh CLI](https://github.com/GoogleChromeLabs/squoosh/tree/dev/cli)
- [PLANNING.md - Quick Wins](../../PLANNING.md#10-immediate-quick-wins)
- [MDN - Picture Element](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/picture)

---

## Sign-off

**Implemented By**: @jhay
**Reviewed By**: TBD
**Deployed**: TBD
**Verified In**: TBD

---

**Notes**: Start with audit to understand current state. Consider doing conversion in batches (by folder) to track progress. Keep originals as backup. This is a relatively safe optimization with high visual impact.
