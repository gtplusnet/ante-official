-- AlterTable
ALTER TABLE "EquipmentPartsMaintenanceHistory" ADD COLUMN     "repairItemPurchaseRequestId" INTEGER;

-- AddForeignKey
ALTER TABLE "EquipmentPartsMaintenanceHistory" ADD CONSTRAINT "EquipmentPartsMaintenanceHistory_repairItemPurchaseRequest_fkey" FOREIGN KEY ("repairItemPurchaseRequestId") REFERENCES "PurchaseRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
