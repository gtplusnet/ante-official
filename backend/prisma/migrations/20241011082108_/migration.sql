/*
  Warnings:

  - You are about to drop the `InventoryHistory` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `InventoryHistoryItem` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "InventoryHistory" DROP CONSTRAINT "InventoryHistory_deliveryId_fkey";

-- DropForeignKey
ALTER TABLE "InventoryHistoryItem" DROP CONSTRAINT "InventoryHistoryItem_inventoryHistoryId_fkey";

-- DropForeignKey
ALTER TABLE "InventoryHistoryItem" DROP CONSTRAINT "InventoryHistoryItem_itemId_fkey";

-- DropTable
DROP TABLE "InventoryHistory";

-- DropTable
DROP TABLE "InventoryHistoryItem";
