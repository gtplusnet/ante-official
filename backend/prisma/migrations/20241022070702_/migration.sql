-- AlterTable
ALTER TABLE "ItemReceipt" ADD COLUMN     "itemFullfilledCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "itemTotalCount" INTEGER NOT NULL DEFAULT 0;
