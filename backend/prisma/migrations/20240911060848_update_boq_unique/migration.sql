/*
  Warnings:

  - A unique constraint covering the columns `[billOfQuantityId,id]` on the table `BillOfQuantityTable` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "BillOfQuantityTable_billOfQuantityId_originalItemId_key";

-- CreateIndex
CREATE UNIQUE INDEX "BillOfQuantityTable_billOfQuantityId_id_key" ON "BillOfQuantityTable"("billOfQuantityId", "id");
