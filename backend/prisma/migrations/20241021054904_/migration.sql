/*
  Warnings:

  - The values [FOR_SECURIING,FOR_PICKUP] on the enum `TruckLoadStage` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "DeliveryStatus" ADD VALUE 'TRUCK_LOAD';
ALTER TYPE "DeliveryStatus" ADD VALUE 'FOR_PICKUP';

-- AlterEnum
BEGIN;
CREATE TYPE "TruckLoadStage_new" AS ENUM ('FOR_SECURING', 'FOR_PACKING', 'FOR_LOADING', 'FOR_DELIVERY');
ALTER TABLE "Delivery" ALTER COLUMN "truckLoadStage" DROP DEFAULT;
ALTER TABLE "Delivery" ALTER COLUMN "truckLoadStage" TYPE "TruckLoadStage_new" USING ("truckLoadStage"::text::"TruckLoadStage_new");
ALTER TYPE "TruckLoadStage" RENAME TO "TruckLoadStage_old";
ALTER TYPE "TruckLoadStage_new" RENAME TO "TruckLoadStage";
DROP TYPE "TruckLoadStage_old";
ALTER TABLE "Delivery" ALTER COLUMN "truckLoadStage" SET DEFAULT 'FOR_SECURING';
COMMIT;

-- AlterTable
ALTER TABLE "Delivery" ALTER COLUMN "truckLoadStage" SET DEFAULT 'FOR_SECURING';
