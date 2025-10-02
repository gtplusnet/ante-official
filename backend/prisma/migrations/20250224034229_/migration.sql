-- AlterTable
ALTER TABLE "RequestForPayment" ADD COLUMN     "fromFundAccountId" INTEGER;

-- AddForeignKey
ALTER TABLE "RequestForPayment" ADD CONSTRAINT "RequestForPayment_fromFundAccountId_fkey" FOREIGN KEY ("fromFundAccountId") REFERENCES "FundAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
