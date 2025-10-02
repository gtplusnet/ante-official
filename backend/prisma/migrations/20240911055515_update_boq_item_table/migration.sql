/*
  Warnings:

  - You are about to drop the column `particularType` on the `BillOfQuantityTable` table. All the data in the column will be lost.
  - You are about to drop the column `particulars` on the `BillOfQuantityTable` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "BillOfQuantityTable" DROP COLUMN "particularType",
DROP COLUMN "particulars",
ADD COLUMN     "description" TEXT;
