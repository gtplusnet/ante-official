# Broken Imports Report

This report documents all files with broken imports due to the refactoring of dialog components.

## Summary of Refactoring Pattern

1. **Dialogs moved from** `src/components/dialog/` **to**:
   - Page-specific dialogs: `src/pages/Member/*/dialogs/`
   - Asset dialogs: `src/pages/Member/Asset/dialogs/`
   - Manpower dialogs: `src/pages/Member/Manpower/dialogs/`
   - Treasury dialogs: `src/pages/Member/Treasury/dialogs/`
   - Settings dialogs: `src/pages/Member/Settings/dialogs/`

2. **Global components moved from** `src/components/globals/` **to** `src/components/shared/display/`

3. **Form components moved from** `src/components/form/` **to** `src/components/shared/form/`

4. **Loader components moved from** `src/components/loader/` **to** `src/components/shared/common/`

## Files with Broken Dialog Imports

### Table Components
1. **src/components/tables/AdvanceItemTable.vue**
   - `ItemCreateEditDialog` from `src/components/dialog/ItemCreateEditDialog/ItemCreateEditDialog.vue`
   - `ItemInformationDialog` from `src/components/dialog/ItemInformationDialog/ItemInformationDialog.vue`
   - `ItemAdvanceListDialog` from `src/components/dialog/ItemAdvanceListDialog.vue`

2. **src/components/tables/SimpleItemTable.vue**
   - `ItemCreateEditDialog` from `src/components/dialog/ItemCreateEditDialog/ItemCreateEditDialog.vue`
   - `ItemInformationDialog` from `src/components/dialog/ItemInformationDialog/ItemInformationDialog.vue`
   - `ItemAdvanceListDialog` from `src/components/dialog/ItemAdvanceListDialog.vue`

3. **src/components/tables/PurchaseOrderTable.vue**
   - `PurchaseOrderDialog` from `src/components/dialog/ItemTransactionsDialog/PurchaseOrderDialog.vue`
   - `ItemReceipt` from `src/components/dialog/ItemReceipt/ItemReceipt.vue`

4. **src/components/tables/ForReviewsTable.vue**
   - `ForReviewStartCollectionDialog` from `../dialog/ForReviewStartCollectionDialog.vue`

### Dashboard Components
1. **src/pages/Member/Dashboard/NotificationWidget/NotificationWidget.vue**
   - `TaskInformationDialog` from `src/components/dialog/TaskInformationDialog/TaskInformationDialog.vue`

2. **src/pages/Member/Dashboard/QuestWidget/Partials/QuestItemPartial/QuestItemPartial.vue**
   - `TaskInformationDialog` from `src/components/dialog/TaskInformationDialog/TaskInformationDialog.vue`

3. **src/pages/Member/Dashboard/TaskWidget/TaskWidget.vue**
   - `TaskInformationDialog` from `src/components/dialog/TaskInformationDialog/TaskInformationDialog.vue`
   - `TaskAccountSummaryDialog` from `src/components/dialog/TaskAccountSummaryDialog/TaskAccountSummaryDialog.vue`

### Treasury Components
1. **src/pages/Member/Treasury/TreasuryPettyCash.vue**
   - `PurchaseRequestDialog` from `src/components/dialog/ItemTransactionsDialog/PurchaseRequestDialog.vue`
   - `SupplierSelectionDialog` from `src/components/dialog/SupplierSelectionDialog.vue`

2. **src/pages/Member/Treasury/components/tables/TreasuryPettyCashListTable.vue**
   - `PurchaseOrderDialog` from `src/components/dialog/ItemTransactionsDialog/PurchaseOrderDialog.vue`
   - `ItemReceipt` from `src/components/dialog/ItemReceipt/ItemReceipt.vue`

3. **src/pages/Member/Treasury/dialogs/TreasuryFundAccountTransactionsDialog.vue**
   - `AddDeductMoneyDialog` from `src/components/dialog/AddDeductMoneyDialog.vue`

4. **src/pages/Member/Treasury/TreasuryPayables.vue**
   - `PurchaseRequestDialog` from `src/components/dialog/ItemTransactionsDialog/PurchaseRequestDialog.vue`
   - `SupplierSelectionDialog` from `src/components/dialog/SupplierSelectionDialog.vue`

### Manpower Components
1. **src/pages/Member/Manpower/Payroll/PayrollTimeKeepingMenuPage.vue**
   - `QueueDialog` from `src/components/dialog/QueueDialog/QueueDialog.vue`

2. **src/pages/Member/Manpower/Payroll/PayrollCenterPage/PayrollCenterTabMenu/PayrollCenterCards.vue**
   - `QueueStatusBadge` from `src/components/dialog/QueueDialog/QueueStatusBadge.vue`

3. **src/pages/Member/Manpower/components/tables/ManpowerTimekeepingTable.vue**
   - `QueueDialog` from `src/components/dialog/QueueDialog/QueueDialog.vue`

### Leads Components
1. **src/pages/Member/Leads/LeadsListView.vue**
   - `LeadCreateDialog` from `src/components/dialog/LeadCreateDialog.vue`

2. **src/pages/Member/Leads/LeadsGridView.vue**
   - `LeadCreateDialog` from `src/components/dialog/LeadCreateDialog.vue`

### Asset Components
1. **src/pages/Member/Asset/AssetItem.vue**
   - `ItemCreateEditDialog` from `src/components/dialog/ItemCreateEditDialog/ItemCreateEditDialog.vue`
   - `ItemInformationDialog` from `src/components/dialog/ItemInformationDialog/ItemInformationDialog.vue`
   - `ItemAdvanceListDialog` from `src/components/dialog/ItemAdvanceListDialog.vue`

2. **src/pages/Member/Asset/AssetPurchasing.vue**
   - `PurchaseRequestDialog` from `src/components/dialog/ItemTransactionsDialog/PurchaseRequestDialog.vue`
   - `PurchaseOrderDialog` from `src/components/dialog/ItemTransactionsDialog/PurchaseOrderDialog.vue`
   - `ItemReceipt` from `src/components/dialog/ItemReceipt/ItemReceipt.vue`
   - `SupplierSelectionDialog` from `src/components/dialog/SupplierSelectionDialog.vue`

3. **src/pages/Member/Asset/AssetDeliveries.vue**
   - `ItemCreateEditDialog` from `src/components/dialog/ItemCreateEditDialog/ItemCreateEditDialog.vue`
   - `ItemReceipt` from `src/components/dialog/ItemReceipt/ItemReceipt.vue`

4. **src/pages/Member/Asset/components/tables/AssetEquipmentJobOrderTable.vue**
   - `ItemReceiptDialog` from `src/components/dialog/ItemReceipt/ItemReceipt.vue`

5. **src/pages/Member/Asset/components/tables/AssetEquipmentPartsTable.vue**
   - `NextMaintenanceDateAdjustmentDialog` from `src/components/dialog/NextMaintenanceDateAdjustmentDialog.vue`

### Asset Dialog Components
1. **src/pages/Member/Asset/dialogs/AssetWarehouseInventoryTransactionsDialog.vue**
   - `ItemReceipt` from `src/components/dialog/ItemReceipt/ItemReceipt.vue`

2. **src/pages/Member/Asset/dialogs/AssetAddEditEquipmentItemsDialog.vue**
   - `ChooseItemDialog` from `src/components/dialog/ChooseItemDialog.vue`

3. **src/pages/Member/Asset/dialogs/AssetWarehouseTransactionsDialog.vue**
   - `RefillWriteOffInventoryDialog` from `src/components/dialog/ItemTransactionsDialog/RefillWriteOffInventoryDialog.vue`
   - `TransferStocksDialog` from `src/components/dialog/ItemTransactionsDialog/TransferStocksDialog.vue`
   - `ItemReceipt` from `src/components/dialog/ItemReceipt/ItemReceipt.vue`

4. **src/pages/Member/Asset/dialogs/AssetWarehouseInformationDialog.vue**
   - `RefillWriteOffInventoryDialog` from `src/components/dialog/ItemTransactionsDialog/RefillWriteOffInventoryDialog.vue`
   - `TransferStocksDialog` from `src/components/dialog/ItemTransactionsDialog/TransferStocksDialog.vue`
   - `ItemReceipt` from `src/components/dialog/ItemReceipt/ItemReceipt.vue`

5. **src/pages/Member/Asset/dialogs/AssetSupplierInformationDialog/SupplierInformationDialog.vue**
   - `SupplierPriceUpdateHistoryDialog` from `src/components/dialog/SupplierPriceUpdateHistoryDialog.vue`
   - `ItemReceipt` from `src/components/dialog/ItemReceipt/ItemReceipt.vue`

6. **src/pages/Member/Asset/dialogs/AssetCanvassDialog.vue**
   - `ItemInformationDialog` from `src/components/dialog/ItemInformationDialog/ItemInformationDialog.vue`
   - `SupplierPriceUpdateHistoryDialog` from `src/components/dialog/SupplierPriceUpdateHistoryDialog.vue`

7. **src/pages/Member/Asset/dialogs/AssetAddEditWarehouseDialog.vue**
   - `AddEditLocationDialog` from `src/components/dialog/AddEditLocationDialog.vue`

8. **src/pages/Member/Asset/dialogs/AssetWarehouseInventoryDialog.vue**
   - `RefillWriteOffInventoryDialog` from `src/components/dialog/ItemTransactionsDialog/RefillWriteOffInventoryDialog.vue`
   - `TransferStocksDialog` from `src/components/dialog/ItemTransactionsDialog/TransferStocksDialog.vue`

### Other Components with Relative Imports
1. **src/components/sidebar/Notification.vue**
   - `TaskInformationDialog` from `../dialog/TaskInformationDialog/TaskInformationDialog.vue`

2. **src/components/selection/ClientSelection.vue**
   - `AddEditClientDialog` from `../dialog/AddEditClientDialog.vue`

3. **src/components/selection/SupplierSelection.vue**
   - `AddEditSupplierDialog` from `../dialog/AddEditSupplierDialog.vue`

4. **src/components/selection/SelectionLocation.vue**
   - `AddEditLocationDialog` from `../dialog/AddEditLocationDialog.vue`

5. **src/components/selection/BrandSelection.vue**
   - `AddEditBrandDialog` from `../dialog/AddEditBrandDialog.vue`

6. **src/components/selection/ProjectSelection.vue**
   - `ProjectCreateDialog` from `../dialog/ProjectCreateDialog.vue`

7. **src/components/dialog/ProjectCreateDialog.vue**
   - `SelectionLocation` from `../selection/SelectionLocation.vue`

8. **src/components/dialog/AddEditClientDialog.vue**
   - `SelectionLocation` from `../selection/SelectionLocation.vue`

## Files with Broken Global/Form/Loader Imports

1. **src/components/upload/FileManager.vue**
   - `GTable` from `../globals/GTable.vue` → Should be `src/components/shared/display/GTable.vue`

## Dialogs That Need to be Moved

Based on the pattern, the following dialogs still in `src/components/dialog/` should likely be moved to their respective page-specific folders:

### Still in src/components/dialog/:
- AddDeductMoneyDialog.vue → Treasury dialogs
- AddEditBrandDialog.vue → Asset dialogs
- AddEditClientDialog.vue → Project/Client dialogs
- AddEditLocationDialog.vue → Settings/Configuration dialogs
- ChangePasswordDialog.vue → Settings dialogs
- ChooseItemDialog.vue → Asset dialogs
- ForReviewStartCollectionDialog.vue → Treasury dialogs
- ItemAdvanceListDialog.vue → Asset dialogs
- ItemCreateEditDialog/ → Asset dialogs
- ItemInformationDialog/ → Asset dialogs
- ItemReceipt/ → Asset dialogs
- ItemTransactionsDialog/ → Asset dialogs
- LeadCreateDialog.vue → Leads dialogs
- NextMaintenanceDateAdjustmentDialog.vue → Asset dialogs
- ProjectCreateDialog.vue → Project dialogs
- SupplierPriceUpdateHistoryDialog.vue → Asset dialogs
- SupplierSelectionDialog.vue → Asset dialogs
- TaskAccountSummaryDialog/ → Dashboard/Task dialogs
- TaskCreateDialog/ → Dashboard/Task dialogs
- TaskInformationDialog/ → Dashboard/Task dialogs
- TruckLoadDialog.vue → Asset/Delivery dialogs