# Icon Library Strategy

**Last Updated**: 2025-10-05
**Related Task**: TASK-009

## Overview

This document defines the icon strategy for the Ante ERP frontend application.

## Current Setup

### Icon Library

- **Primary**: Material Icons (Google)
- **Variants Used**:
  - Material Icons (filled) - 85% of usage
  - Material Icons Outlined - 15% of usage

### Configuration

```javascript
// quasar.config.js
extras: [
  'roboto-font',              // Typography
  'material-icons',           // Filled variant (default)
  'material-icons-outlined',  // Outlined variant (prefix: o_)
]
```

### Usage Patterns

#### Filled Icons (Default)
```vue
<q-icon name="add" />
<q-btn icon="delete" />
```

#### Outlined Icons
```vue
<q-icon name="o_notifications" />
<q-btn icon="o_account_circle" />
```

## Bundle Size

| Component | Size | Format |
|-----------|------|--------|
| Material Icons (filled) | 292 KB | woff2 + woff |
| Material Icons Outlined | 332 KB | woff2 + woff |
| **Total** | **624 KB** | |

## Design Guidelines

### When to Use Filled vs. Outlined

**Filled Icons** (default):
- Primary actions
- Selected states
- High emphasis
- Navigation (active state)

**Outlined Icons**:
- Secondary actions
- Unselected states
- Low emphasis
- Navigation (inactive state)
- Header utilities (notifications, account)

### Icon Naming Convention

Material Icons use lowercase with underscores:
- ✅ `add`, `delete`, `settings`
- ✅ `o_notifications`, `o_account_circle`
- ❌ `Add`, `deleteIcon`, `Settings`

## Best Practices

### 1. Use Icon Components

```vue
<!-- Preferred -->
<q-icon name="add" />

<!-- Alternative for buttons -->
<q-btn icon="add" label="Add Item" />
```

### 2. Consistent Sizing

```vue
<!-- Small -->
<q-icon name="add" size="sm" />

<!-- Medium (default) -->
<q-icon name="add" />

<!-- Large -->
<q-icon name="add" size="lg" />

<!-- Custom -->
<q-icon name="add" size="32px" />
```

### 3. Accessibility

Always provide context for icon-only buttons:

```vue
<!-- Good -->
<q-btn icon="delete" aria-label="Delete item" />

<!-- Better -->
<q-btn icon="delete">
  <q-tooltip>Delete item</q-tooltip>
</q-btn>
```

## Icon Browser

Browse available icons at:
- [Material Icons](https://fonts.google.com/icons)
- [Quasar Icon Sets](https://quasar.dev/vue-components/icon#webfont-usage)

## Migration Notes

### Removed Libraries

- **FontAwesome v6** (Removed 2024)
  - Reason: Redundant with Material Icons
  - Impact: Reduced bundle by ~200KB
  - Migration: All icons converted to Material Icons

### Future Considerations

#### SVG Icons (Not Recommended Currently)

**Pros**:
- Tree-shakable (only bundle used icons)
- Better accessibility
- Crisp at all sizes

**Cons**:
- Requires enumerating all 872 icon usages
- More complex setup
- Estimated migration effort: 40+ hours

**Decision**: Stay with icon fonts until a major redesign

#### Font Format Optimization

**Opportunity**: Drop `.woff` format, keep only `.woff2`
**Savings**: ~344 KB (35% reduction)
**Risk**: Legacy browser support (IE11, Safari < 12)
**Status**: Under consideration

## Maintenance

### Adding New Icons

1. Search [Material Icons](https://fonts.google.com/icons)
2. Use icon name directly (e.g., `search`, `o_search`)
3. No installation required (icons are pre-loaded)

### Removing Unused Icons

Icon fonts include all icons by default. To optimize:
1. Consider SVG migration (major effort)
2. OR accept current bundle size (acceptable for web app)

## Performance

### Current Metrics

- **Bundle Size**: 624 KB (compressed to ~200 KB with gzip)
- **Load Time**: Async loaded, non-blocking
- **Cache**: Browser caches fonts indefinitely
- **First Paint**: Not blocking (icons render after fonts load)

### Optimization Applied

✅ Only 2 variants loaded (vs. 20+ available)
✅ FontAwesome removed
✅ No duplicate icon sets
✅ Efficient bundling via Quasar

## Troubleshooting

### Icons Not Displaying

1. **Check icon name**: Must match Material Icons exactly
2. **Check prefix**: Outlined icons need `o_` prefix
3. **Check browser**: Clear cache and reload
4. **Check config**: Verify `quasar.config.js` includes icon set

### Bundle Size Too Large

Current icon font size (624 KB) is acceptable for a full ERP system. If optimization is required:

1. **Immediate**: Enable gzip/brotli compression (reduces to ~200 KB)
2. **Short-term**: Drop `.woff` format (saves 344 KB)
3. **Long-term**: Migrate to SVG icons (requires significant effort)

## References

- [Material Design Icons](https://material.io/design/iconography)
- [Quasar Icon Documentation](https://quasar.dev/vue-components/icon)
- [TASK-009 Audit Report](./ICON-AUDIT.md)

---

**Maintained by**: Frontend Team
**Review Frequency**: Annually or when adding new icon libraries
