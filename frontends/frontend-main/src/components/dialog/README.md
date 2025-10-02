# Dialog Components Naming Conventions

This directory contains all dialog/modal components for the application. Please follow these naming conventions when creating or modifying dialogs:

## Naming Patterns

### 1. File Naming
- All dialog components must end with `Dialog.vue`
- Use PascalCase for file names
- Examples:
  - `UserCreateDialog.vue` ✓
  - `AddEditBrandDialog.vue` ✓
  - `UserModal.vue` ✗ (should be `UserDialog.vue`)

### 2. Action Prefixes
Use consistent action prefixes based on the dialog's purpose:

- **`AddEdit*Dialog`** - For dialogs that handle both creation and editing
  - Example: `AddEditClientDialog.vue`
- **`Create*Dialog`** - For creation-only dialogs
  - Example: `CreateDeductionDialog.vue`
- **`View*Dialog`** - For read-only viewing dialogs
  - Example: `ViewBranchDialog.vue`
- **`*Dialog`** - For general purpose dialogs (no action prefix)
  - Example: `ChangePasswordDialog.vue`, `AiChatDialog.vue`

### 3. Component Organization

#### Feature-based Subdirectories
Related dialogs should be grouped in subdirectories by feature/module:

```
dialog/
├── AllowanceDialog/          # Allowance-related dialogs
├── BillOfQuantity/          # Bill of Quantity dialogs
├── BranchManagementDialog/  # Branch management dialogs
├── DeductionDialog/         # Deduction-related dialogs
├── Equipment/               # Equipment-related dialogs
├── PayrollCenterDialog/     # Payroll center dialogs
├── Role/                    # Role management dialogs
└── ...
```

#### Subdirectory Naming
- Use feature/module name + "Dialog" suffix for subdirectories
- Exception: Short, clear feature names can omit "Dialog" (e.g., `Role/`, `Equipment/`)

### 4. Style Files
- SCSS files should have the same name as their corresponding Vue file
- Example: `BillOfQuantityDialog.vue` → `BillOfQuantityDialog.scss`

## Best Practices

1. **Consistency**: Maintain consistent naming patterns across all dialogs
2. **Clarity**: Dialog names should clearly indicate their purpose
3. **Organization**: Group related dialogs in subdirectories
4. **No Non-Dialog Files**: Only dialog components should be in this directory

## Examples of Correct Naming

✓ `AddEditUserDialog.vue` - Combined add/edit functionality
✓ `ViewScheduleDialog.vue` - Read-only viewing
✓ `CreateProjectDialog.vue` - Creation only
✓ `ChangePasswordDialog.vue` - General purpose (no action prefix)

## Examples of Incorrect Naming

✗ `VIewScheduleDialog.vue` - Typo in "View"
✗ `BillOfQuantityExportation.vue` - Missing "Dialog" suffix
✗ `EditableCell.vue` - Not a dialog component
✗ `user-dialog.vue` - Should use PascalCase