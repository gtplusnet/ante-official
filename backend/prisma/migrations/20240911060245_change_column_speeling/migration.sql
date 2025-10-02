/*
  Warnings:

  - You are about to drop the column `subtotal` on the `BillOfQuantityTable` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "BillOfQuantityTable" DROP COLUMN "subtotal",
ADD COLUMN     "subTotal" DOUBLE PRECISION DEFAULT 0;
