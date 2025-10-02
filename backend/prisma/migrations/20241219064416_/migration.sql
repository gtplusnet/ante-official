/*
  Warnings:

  - Added the required column `itemId` to the `ItemTier` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ItemTier" ADD COLUMN     "itemId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "ItemTier" ADD CONSTRAINT "ItemTier_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;
