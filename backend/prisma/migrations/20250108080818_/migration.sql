-- AlterTable
ALTER TABLE "BillOfQuantityTable" ADD COLUMN     "profitMargin" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "profitMarginPercentage" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "totalWithProfit" DOUBLE PRECISION DEFAULT 0;
