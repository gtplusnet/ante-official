-- CreateEnum
CREATE TYPE "BillOfQuantityStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "BillOfQuantity" ADD COLUMN     "status" "BillOfQuantityStatus" NOT NULL DEFAULT 'PENDING';
