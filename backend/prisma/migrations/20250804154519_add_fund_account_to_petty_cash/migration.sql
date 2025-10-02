-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "FundTransactionCode" ADD VALUE 'PETTY_CASH_ASSIGNMENT';
ALTER TYPE "FundTransactionCode" ADD VALUE 'PETTY_CASH_REFILL';

-- AlterTable
ALTER TABLE "PettyCashHolder" ADD COLUMN     "fundAccountId" INTEGER;

-- AlterTable
ALTER TABLE "PettyCashTransaction" ADD COLUMN     "fundTransactionId" INTEGER;

-- AddForeignKey
ALTER TABLE "PettyCashHolder" ADD CONSTRAINT "PettyCashHolder_fundAccountId_fkey" FOREIGN KEY ("fundAccountId") REFERENCES "FundAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PettyCashTransaction" ADD CONSTRAINT "PettyCashTransaction_fundTransactionId_fkey" FOREIGN KEY ("fundTransactionId") REFERENCES "FundTransaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;
