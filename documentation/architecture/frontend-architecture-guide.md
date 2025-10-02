# Frontend Architecture Guide

## Overview

This document outlines the modular architecture implemented in the frontend application. The architecture follows a domain-driven design approach where each feature module contains its own components, dialogs, and related resources.

## Directory Structure

```
frontend/src/
├── components/
│   └── shared/              # Only truly reusable components
│       ├── form/           # Reusable form components
│       │   ├── GInput.vue
│       │   └── GSelect.vue
│       ├── display/        # Reusable display components
│       │   ├── GCard.vue
│       │   ├── GTable.vue
│       │   ├── AmountView.vue
│       │   ├── TimeView.vue
│       │   └── TimeViewRaw.vue
│       └── common/         # Common utilities
│           ├── GlobalLoader.vue
│           └── EditableSpan.vue
├── pages/
│   └── Member/
│       ├── Asset/          # Asset Management Module
│       ├── Treasury/       # Financial Management Module
│       ├── Manpower/       # HR Management Module
│       ├── Settings/       # System Settings Module
│       ├── Dashboard/      # Dashboard Module
│       ├── Project/        # Project Management Module
│       ├── Calendar/       # Calendar Module
│       ├── Leads/          # Lead Management Module
│       └── Developer/      # Developer Tools Module
```

## Module Structure

Each module follows a consistent structure:

```
ModuleName/
├── components/             # Module-specific components
│   ├── tables/            # Data tables
│   └── selections/        # Selection components
├── dialogs/               # Module-specific dialogs
│   └── [subdirectories]   # Grouped by feature if needed
├── stores/                # Module-specific state (if applicable)
├── composables/           # Module-specific composables (if applicable)
└── [PageFiles].vue        # Page components
```

## Naming Conventions

### Component Naming Rules

1. **Shared Components**: Prefix with `G` (Global)
   - Examples: `GTable`, `GCard`, `GInput`, `GSelect`

2. **Module Components**: Prefix with module name
   - Examples: `AssetEquipmentTable`, `ManpowerEmployeeDialog`, `TreasuryCollectionTable`

3. **Component Types**:
   - **Dialogs**: Always suffix with `Dialog`
     - Example: `AssetAddEditEquipmentDialog.vue`
   - **Tables**: Always suffix with `Table`
     - Example: `ManpowerEmployeeListTable.vue`
   - **Selections**: Always suffix with `Selection`
     - Example: `AssetWarehouseSelection.vue`

4. **Action Prefixes for Dialogs**:
   - `AddEdit*` - Combined add/edit functionality
   - `Create*` - Creation only
   - `View*` - Read-only viewing
   - `*Information` - Detailed information display

### Directory Naming

- Use lowercase with hyphens for multi-word directories
- Module subdirectories: `components/`, `dialogs/`, `composables/`, `stores/`

## Module Examples

### Asset Module
```
Asset/
├── components/
│   ├── tables/
│   │   ├── AssetEquipmentTable.vue
│   │   ├── AssetEquipmentPartsTable.vue
│   │   └── AssetEquipmentJobOrderTable.vue
│   └── selections/
│       └── AssetWarehouseSelection.vue
├── dialogs/
│   ├── AssetAddEditEquipmentDialog.vue
│   ├── AssetCanvassDialog.vue
│   └── AssetWarehouseInformationDialog.vue
└── [Page components]
```

### Treasury Module
```
Treasury/
├── components/
│   └── tables/
│       ├── TreasuryCollectionByProjectTable.vue
│       ├── TreasuryRequestPaymentTable.vue
│       └── TreasuryPettyCashListTable.vue
├── dialogs/
│   ├── TreasuryCreateRequestForPaymentDialog.vue
│   ├── TreasuryApprovePaymentDialog.vue
│   └── TreasuryLiquidationFormDialog.vue
└── [Page components]
```

### Manpower Module
```
Manpower/
├── components/
│   ├── tables/
│   │   ├── ManpowerEmployeeListTable.vue
│   │   └── ManpowerTimekeepingTable.vue
│   └── selections/
│       └── ManpowerEmployeeSelection.vue
├── dialogs/
│   ├── payroll/
│   │   ├── ManpowerPayrollCenterDialog.vue
│   │   └── ManpowerPayrollSummaryDialog.vue
│   ├── configuration/
│   │   ├── ManpowerAddEditAllowanceDialog.vue
│   │   └── ManpowerAddEditDeductionDialog.vue
│   └── hris/
│       └── ManpowerAddEditHRISEmployeeDialog.vue
└── [Page components]
```

### Settings Module
```
Settings/
├── components/
│   └── tables/
│       └── SettingsUserTable.vue
├── dialogs/
│   ├── SettingsUserCreateEditDialog.vue
│   ├── SettingsRoleCreateEditDialog.vue
│   └── SettingsRoleGroupCreateEditDialog.vue
└── [Page components]
```

## Import Patterns

### Using Path Aliases (Recommended)
Configure in `tsconfig.json`:
```json
{
  "compilerOptions": {
    "paths": {
      "@shared/*": ["src/components/shared/*"],
      "@asset/*": ["src/pages/Member/Asset/*"],
      "@treasury/*": ["src/pages/Member/Treasury/*"],
      "@manpower/*": ["src/pages/Member/Manpower/*"],
      "@settings/*": ["src/pages/Member/Settings/*"]
    }
  }
}
```

### Import Examples
```typescript
// Importing shared components
import GTable from '@shared/display/GTable.vue'
import GInput from '@shared/form/GInput.vue'

// Importing module components
import AssetEquipmentTable from '@asset/components/tables/AssetEquipmentTable.vue'
import ManpowerEmployeeDialog from '@manpower/dialogs/ManpowerEmployeeDialog.vue'
```

## Guidelines for Developers

### When to Create Shared Components

A component should be in `/components/shared/` when:
- It's used by 3 or more different modules
- It's a generic UI component with no business logic
- It's a utility component (loader, formatters, etc.)

### When to Create Module Components

A component should be module-specific when:
- It contains business logic specific to that module
- It's only used within that module
- It has dependencies on module-specific APIs or stores

### Adding New Modules

1. Create the module directory under `/pages/Member/`
2. Add subdirectories: `components/`, `dialogs/`
3. Follow the naming conventions for all components
4. Update path aliases in `tsconfig.json`
5. Document the module structure

### Migrating Existing Components

When moving components to the new structure:
1. Add the module prefix to the component name
2. Update all import statements
3. Move related SCSS files alongside Vue files
4. Update any dynamic imports or lazy loading
5. Test thoroughly to ensure no broken references

## Benefits

1. **Clear Module Boundaries**: Each module owns its components
2. **Better Code Organization**: Easy to locate module-specific code
3. **Improved Maintainability**: Changes isolated to modules
4. **Consistent Naming**: Clear component ownership
5. **Scalability**: New modules follow established patterns
6. **Reduced Bundle Size**: Module-specific code can be lazy loaded

## Migration Status

- ✅ Shared components reorganized
- ✅ Asset module components migrated
- ✅ Treasury module components migrated
- ✅ Manpower module components migrated
- ✅ Settings module components migrated
- ⏳ Import statements update in progress
- ⏳ Path aliases configuration pending

## Future Improvements

1. Implement lazy loading for module routes
2. Add module-specific stores using Pinia
3. Create module-specific composables
4. Add automated tests for module boundaries
5. Implement ESLint rules to enforce architecture