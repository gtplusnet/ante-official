# Material Design 3 (MD3) Standards Guide

## Overview
This document defines the design standards for the ANTE ERP system using Material Design 3 (Flat Design). All UI components, dialogs, and interfaces must follow these guidelines to ensure consistency across the application.

## Core Design Principles

### 1. Material Design 3 - Flat Design System
- **No elevation shadows** - Use borders and color variations for depth
- **Flat surfaces** - No drop shadows or raised effects
- **Clean lines** - Simple, minimalist approach
- **Color-based hierarchy** - Use color and contrast for visual hierarchy

### 2. Never Use Material Design 2 Patterns
❌ **Avoid these MD2 patterns:**
- Elevated cards with shadows
- Floating Action Buttons (FABs) with elevation
- Raised buttons with shadow effects
- Deep elevation layers

✅ **Use these MD3 patterns instead:**
- Flat cards with borders
- Inline action buttons
- Flat buttons with color fills
- Surface containers with subtle backgrounds

## Component Standards

### Dialogs
All dialogs must follow the MD3 dense dialog pattern:

```vue
<template>
  <q-dialog v-model="show" class="md3-dialog-dense">
    <q-card style="width: 700px; max-width: 90vw">
      <!-- MD3 Dense Header -->
      <div class="md3-header-dense">
        <q-icon name="icon_name" size="20px" />
        <span class="md3-title">Dialog Title</span>
        <q-space />
        <q-btn flat round dense icon="close" size="sm" v-close-popup />
      </div>
      
      <!-- MD3 Dense Content with Wrapper -->
      <q-card-section class="md3-content-dense">
        <div class="md3-dialog-content-wrapper">
          <!-- Content goes here -->
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>
```

**Key Requirements:**
- Always use `md3-dialog-dense` class
- Include `md3-dialog-content-wrapper` for proper padding
- Use flat header design with icon and title
- No elevated shadows or floating effects

### Cards and Surfaces

```scss
// MD3 Card - Flat Design
.md3-card-dense {
  background-color: white;
  border: 1px solid var(--md3-outline-variant);
  border-radius: 8px;
  padding: 12px;
  // NO box-shadow or elevation
}

// MD3 Section - Surface Container
.md3-section-dense {
  background-color: var(--md3-surface-container-low);
  border-radius: 8px;
  padding: var(--md3-dense-padding);
  // Flat surface, no shadows
}
```

### Buttons

```vue
<!-- Primary Button - Flat with fill -->
<q-btn 
  flat 
  color="primary" 
  label="Action" 
/>

<!-- Secondary Button - Flat with outline -->
<q-btn 
  flat 
  outline 
  color="primary" 
  label="Action" 
/>

<!-- Text Button - Flat, no background -->
<q-btn 
  flat 
  color="primary" 
  label="Action" 
/>
```

**Never use:**
- `unelevated` prop (implies elevation exists)
- `raised` prop
- Box shadows on buttons
- Floating action buttons with elevation

### Tables

```scss
.md3-table-dense {
  width: 100%;
  border-collapse: collapse;
  
  thead {
    tr {
      border-bottom: 1px solid var(--md3-outline-variant);
      // Flat header, no shadows
    }
  }
  
  tbody {
    tr {
      border-bottom: 1px solid var(--md3-surface-container);
      
      &:hover {
        // Use background color for hover, not elevation
        background-color: var(--md3-surface-container-low);
      }
    }
  }
}
```

### Form Fields

```vue
<!-- MD3 Input Field - Flat Design -->
<q-input
  outlined
  dense
  v-model="value"
  label="Field Label"
  class="md3-field-dense"
/>
```

**Field styling:**
- Use outlined variant (flat border)
- No filled variant with elevation
- Dense spacing for compact layouts
- Flat focus states with color changes

## Color System

### MD3 Color Tokens
Define and use semantic color tokens:

```scss
:root {
  // Surface colors - Flat hierarchy
  --md3-surface: #FAFBFD;
  --md3-surface-container-low: #F5F6F8;
  --md3-surface-container: #EFF0F2;
  --md3-surface-container-high: #E8E9EB;
  
  // Text colors
  --md3-on-surface: #1B1C1E;
  --md3-on-surface-variant: #44474C;
  
  // Border colors - Used instead of shadows
  --md3-outline-variant: #C5C6CA;
  --md3-outline: #74777F;
  
  // Primary colors
  --md3-primary-container: #E1E7FF;
  --md3-on-primary-container: #001946;
}
```

**Usage Guidelines:**
- Use surface containers for depth, not shadows
- Use outline colors for borders and dividers
- Apply semantic colors consistently

## Spacing and Density

### Dense Layout System
Use consistent spacing for compact, efficient layouts:

```scss
:root {
  --md3-dense-padding: 12px;
  --md3-dense-gap: 8px;
  --md3-dense-field-height: 40px;
  --md3-dense-section-gap: 16px;
}
```

### Grid Layouts
Use responsive grid systems without elevation:

```scss
.md3-grid-dense {
  display: grid;
  gap: var(--md3-dense-gap);
  
  &.cols-2 { grid-template-columns: repeat(2, 1fr); }
  &.cols-3 { grid-template-columns: repeat(3, 1fr); }
  &.cols-4 { grid-template-columns: repeat(4, 1fr); }
}
```

## Typography

### Text Hierarchy
Use size and weight for hierarchy, not elevation:

```scss
.md3-title {
  font-size: 18px;
  font-weight: 500;
  color: var(--md3-on-surface);
}

.md3-section-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--md3-on-surface);
}

.md3-card-title {
  font-size: 13px;
  font-weight: 500;
  color: var(--md3-on-surface);
}

.text-dense-caption {
  font-size: 11px;
  color: var(--md3-on-surface-variant);
}
```

## Animation and Transitions

### Flat Transitions
Use subtle, flat transitions without elevation changes:

```scss
// Good - Color and scale transitions
.transition-flat {
  transition: background-color 0.2s, transform 0.2s;
  
  &:hover {
    background-color: var(--md3-surface-container);
    transform: scale(1.01); // Subtle scale, no elevation
  }
}

// Bad - Elevation transitions
.transition-elevated {
  transition: box-shadow 0.2s; // ❌ Avoid shadow transitions
  
  &:hover {
    box-shadow: 0 4px 8px rgba(0,0,0,0.1); // ❌ No shadows
  }
}
```

## Common Patterns

### Loading States
```vue
<div class="md3-loading-dense">
  <q-spinner-dots size="40px" color="primary" />
  <div class="loading-text">Loading...</div>
</div>
```

### Empty States
```vue
<div class="md3-empty-dense">
  <q-icon name="icon_name" />
  <div class="empty-title">No Data</div>
  <div class="empty-subtitle">Description text</div>
</div>
```

### Status Badges
```scss
.md3-badge-dense {
  display: inline-flex;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
  // Flat badges with background colors
  
  &.active {
    background-color: #D1F2D5;
    color: #072711;
  }
  
  &.inactive {
    background-color: #FFD9D6;
    color: #410E0B;
  }
}
```

## Implementation Checklist

When creating new components:

- [ ] Use flat design - no shadows or elevation
- [ ] Apply MD3 color tokens
- [ ] Use dense spacing variables
- [ ] Include proper content wrappers in dialogs
- [ ] Use borders for visual separation, not shadows
- [ ] Apply flat button styles
- [ ] Use surface containers for depth hierarchy
- [ ] Follow the typography scale
- [ ] Implement flat transitions
- [ ] Test responsive behavior

## Migration from MD2 to MD3

When updating existing components:

1. **Remove all box-shadows and elevation**
2. **Replace elevation with borders and surface colors**
3. **Update button styles to flat variants**
4. **Add content wrappers to dialogs**
5. **Replace FABs with inline actions**
6. **Update color usage to MD3 tokens**
7. **Apply dense spacing system**

## Common Mistakes to Avoid

❌ **DON'T:**
- Use `box-shadow` for depth
- Create floating elements with elevation
- Use Material Design 2 components
- Apply gradient shadows
- Use filled text fields with elevation
- Create raised cards

✅ **DO:**
- Use borders and background colors for depth
- Keep all elements flat on the surface
- Use Material Design 3 patterns exclusively
- Apply flat color variations
- Use outlined text fields
- Create flat cards with borders

## Testing Guidelines

Before marking any UI work as complete:

1. **Verify flat design** - No shadows or elevation visible
2. **Check color tokens** - All colors use MD3 variables
3. **Test responsiveness** - Grids and layouts adapt properly
4. **Validate spacing** - Dense spacing applied consistently
5. **Review transitions** - Only flat transitions used
6. **Confirm accessibility** - Sufficient color contrast maintained

## Resources

- [Material Design 3 Guidelines](https://m3.material.io/)
- [MD3 Color System](https://m3.material.io/styles/color/overview)
- [MD3 Components](https://m3.material.io/components)
- Internal: `/src/css/md3-variables.scss`
- Internal: `/src/pages/Member/Dashboard/MyEmploymentInformationWidget/dialogs/md3-dialog-styles.scss`

## Enforcement

This design system is mandatory for:
- All new components and features
- Any UI updates or refactoring
- Dialog implementations
- Form designs
- Table layouts
- Dashboard widgets

Non-compliance will require revision before code review approval.