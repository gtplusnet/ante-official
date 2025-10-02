-- CreateTable
CREATE TABLE "EquipmentPartsMaintenanceHistory" (
    "id" SERIAL NOT NULL,
    "checkedById" TEXT NOT NULL,
    "repairedById" TEXT,
    "isPassed" BOOLEAN NOT NULL DEFAULT true,
    "equipmentPartsId" INTEGER NOT NULL,
    "maintenanceDate" TIMESTAMP(3) NOT NULL,
    "repairDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EquipmentPartsMaintenanceHistory_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "EquipmentPartsMaintenanceHistory" ADD CONSTRAINT "EquipmentPartsMaintenanceHistory_checkedById_fkey" FOREIGN KEY ("checkedById") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EquipmentPartsMaintenanceHistory" ADD CONSTRAINT "EquipmentPartsMaintenanceHistory_repairedById_fkey" FOREIGN KEY ("repairedById") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EquipmentPartsMaintenanceHistory" ADD CONSTRAINT "EquipmentPartsMaintenanceHistory_equipmentPartsId_fkey" FOREIGN KEY ("equipmentPartsId") REFERENCES "EquipmentParts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
