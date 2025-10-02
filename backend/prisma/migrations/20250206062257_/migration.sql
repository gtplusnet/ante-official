/*
  Warnings:

  - You are about to drop the column `itemId` on the `EquipmentParts` table. All the data in the column will be lost.
  - You are about to drop the column `maintenaceCountCycle` on the `EquipmentParts` table. All the data in the column will be lost.
  - You are about to drop the column `maintenanceCycle` on the `EquipmentParts` table. All the data in the column will be lost.
  - Added the required column `partName` to the `EquipmentParts` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "EquipmentParts" DROP CONSTRAINT "EquipmentParts_itemId_fkey";

-- AlterTable
ALTER TABLE "EquipmentParts" DROP COLUMN "itemId",
DROP COLUMN "maintenaceCountCycle",
DROP COLUMN "maintenanceCycle",
ADD COLUMN     "partName" TEXT NOT NULL,
ADD COLUMN     "scheduleDay" INTEGER NOT NULL DEFAULT 0;
