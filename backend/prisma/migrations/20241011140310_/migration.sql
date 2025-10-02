-- AlterTable
ALTER TABLE "ItemReceiptItems" ADD COLUMN     "itemDescription" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "itemName" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "itemSku" TEXT NOT NULL DEFAULT '';
