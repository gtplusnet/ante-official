-- AlterTable
ALTER TABLE "DeductionPlanHistory" ADD COLUMN     "transactionCode" "FundTransactionCode" NOT NULL DEFAULT 'BEGINNING_BALANCE';
