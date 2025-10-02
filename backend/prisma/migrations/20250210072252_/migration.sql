-- AlterTable
ALTER TABLE "EquipmentPartsMaintenanceHistory" ADD COLUMN     "maintenanceProofId" INTEGER;

-- AddForeignKey
ALTER TABLE "EquipmentPartsMaintenanceHistory" ADD CONSTRAINT "EquipmentPartsMaintenanceHistory_maintenanceProofId_fkey" FOREIGN KEY ("maintenanceProofId") REFERENCES "Files"("id") ON DELETE CASCADE ON UPDATE CASCADE;
