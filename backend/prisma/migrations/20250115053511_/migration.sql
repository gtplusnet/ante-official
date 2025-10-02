/*
  Warnings:

  - You are about to drop the column `BillOfQuantityId` on the `ItemReceipt` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "ItemReceipt" DROP CONSTRAINT "ItemReceipt_BillOfQuantityId_fkey";

-- AlterTable
ALTER TABLE "ItemReceipt" DROP COLUMN "BillOfQuantityId",
ADD COLUMN     "billOfQuantityId" INTEGER;

-- AddForeignKey
ALTER TABLE "ItemReceipt" ADD CONSTRAINT "ItemReceipt_billOfQuantityId_fkey" FOREIGN KEY ("billOfQuantityId") REFERENCES "BillOfQuantity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
