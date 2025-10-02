/*
  Warnings:

  - You are about to drop the column `inventoryId` on the `InventoryHistory` table. All the data in the column will be lost.
  - You are about to drop the column `itemId` on the `InventoryHistory` table. All the data in the column will be lost.
  - You are about to drop the column `quantityAfter` on the `InventoryHistory` table. All the data in the column will be lost.
  - You are about to drop the column `quantityBefore` on the `InventoryHistory` table. All the data in the column will be lost.
  - You are about to drop the column `transactionNumber` on the `InventoryHistory` table. All the data in the column will be lost.
  - Added the required column `warehouseId` to the `InventoryHistory` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "InventoryHistory" DROP CONSTRAINT "InventoryHistory_inventoryId_fkey";

-- DropForeignKey
ALTER TABLE "InventoryHistory" DROP CONSTRAINT "InventoryHistory_itemId_fkey";

-- AlterTable
ALTER TABLE "InventoryHistory" DROP COLUMN "inventoryId",
DROP COLUMN "itemId",
DROP COLUMN "quantityAfter",
DROP COLUMN "quantityBefore",
DROP COLUMN "transactionNumber",
ADD COLUMN     "InventoryHistoryNumber" SERIAL NOT NULL,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "warehouseId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "InventoryHistoryItem" (
    "id" TEXT NOT NULL,
    "inventoryHistoryId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "requestedQuantity" INTEGER NOT NULL,
    "currentQuantity" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryHistoryItem_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Inventory" ADD CONSTRAINT "Inventory_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryHistoryItem" ADD CONSTRAINT "InventoryHistoryItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryHistoryItem" ADD CONSTRAINT "InventoryHistoryItem_inventoryHistoryId_fkey" FOREIGN KEY ("inventoryHistoryId") REFERENCES "InventoryHistory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
