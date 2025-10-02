# Import Fix Mapping

## Dialog Import Mappings

### Item-related Dialogs (likely moved to Asset)
- `src/components/dialog/ItemCreateEditDialog/ItemCreateEditDialog.vue` → Keep in place (still exists)
- `src/components/dialog/ItemInformationDialog/ItemInformationDialog.vue` → Keep in place (still exists)
- `src/components/dialog/ItemAdvanceListDialog.vue` → Keep in place (still exists)
- `src/components/dialog/ItemReceipt/ItemReceipt.vue` → Keep in place (still exists)
- `src/components/dialog/ItemTransactionsDialog/PurchaseOrderDialog.vue` → Keep in place (still exists)
- `src/components/dialog/ItemTransactionsDialog/PurchaseRequestDialog.vue` → Keep in place (still exists)
- `src/components/dialog/ItemTransactionsDialog/RefillWriteOffInventoryDialog.vue` → Keep in place (still exists)
- `src/components/dialog/ItemTransactionsDialog/TransferStocksDialog.vue` → Keep in place (still exists)

### Task-related Dialogs
- `src/components/dialog/TaskInformationDialog/TaskInformationDialog.vue` → Keep in place (still exists)
- `src/components/dialog/TaskAccountSummaryDialog/TaskAccountSummaryDialog.vue` → Keep in place (still exists)

### Queue-related Dialogs
- `src/components/dialog/QueueDialog/QueueDialog.vue` → Keep in place (still exists)
- `src/components/dialog/QueueDialog/QueueStatusBadge.vue` → Keep in place (still exists)

### Other Dialogs (still in place)
- `src/components/dialog/AddDeductMoneyDialog.vue` → Keep in place (still exists)
- `src/components/dialog/SupplierSelectionDialog.vue` → Keep in place (still exists)
- `src/components/dialog/LeadCreateDialog.vue` → Keep in place (still exists)
- `src/components/dialog/ChooseItemDialog.vue` → Keep in place (still exists)
- `src/components/dialog/NextMaintenanceDateAdjustmentDialog.vue` → Keep in place (still exists)
- `src/components/dialog/SupplierPriceUpdateHistoryDialog.vue` → Keep in place (still exists)
- `src/components/dialog/ForReviewStartCollectionDialog.vue` → Keep in place (still exists)
- `src/components/dialog/AddEditLocationDialog.vue` → Keep in place (still exists)
- `src/components/dialog/AddEditBrandDialog.vue` → Keep in place (still exists)
- `src/components/dialog/AddEditClientDialog.vue` → Keep in place (still exists)
- `src/components/dialog/ProjectCreateDialog.vue` → Keep in place (still exists)

## Global Component Mappings

### Display Components
- `../globals/GTable.vue` → `src/components/shared/display/GTable.vue`
- `../globals/GCard.vue` → `src/components/shared/display/GCard.vue`
- `../globals/AmountView.vue` → `src/components/shared/display/AmountView.vue`
- `../globals/TableBadges.vue` → `src/components/shared/display/TableBadges.vue`
- `../globals/TablePercentage.vue` → `src/components/shared/display/TablePercentage.vue`
- `../globals/TimeView.vue` → `src/components/shared/display/TimeView.vue`
- `../globals/TimeViewRaw.vue` → `src/components/shared/display/TimeViewRaw.vue`

### Form Components
- `../form/GInput.vue` → `src/components/shared/form/GInput.vue`
- `../form/GSelect.vue` → `src/components/shared/form/GSelect.vue`

### Common Components
- `../loader/GlobalLoader.vue` → `src/components/shared/common/GlobalLoader.vue`
- `../globals/EditableSpan.vue` → `src/components/shared/common/EditableSpan.vue`

## Relative Import Fix Patterns

### For files in src/components/selection/
- `../dialog/AddEditClientDialog.vue` → Keep as is (dialog still exists)
- `../dialog/AddEditSupplierDialog.vue` → Need to check if moved
- `../dialog/AddEditLocationDialog.vue` → Keep as is (dialog still exists)
- `../dialog/AddEditBrandDialog.vue` → Keep as is (dialog still exists)
- `../dialog/ProjectCreateDialog.vue` → Keep as is (dialog still exists)

### For files in src/components/dialog/
- `../selection/SelectionLocation.vue` → Keep as is (selection components not moved)

### For src/components/sidebar/Notification.vue
- `../dialog/TaskInformationDialog/TaskInformationDialog.vue` → Keep as is (dialog still exists)

### For src/components/upload/FileManager.vue
- `../globals/GTable.vue` → `../shared/display/GTable.vue`

## Deleted Dialogs That Were Moved

Based on the git status, these dialogs were deleted and likely moved to page-specific locations:

### Moved to Asset dialogs
- `AddEditEquipmentDialog.vue` → `src/pages/Member/Asset/dialogs/AssetAddEditEquipmentDialog.vue`
- `AddEditEquipmentItemsDialog.vue` → `src/pages/Member/Asset/dialogs/AssetAddEditEquipmentItemsDialog.vue`
- `AddEditEquipmentParts.vue` → `src/pages/Member/Asset/dialogs/AssetAddEditEquipmentParts.vue`
- `AddEditEquipmentPartsDialog.vue` → `src/pages/Member/Asset/dialogs/AssetAddEditEquipmentPartsDialog.vue`
- `AddEditSupplierDialog.vue` → `src/pages/Member/Asset/dialogs/AssetAddEditSupplierDialog.vue`
- `AddEditWarehouseDialog.vue` → `src/pages/Member/Asset/dialogs/AssetAddEditWarehouseDialog.vue`
- `CanvassDialog.vue` → `src/pages/Member/Asset/dialogs/AssetCanvassDialog.vue`
- `CanvassSelectSupplierDialog.vue` → `src/pages/Member/Asset/dialogs/AssetCanvassSelectSupplierDialog.vue`
- `EquipmentPartsMaintenanceDialog.vue` → `src/pages/Member/Asset/dialogs/AssetEquipmentPartsMaintenanceDialog.vue`
- `SupplierInformationDialog/` → `src/pages/Member/Asset/dialogs/AssetSupplierInformationDialog/`
- `WarehouseInformationDialog/` → `src/pages/Member/Asset/dialogs/AssetWarehouseInformationDialog.vue`
- `WarehouseInventoryDialog.vue` → `src/pages/Member/Asset/dialogs/AssetWarehouseInventoryDialog.vue`
- `WarehouseInventoryTransactionsDialog.vue` → `src/pages/Member/Asset/dialogs/AssetWarehouseInventoryTransactionsDialog.vue`
- `WarehouseTrasactionsDialog.vue` → `src/pages/Member/Asset/dialogs/AssetWarehouseTransactionsDialog.vue`

### Moved to Settings dialogs
- `AddEditUserLevelDialog.vue` → `src/pages/Member/Settings/dialogs/SettingsAddEditUserLevelDialog.vue`
- `CreateEditRoleDialog.vue` → `src/pages/Member/Settings/dialogs/SettingsCreateEditRoleDialog.vue`
- `RoleCreateEditDialog.vue` → `src/pages/Member/Settings/dialogs/SettingsRoleCreateEditDialog.vue`
- `RoleEmployeeListDialog.vue` → `src/pages/Member/Settings/dialogs/SettingsRoleEmployeeListDialog.vue`
- `RoleGroupCreateEditDialog.vue` → `src/pages/Member/Settings/dialogs/SettingsRoleGroupCreateEditDialog.vue`
- `RoleGroupViewDialog.vue` → `src/pages/Member/Settings/dialogs/SettingsRoleGroupViewDialog.vue`
- `RoleTreeDialog.vue` → `src/pages/Member/Settings/dialogs/SettingsRoleTreeDialog.vue`
- `UserCreateEditDialog/` → `src/pages/Member/Settings/dialogs/SettingsUserCreateEditDialog.vue`
- `UserSelectionDialog.vue` → `src/pages/Member/Settings/dialogs/SettingsUserSelectionDialog.vue`
- `UserTreeDialog.vue` → `src/pages/Member/Settings/dialogs/SettingsUserTreeDialog.vue`

### Moved to Manpower dialogs
- `AllowanceDialog/` → `src/pages/Member/Manpower/dialogs/configuration/`
- `DeductionDialog/` → `src/pages/Member/Manpower/dialogs/configuration/`
- `CutOffManagementDialog/` → `src/pages/Member/Manpower/dialogs/configuration/`
- `HolidayDialog/` → `src/pages/Member/Manpower/dialogs/configuration/`
- `PayrollGroupDialog/` → `src/pages/Member/Manpower/dialogs/configuration/`
- `ScheduleManagementDialog/` → `src/pages/Member/Manpower/dialogs/configuration/`
- `ShiftManagementDialog/` → `src/pages/Member/Manpower/dialogs/configuration/`
- `BranchManagementDialog/` → `src/pages/Member/Manpower/dialogs/configuration/`
- `RequestPanelDialog/` → `src/pages/Member/Manpower/dialogs/`
- `PayrollCenterDialog/` → `src/pages/Member/Manpower/dialogs/payroll/`

### Moved to Treasury dialogs
- `CreateRequestForPaymentDialog.vue` → `src/pages/Member/Treasury/dialogs/TreasuryCreateRequestForPaymentDialog.vue`
- `FundAccountTransactionsDialog.vue` → `src/pages/Member/Treasury/dialogs/TreasuryFundAccountTransactionsDialog.vue`
- `AddEditFundAccountDialog.vue` → Deleted (check if moved to Treasury dialogs)
- `LiquidationFormDialog.vue` → Deleted (check if moved to Treasury dialogs)
- `PurchaseOrderPaymentDialog.vue` → Deleted (check if moved to Treasury dialogs)
- `RFP/` → Deleted (check if moved to Treasury dialogs)