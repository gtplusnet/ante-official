/*
  Warnings:

  - A unique constraint covering the columns `[code]` on the table `ItemReceipt` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "ItemReceipt" ADD COLUMN     "partnerReceiptId" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "ItemReceipt_code_key" ON "ItemReceipt"("code");

-- AddForeignKey
ALTER TABLE "ItemReceipt" ADD CONSTRAINT "ItemReceipt_partnerReceiptId_fkey" FOREIGN KEY ("partnerReceiptId") REFERENCES "ItemReceipt"("id") ON DELETE SET NULL ON UPDATE CASCADE;
