/*
  Warnings:

  - A unique constraint covering the columns `[purchaseRequestId,supplierId]` on the table `PurchaseRequestSuppliers` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "PurchaseRequestSuppliers_purchaseRequestId_supplierId_key" ON "PurchaseRequestSuppliers"("purchaseRequestId", "supplierId");
