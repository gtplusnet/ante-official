/*
  Warnings:

  - You are about to drop the column `createdById` on the `Warehouse` table. All the data in the column will be lost.
  - You are about to drop the column `storageCapacity` on the `Warehouse` table. All the data in the column will be lost.
  - You are about to drop the column `updatedById` on the `Warehouse` table. All the data in the column will be lost.
  - Added the required column `capacity` to the `Warehouse` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Warehouse" DROP CONSTRAINT "Warehouse_createdById_fkey";

-- DropForeignKey
ALTER TABLE "Warehouse" DROP CONSTRAINT "Warehouse_updatedById_fkey";

-- AlterTable
ALTER TABLE "Warehouse" DROP COLUMN "createdById",
DROP COLUMN "storageCapacity",
DROP COLUMN "updatedById",
ADD COLUMN     "capacity" DOUBLE PRECISION NOT NULL;

-- CreateTable
CREATE TABLE "Inventory" (
    "id" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Inventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryItem" (
    "inventoryId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "InventoryItem_pkey" PRIMARY KEY ("inventoryId","itemId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Inventory_id_key" ON "Inventory"("id");

-- AddForeignKey
ALTER TABLE "InventoryItem" ADD CONSTRAINT "InventoryItem_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "Inventory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryItem" ADD CONSTRAINT "InventoryItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
