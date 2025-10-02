/*
  Warnings:

  - The values [PAYMNENT_RELEASED] on the enum `RequestForPaymentStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "RequestForPaymentStatus_new" AS ENUM ('PAYMENT_APPROVAL', 'PREPARATION', 'RELEASE_APPROVAL', 'FOR_RELEASING', 'PAYMENT_RELEASED', 'REJECTED');
ALTER TABLE "RequestForPayment" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "RequestForPayment" ALTER COLUMN "status" TYPE "RequestForPaymentStatus_new" USING ("status"::text::"RequestForPaymentStatus_new");
ALTER TABLE "RequestForPaymentActions" ALTER COLUMN "fromStatus" TYPE "RequestForPaymentStatus_new" USING ("fromStatus"::text::"RequestForPaymentStatus_new");
ALTER TABLE "RequestForPaymentActions" ALTER COLUMN "toStatus" TYPE "RequestForPaymentStatus_new" USING ("toStatus"::text::"RequestForPaymentStatus_new");
ALTER TYPE "RequestForPaymentStatus" RENAME TO "RequestForPaymentStatus_old";
ALTER TYPE "RequestForPaymentStatus_new" RENAME TO "RequestForPaymentStatus";
DROP TYPE "RequestForPaymentStatus_old";
ALTER TABLE "RequestForPayment" ALTER COLUMN "status" SET DEFAULT 'PAYMENT_APPROVAL';
COMMIT;
