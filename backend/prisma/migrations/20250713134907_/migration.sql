-- AlterTable
ALTER TABLE "Item" ADD COLUMN     "maximumStockLevelPrice" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "minimumStockLevelPrice" INTEGER NOT NULL DEFAULT 0;
