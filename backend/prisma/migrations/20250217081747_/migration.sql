/*
  Warnings:

  - Added the required column `paymentType` to the `RequestForPayment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "RequestForPayment" ADD COLUMN     "paymentType" "FundAccountType" NOT NULL;
