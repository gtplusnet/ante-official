-- AlterEnum
ALTER TYPE "FundTransactionCode" ADD VALUE 'PETTY_CASH_RETURN';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "PettyCashTransactionType" ADD VALUE 'RETURN';
ALTER TYPE "PettyCashTransactionType" ADD VALUE 'TRANSFER';

-- AlterTable
ALTER TABLE "PettyCashTransaction" ADD COLUMN     "transferFromHolderId" INTEGER;

-- AddForeignKey
ALTER TABLE "PettyCashTransaction" ADD CONSTRAINT "PettyCashTransaction_transferFromHolderId_fkey" FOREIGN KEY ("transferFromHolderId") REFERENCES "PettyCashHolder"("id") ON DELETE SET NULL ON UPDATE CASCADE;
