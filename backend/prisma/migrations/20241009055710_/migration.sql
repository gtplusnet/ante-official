/*
  Warnings:

  - The primary key for the `InventoryItem` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `inventoryId` on the `InventoryItem` table. All the data in the column will be lost.
  - You are about to drop the `Inventory` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `warehouseId` to the `InventoryItem` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Inventory" DROP CONSTRAINT "Inventory_warehouseId_fkey";

-- DropForeignKey
ALTER TABLE "InventoryItem" DROP CONSTRAINT "InventoryItem_inventoryId_fkey";

-- AlterTable
ALTER TABLE "InventoryItem" DROP CONSTRAINT "InventoryItem_pkey",
DROP COLUMN "inventoryId",
ADD COLUMN     "stockCostCount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "stockCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "warehouseId" TEXT NOT NULL,
ADD CONSTRAINT "InventoryItem_pkey" PRIMARY KEY ("warehouseId", "itemId");

-- DropTable
DROP TABLE "Inventory";

-- AddForeignKey
ALTER TABLE "InventoryItem" ADD CONSTRAINT "InventoryItem_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
