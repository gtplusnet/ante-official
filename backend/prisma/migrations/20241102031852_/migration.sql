-- DropForeignKey
ALTER TABLE "Account" DROP CONSTRAINT "Account_parentAccountId_fkey";

-- DropForeignKey
ALTER TABLE "AccountNotifications" DROP CONSTRAINT "AccountNotifications_notificationsId_fkey";

-- DropForeignKey
ALTER TABLE "AccountNotifications" DROP CONSTRAINT "AccountNotifications_projectId_fkey";

-- DropForeignKey
ALTER TABLE "AccountNotifications" DROP CONSTRAINT "AccountNotifications_receiverId_fkey";

-- DropForeignKey
ALTER TABLE "AccountNotifications" DROP CONSTRAINT "AccountNotifications_senderId_fkey";

-- DropForeignKey
ALTER TABLE "BillOfQuantity" DROP CONSTRAINT "BillOfQuantity_createdById_fkey";

-- DropForeignKey
ALTER TABLE "BillOfQuantity" DROP CONSTRAINT "BillOfQuantity_projectId_fkey";

-- DropForeignKey
ALTER TABLE "BillOfQuantity" DROP CONSTRAINT "BillOfQuantity_updatedById_fkey";

-- DropForeignKey
ALTER TABLE "BillOfQuantityTable" DROP CONSTRAINT "BillOfQuantityTable_itemId_fkey";

-- DropForeignKey
ALTER TABLE "Client" DROP CONSTRAINT "Client_locationId_fkey";

-- DropForeignKey
ALTER TABLE "Collaborators" DROP CONSTRAINT "Collaborators_accountId_fkey";

-- DropForeignKey
ALTER TABLE "Collaborators" DROP CONSTRAINT "Collaborators_taskId_fkey";

-- DropForeignKey
ALTER TABLE "Delivery" DROP CONSTRAINT "Delivery_deliveredDeliveryReceiptId_fkey";

-- DropForeignKey
ALTER TABLE "Delivery" DROP CONSTRAINT "Delivery_fromWarehouseId_fkey";

-- DropForeignKey
ALTER TABLE "Delivery" DROP CONSTRAINT "Delivery_inTransitDeliveryReceiptId_fkey";

-- DropForeignKey
ALTER TABLE "Delivery" DROP CONSTRAINT "Delivery_inTransitWarehouseId_fkey";

-- DropForeignKey
ALTER TABLE "Delivery" DROP CONSTRAINT "Delivery_pickUpLocationId_fkey";

-- DropForeignKey
ALTER TABLE "Delivery" DROP CONSTRAINT "Delivery_sourceDeliveryReceiptId_fkey";

-- DropForeignKey
ALTER TABLE "Delivery" DROP CONSTRAINT "Delivery_toWarehouseId_fkey";

-- DropForeignKey
ALTER TABLE "DeliveryReceive" DROP CONSTRAINT "DeliveryReceive_deliveryId_fkey";

-- DropForeignKey
ALTER TABLE "DeliveryReceive" DROP CONSTRAINT "DeliveryReceive_itemReceiptId_fkey";

-- DropForeignKey
ALTER TABLE "EquipmentModel" DROP CONSTRAINT "EquipmentModel_driverId_fkey";

-- DropForeignKey
ALTER TABLE "EquipmentModel" DROP CONSTRAINT "EquipmentModel_equipmentId_fkey";

-- DropForeignKey
ALTER TABLE "EquipmentModel" DROP CONSTRAINT "EquipmentModel_locationId_fkey";

-- DropForeignKey
ALTER TABLE "EquipmentModelMaintenanceHistory" DROP CONSTRAINT "EquipmentModelMaintenanceHistory_equipmentMaintenanceHisto_fkey";

-- DropForeignKey
ALTER TABLE "EquipmentModelMaintenanceHistory" DROP CONSTRAINT "EquipmentModelMaintenanceHistory_equipmentModelId_fkey";

-- DropForeignKey
ALTER TABLE "FundTransaction" DROP CONSTRAINT "FundTransaction_fundAccountId_fkey";

-- DropForeignKey
ALTER TABLE "InventoryItem" DROP CONSTRAINT "InventoryItem_itemId_fkey";

-- DropForeignKey
ALTER TABLE "InventoryItem" DROP CONSTRAINT "InventoryItem_warehouseId_fkey";

-- DropForeignKey
ALTER TABLE "ItemReceipt" DROP CONSTRAINT "ItemReceipt_deliveryId_fkey";

-- DropForeignKey
ALTER TABLE "ItemReceipt" DROP CONSTRAINT "ItemReceipt_partnerReceiptId_fkey";

-- DropForeignKey
ALTER TABLE "ItemReceipt" DROP CONSTRAINT "ItemReceipt_projectId_fkey";

-- DropForeignKey
ALTER TABLE "ItemReceipt" DROP CONSTRAINT "ItemReceipt_warehouseId_fkey";

-- DropForeignKey
ALTER TABLE "ItemReceiptItems" DROP CONSTRAINT "ItemReceiptItems_itemId_fkey";

-- DropForeignKey
ALTER TABLE "ItemTag" DROP CONSTRAINT "ItemTag_itemId_fkey";

-- DropForeignKey
ALTER TABLE "ItemTag" DROP CONSTRAINT "ItemTag_tagId_fkey";

-- DropForeignKey
ALTER TABLE "Location" DROP CONSTRAINT "Location_barangayId_fkey";

-- DropForeignKey
ALTER TABLE "Location" DROP CONSTRAINT "Location_municipalityId_fkey";

-- DropForeignKey
ALTER TABLE "Location" DROP CONSTRAINT "Location_provinceId_fkey";

-- DropForeignKey
ALTER TABLE "Location" DROP CONSTRAINT "Location_regionId_fkey";

-- DropForeignKey
ALTER TABLE "LocationBarangay" DROP CONSTRAINT "LocationBarangay_municipalityId_fkey";

-- DropForeignKey
ALTER TABLE "LocationMunicipality" DROP CONSTRAINT "LocationMunicipality_provinceId_fkey";

-- DropForeignKey
ALTER TABLE "LocationProvince" DROP CONSTRAINT "LocationProvince_regionId_fkey";

-- DropForeignKey
ALTER TABLE "Project" DROP CONSTRAINT "Project_clientId_fkey";

-- DropForeignKey
ALTER TABLE "Project" DROP CONSTRAINT "Project_locationId_fkey";

-- DropForeignKey
ALTER TABLE "PurchaseOrder" DROP CONSTRAINT "PurchaseOrder_itemReceiptId_fkey";

-- DropForeignKey
ALTER TABLE "PurchaseRequest" DROP CONSTRAINT "PurchaseRequest_itemReceiptId_fkey";

-- DropForeignKey
ALTER TABLE "PurchaseRequestSuppliers" DROP CONSTRAINT "PurchaseRequestSuppliers_purchaseRequestId_fkey";

-- DropForeignKey
ALTER TABLE "PurchaseRequestSuppliers" DROP CONSTRAINT "PurchaseRequestSuppliers_supplierId_fkey";

-- DropForeignKey
ALTER TABLE "Role" DROP CONSTRAINT "Role_parentRoleId_fkey";

-- DropForeignKey
ALTER TABLE "Role" DROP CONSTRAINT "Role_roleGroupId_fkey";

-- DropForeignKey
ALTER TABLE "Supplier" DROP CONSTRAINT "Supplier_locationId_fkey";

-- DropForeignKey
ALTER TABLE "SupplierItems" DROP CONSTRAINT "SupplierItems_itemId_fkey";

-- DropForeignKey
ALTER TABLE "SupplierItems" DROP CONSTRAINT "SupplierItems_supplierId_fkey";

-- DropForeignKey
ALTER TABLE "SupplierPriceUpdate" DROP CONSTRAINT "SupplierPriceUpdate_itemId_fkey";

-- DropForeignKey
ALTER TABLE "SupplierPriceUpdate" DROP CONSTRAINT "SupplierPriceUpdate_supplierId_fkey";

-- DropForeignKey
ALTER TABLE "SupplierPriceUpdate" DROP CONSTRAINT "SupplierPriceUpdate_updateById_fkey";

-- DropForeignKey
ALTER TABLE "Task" DROP CONSTRAINT "Task_assignedToId_fkey";

-- DropForeignKey
ALTER TABLE "Task" DROP CONSTRAINT "Task_boardLaneId_fkey";

-- DropForeignKey
ALTER TABLE "Task" DROP CONSTRAINT "Task_createdById_fkey";

-- DropForeignKey
ALTER TABLE "Task" DROP CONSTRAINT "Task_projectId_fkey";

-- DropForeignKey
ALTER TABLE "Task" DROP CONSTRAINT "Task_updatedById_fkey";

-- DropForeignKey
ALTER TABLE "TaskWatcher" DROP CONSTRAINT "TaskWatcher_accountId_fkey";

-- DropForeignKey
ALTER TABLE "TaskWatcher" DROP CONSTRAINT "TaskWatcher_taskId_fkey";

-- DropForeignKey
ALTER TABLE "Tier" DROP CONSTRAINT "Tier_itemId_fkey";

-- DropForeignKey
ALTER TABLE "TierAttribute" DROP CONSTRAINT "TierAttribute_tierId_fkey";

-- DropForeignKey
ALTER TABLE "Warehouse" DROP CONSTRAINT "Warehouse_locationId_fkey";

-- DropForeignKey
ALTER TABLE "Warehouse" DROP CONSTRAINT "Warehouse_projectId_fkey";

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_itemReceiptId_fkey" FOREIGN KEY ("itemReceiptId") REFERENCES "ItemReceipt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseRequest" ADD CONSTRAINT "PurchaseRequest_itemReceiptId_fkey" FOREIGN KEY ("itemReceiptId") REFERENCES "ItemReceipt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseRequestSuppliers" ADD CONSTRAINT "PurchaseRequestSuppliers_purchaseRequestId_fkey" FOREIGN KEY ("purchaseRequestId") REFERENCES "PurchaseRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseRequestSuppliers" ADD CONSTRAINT "PurchaseRequestSuppliers_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_parentAccountId_fkey" FOREIGN KEY ("parentAccountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Role" ADD CONSTRAINT "Role_roleGroupId_fkey" FOREIGN KEY ("roleGroupId") REFERENCES "RoleGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Role" ADD CONSTRAINT "Role_parentRoleId_fkey" FOREIGN KEY ("parentRoleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_boardLaneId_fkey" FOREIGN KEY ("boardLaneId") REFERENCES "BoardLane"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Collaborators" ADD CONSTRAINT "Collaborators_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Collaborators" ADD CONSTRAINT "Collaborators_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskWatcher" ADD CONSTRAINT "TaskWatcher_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskWatcher" ADD CONSTRAINT "TaskWatcher_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountNotifications" ADD CONSTRAINT "AccountNotifications_notificationsId_fkey" FOREIGN KEY ("notificationsId") REFERENCES "Notifications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountNotifications" ADD CONSTRAINT "AccountNotifications_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountNotifications" ADD CONSTRAINT "AccountNotifications_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountNotifications" ADD CONSTRAINT "AccountNotifications_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Warehouse" ADD CONSTRAINT "Warehouse_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Warehouse" ADD CONSTRAINT "Warehouse_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemTag" ADD CONSTRAINT "ItemTag_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemTag" ADD CONSTRAINT "ItemTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tier" ADD CONSTRAINT "Tier_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TierAttribute" ADD CONSTRAINT "TierAttribute_tierId_fkey" FOREIGN KEY ("tierId") REFERENCES "Tier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryItem" ADD CONSTRAINT "InventoryItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryItem" ADD CONSTRAINT "InventoryItem_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillOfQuantity" ADD CONSTRAINT "BillOfQuantity_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillOfQuantity" ADD CONSTRAINT "BillOfQuantity_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillOfQuantity" ADD CONSTRAINT "BillOfQuantity_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillOfQuantityTable" ADD CONSTRAINT "BillOfQuantityTable_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EquipmentModel" ADD CONSTRAINT "EquipmentModel_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EquipmentModel" ADD CONSTRAINT "EquipmentModel_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EquipmentModel" ADD CONSTRAINT "EquipmentModel_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EquipmentModelMaintenanceHistory" ADD CONSTRAINT "EquipmentModelMaintenanceHistory_equipmentModelId_fkey" FOREIGN KEY ("equipmentModelId") REFERENCES "EquipmentModel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EquipmentModelMaintenanceHistory" ADD CONSTRAINT "EquipmentModelMaintenanceHistory_equipmentMaintenanceHisto_fkey" FOREIGN KEY ("equipmentMaintenanceHistoryId") REFERENCES "EquipmentMaintenanceHistory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Location" ADD CONSTRAINT "Location_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "LocationRegion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Location" ADD CONSTRAINT "Location_provinceId_fkey" FOREIGN KEY ("provinceId") REFERENCES "LocationProvince"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Location" ADD CONSTRAINT "Location_municipalityId_fkey" FOREIGN KEY ("municipalityId") REFERENCES "LocationMunicipality"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Location" ADD CONSTRAINT "Location_barangayId_fkey" FOREIGN KEY ("barangayId") REFERENCES "LocationBarangay"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Delivery" ADD CONSTRAINT "Delivery_fromWarehouseId_fkey" FOREIGN KEY ("fromWarehouseId") REFERENCES "Warehouse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Delivery" ADD CONSTRAINT "Delivery_toWarehouseId_fkey" FOREIGN KEY ("toWarehouseId") REFERENCES "Warehouse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Delivery" ADD CONSTRAINT "Delivery_sourceDeliveryReceiptId_fkey" FOREIGN KEY ("sourceDeliveryReceiptId") REFERENCES "ItemReceipt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Delivery" ADD CONSTRAINT "Delivery_inTransitDeliveryReceiptId_fkey" FOREIGN KEY ("inTransitDeliveryReceiptId") REFERENCES "ItemReceipt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Delivery" ADD CONSTRAINT "Delivery_deliveredDeliveryReceiptId_fkey" FOREIGN KEY ("deliveredDeliveryReceiptId") REFERENCES "ItemReceipt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Delivery" ADD CONSTRAINT "Delivery_pickUpLocationId_fkey" FOREIGN KEY ("pickUpLocationId") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Delivery" ADD CONSTRAINT "Delivery_inTransitWarehouseId_fkey" FOREIGN KEY ("inTransitWarehouseId") REFERENCES "Warehouse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryReceive" ADD CONSTRAINT "DeliveryReceive_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES "Delivery"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryReceive" ADD CONSTRAINT "DeliveryReceive_itemReceiptId_fkey" FOREIGN KEY ("itemReceiptId") REFERENCES "ItemReceipt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Supplier" ADD CONSTRAINT "Supplier_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierItems" ADD CONSTRAINT "SupplierItems_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierItems" ADD CONSTRAINT "SupplierItems_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierPriceUpdate" ADD CONSTRAINT "SupplierPriceUpdate_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierPriceUpdate" ADD CONSTRAINT "SupplierPriceUpdate_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierPriceUpdate" ADD CONSTRAINT "SupplierPriceUpdate_updateById_fkey" FOREIGN KEY ("updateById") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemReceipt" ADD CONSTRAINT "ItemReceipt_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemReceipt" ADD CONSTRAINT "ItemReceipt_partnerReceiptId_fkey" FOREIGN KEY ("partnerReceiptId") REFERENCES "ItemReceipt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemReceipt" ADD CONSTRAINT "ItemReceipt_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES "Delivery"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemReceipt" ADD CONSTRAINT "ItemReceipt_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemReceiptItems" ADD CONSTRAINT "ItemReceiptItems_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FundTransaction" ADD CONSTRAINT "FundTransaction_fundAccountId_fkey" FOREIGN KEY ("fundAccountId") REFERENCES "FundAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocationProvince" ADD CONSTRAINT "LocationProvince_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "LocationRegion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocationMunicipality" ADD CONSTRAINT "LocationMunicipality_provinceId_fkey" FOREIGN KEY ("provinceId") REFERENCES "LocationProvince"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocationBarangay" ADD CONSTRAINT "LocationBarangay_municipalityId_fkey" FOREIGN KEY ("municipalityId") REFERENCES "LocationMunicipality"("id") ON DELETE CASCADE ON UPDATE CASCADE;
