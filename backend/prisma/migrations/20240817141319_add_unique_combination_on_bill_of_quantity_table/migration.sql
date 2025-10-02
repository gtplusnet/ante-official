/*
  Warnings:

  - A unique constraint covering the columns `[billOfQuantityId,originalItemId]` on the table `BillOfQuantityTable` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "BillOfQuantityTable_billOfQuantityId_originalItemId_key" ON "BillOfQuantityTable"("billOfQuantityId", "originalItemId");
