-- AlterTable
ALTER TABLE "ItemReceiptItems" ADD COLUMN     "quantityAfter" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "quantityBefore" INTEGER NOT NULL DEFAULT 0;
