/*
  Warnings:

  - You are about to drop the column `isBoqItem` on the `BillOfQuantityTable` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "BillOfQuantityTable" DROP COLUMN "isBoqItem",
ADD COLUMN     "isQuantityTakeOffItem" BOOLEAN NOT NULL DEFAULT false;
