/*
  Warnings:

  - A unique constraint covering the columns `[supplierId,itemId]` on the table `SupplierItems` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "SupplierItems_supplierId_itemId_key" ON "SupplierItems"("supplierId", "itemId");
