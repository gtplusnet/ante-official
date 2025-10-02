-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('NO_ITEM', 'PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "BillOfQuantityTable" ADD COLUMN     "approvalStatus" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "particularType" "ParticularType" NOT NULL DEFAULT 'INVENTORY';
