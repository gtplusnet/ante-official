/*
  Warnings:

  - You are about to drop the column `isApproved` on the `PettyCashLiquidation` table. All the data in the column will be lost.
  - You are about to drop the column `userAccountId` on the `PettyCashLiquidation` table. All the data in the column will be lost.
  - Added the required column `requestedById` to the `PettyCashLiquidation` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PettyCashLiquidationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- DropForeignKey
ALTER TABLE "PettyCashLiquidation" DROP CONSTRAINT "PettyCashLiquidation_userAccountId_fkey";

-- AlterTable
ALTER TABLE "PettyCashLiquidation" DROP COLUMN "isApproved",
DROP COLUMN "userAccountId",
ADD COLUMN     "approvedById" TEXT,
ADD COLUMN     "rejectReason" TEXT,
ADD COLUMN     "requestedById" TEXT NOT NULL,
ADD COLUMN     "status" "PettyCashLiquidationStatus" NOT NULL DEFAULT 'PENDING';

-- AddForeignKey
ALTER TABLE "PettyCashLiquidation" ADD CONSTRAINT "PettyCashLiquidation_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PettyCashLiquidation" ADD CONSTRAINT "PettyCashLiquidation_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
