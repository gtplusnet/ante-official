/*
  Warnings:

  - A unique constraint covering the columns `[itemReceiptId,itemId]` on the table `ItemReceiptItems` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "ItemReceiptItems_itemReceiptId_itemId_key" ON "ItemReceiptItems"("itemReceiptId", "itemId");
