/*
  Warnings:

  - You are about to drop the column `isPassed` on the `EquipmentPartsMaintenanceHistory` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "EquipmentPartsMaintenanceHistory" DROP COLUMN "isPassed",
ADD COLUMN     "isWorking" BOOLEAN NOT NULL DEFAULT true;
