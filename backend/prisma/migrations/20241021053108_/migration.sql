-- CreateEnum
CREATE TYPE "TruckLoadStage" AS ENUM ('FOR_SECURIING', 'FOR_PACKING', 'FOR_LOADING', 'FOR_DELIVERY');

-- AlterTable
ALTER TABLE "Delivery" ADD COLUMN     "isLoadingStage" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "truckLoadStage" "TruckLoadStage" NOT NULL DEFAULT 'FOR_SECURIING';
