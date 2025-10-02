/*
  Warnings:

  - A unique constraint covering the columns `[originalItemId]` on the table `BillOfQuantityTable` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "BillOfQuantity" ADD COLUMN     "createdById" TEXT,
ADD COLUMN     "updatedById" TEXT,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "BillOfQuantityTable" ADD COLUMN     "originalItemId" TEXT;


-- CreateIndex
CREATE UNIQUE INDEX "BillOfQuantityTable_originalItemId_key" ON "BillOfQuantityTable"("originalItemId");



-- AddForeignKey
ALTER TABLE "BillOfQuantity" ADD CONSTRAINT "BillOfQuantity_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillOfQuantity" ADD CONSTRAINT "BillOfQuantity_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;
