/*
  Warnings:

  - Made the column `billOfQuantityId` on table `BillOfQuantityTable` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "BillOfQuantityTable" DROP CONSTRAINT "BillOfQuantityTable_billOfQuantityId_fkey";

-- AlterTable
ALTER TABLE "BillOfQuantityTable" ALTER COLUMN "billOfQuantityId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "BillOfQuantityTable" ADD CONSTRAINT "BillOfQuantityTable_billOfQuantityId_fkey" FOREIGN KEY ("billOfQuantityId") REFERENCES "BillOfQuantity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
