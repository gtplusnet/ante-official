/*
  Warnings:

  - You are about to drop the column `InventoryHistoryNumber` on the `InventoryHistory` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "EquipmentStatus" AS ENUM ('FOR_REPAIR', 'WORKING_CONDITION', 'REPAIRED');

-- CreateEnum
CREATE TYPE "EquipmentType" AS ENUM ('VEHICLE', 'TOOL');

-- AlterTable
ALTER TABLE "InventoryHistory" DROP COLUMN "InventoryHistoryNumber",
ADD COLUMN     "inventoryHistoryNumber" SERIAL NOT NULL,
ADD COLUMN     "itemId" TEXT;

-- CreateTable
CREATE TABLE "Equipment" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Equipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EquipmentModel" (
    "id" UUID NOT NULL,
    "equipmentId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "plateNum" TEXT,
    "number" TEXT,
    "location" TEXT NOT NULL,
    "status" "EquipmentStatus" NOT NULL DEFAULT 'WORKING_CONDITION',
    "type" "EquipmentType" NOT NULL,
    "driverId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "EquipmentModel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EquipmentMaintenanceHistory" (
    "id" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EquipmentMaintenanceHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_EquipmentMaintenanceHistories" (
    "A" TEXT NOT NULL,
    "B" UUID NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_EquipmentMaintenanceHistories_AB_unique" ON "_EquipmentMaintenanceHistories"("A", "B");

-- CreateIndex
CREATE INDEX "_EquipmentMaintenanceHistories_B_index" ON "_EquipmentMaintenanceHistories"("B");

-- AddForeignKey
ALTER TABLE "InventoryHistory" ADD CONSTRAINT "InventoryHistory_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EquipmentModel" ADD CONSTRAINT "EquipmentModel_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EquipmentModel" ADD CONSTRAINT "EquipmentModel_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EquipmentMaintenanceHistories" ADD CONSTRAINT "_EquipmentMaintenanceHistories_A_fkey" FOREIGN KEY ("A") REFERENCES "EquipmentMaintenanceHistory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EquipmentMaintenanceHistories" ADD CONSTRAINT "_EquipmentMaintenanceHistories_B_fkey" FOREIGN KEY ("B") REFERENCES "EquipmentModel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
