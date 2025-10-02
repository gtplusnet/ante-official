/*
  Warnings:

  - A unique constraint covering the columns `[contractId,version]` on the table `BillOfQuantity` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "BillOfQuantity_contractId_key";

-- CreateIndex
CREATE UNIQUE INDEX "BillOfQuantity_contractId_version_key" ON "BillOfQuantity"("contractId", "version");
