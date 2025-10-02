-- AlterTable
ALTER TABLE "ItemReceipt" ADD COLUMN     "isItemInventoryPosted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isMoneyPosted" BOOLEAN NOT NULL DEFAULT false;
