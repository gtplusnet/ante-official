/*
  Warnings:

  - You are about to drop the column `fromFundAccountId` on the `RequestForPayment` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "RequestForPayment" DROP CONSTRAINT "RequestForPayment_fromFundAccountId_fkey";

-- AlterTable
ALTER TABLE "RequestForPayment" DROP COLUMN "fromFundAccountId",
ADD COLUMN     "fundTransactionId" INTEGER;

-- AddForeignKey
ALTER TABLE "RequestForPayment" ADD CONSTRAINT "RequestForPayment_fundTransactionId_fkey" FOREIGN KEY ("fundTransactionId") REFERENCES "FundTransaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;
