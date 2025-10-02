/*
  Warnings:

  - You are about to drop the column `location` on the `EquipmentModel` table. All the data in the column will be lost.
  - You are about to drop the column `itemId` on the `InventoryHistory` table. All the data in the column will be lost.
  - You are about to drop the column `location` on the `Warehouse` table. All the data in the column will be lost.
  - Added the required column `locationId` to the `EquipmentModel` table without a default value. This is not possible if the table is not empty.
  - Added the required column `locationId` to the `Warehouse` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "DeliveryStatus" AS ENUM ('IN_PROGRESS', 'CANCELLED', 'DELIVERED');

-- AlterEnum
ALTER TYPE "TransactionType" ADD VALUE 'DELIVERY';

-- DropForeignKey
ALTER TABLE "InventoryHistory" DROP CONSTRAINT "InventoryHistory_itemId_fkey";

-- AlterTable
ALTER TABLE "EquipmentModel" DROP COLUMN "location",
ADD COLUMN     "locationId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "InventoryHistory" DROP COLUMN "itemId",
ADD COLUMN     "deliveryId" TEXT,
ALTER COLUMN "warehouseId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Warehouse" DROP COLUMN "location",
ADD COLUMN     "locationId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "Location" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "line1" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "brgy" TEXT NOT NULL,
    "zipCode" TEXT NOT NULL,
    "landmark" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Delivery" (
    "id" TEXT NOT NULL,
    "subjectTitle" TEXT NOT NULL,
    "pickupLocationId" TEXT NOT NULL,
    "deliveryLocationId" TEXT NOT NULL,
    "equipementModelId" UUID NOT NULL,
    "remarks" TEXT NOT NULL,
    "status" "DeliveryStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "placedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "deliveredAt" TIMESTAMP(3),
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Delivery_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Warehouse_locationId_idx" ON "Warehouse"("locationId");

-- AddForeignKey
ALTER TABLE "Warehouse" ADD CONSTRAINT "Warehouse_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryHistory" ADD CONSTRAINT "InventoryHistory_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES "Delivery"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EquipmentModel" ADD CONSTRAINT "EquipmentModel_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Delivery" ADD CONSTRAINT "Delivery_pickupLocationId_fkey" FOREIGN KEY ("pickupLocationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Delivery" ADD CONSTRAINT "Delivery_deliveryLocationId_fkey" FOREIGN KEY ("deliveryLocationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Delivery" ADD CONSTRAINT "Delivery_equipementModelId_fkey" FOREIGN KEY ("equipementModelId") REFERENCES "EquipmentModel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
