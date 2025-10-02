/*
  Warnings:

  - The primary key for the `Equipment` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `Equipment` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `EquipmentMaintenanceHistory` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `EquipmentModel` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `EquipmentModelMaintenanceHistory` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `brandId` to the `Equipment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `currentWarehouseId` to the `Equipment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `equipmentModel` to the `Equipment` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "EquipmentState" AS ENUM ('WORKING', 'FOR_REPAIR', 'REPAIRED');

-- CreateEnum
CREATE TYPE "maintenanceCycle" AS ENUM ('NONE', 'MONTHLY', 'YEARLY');

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

-- AlterTable
ALTER TABLE "Equipment" DROP CONSTRAINT "Equipment_pkey",
ADD COLUMN     "brandId" INTEGER NOT NULL,
ADD COLUMN     "currentWarehouseId" TEXT NOT NULL,
ADD COLUMN     "equipmentModel" TEXT NOT NULL,
ADD COLUMN     "equipmentState" "EquipmentState" NOT NULL DEFAULT 'WORKING',
ADD COLUMN     "equipmentType" "EquipmentType" NOT NULL DEFAULT 'VEHICLE',
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "Equipment_pkey" PRIMARY KEY ("id");

-- DropTable
DROP TABLE "EquipmentMaintenanceHistory";

-- DropTable
DROP TABLE "EquipmentModel";

-- DropTable
DROP TABLE "EquipmentModelMaintenanceHistory";

-- DropEnum
DROP TYPE "EquipmentStatus";

-- CreateTable
CREATE TABLE "EquipmentBrand" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "EquipmentBrand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EquipmentParts" (
    "id" SERIAL NOT NULL,
    "equipmentId" INTEGER NOT NULL,
    "itemId" TEXT NOT NULL,
    "maintenaceCountCycle" INTEGER NOT NULL DEFAULT 0,
    "maintenanceCycle" "maintenanceCycle" NOT NULL DEFAULT 'NONE',
    "lastMaintenanceDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EquipmentParts_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Equipment" ADD CONSTRAINT "Equipment_currentWarehouseId_fkey" FOREIGN KEY ("currentWarehouseId") REFERENCES "Warehouse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Equipment" ADD CONSTRAINT "Equipment_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "EquipmentBrand"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EquipmentParts" ADD CONSTRAINT "EquipmentParts_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EquipmentParts" ADD CONSTRAINT "EquipmentParts_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;
