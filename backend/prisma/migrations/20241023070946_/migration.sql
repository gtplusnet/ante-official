/*
  Warnings:

  - The values [MATERIAL_APPROVED] on the enum `PurchaseRequestStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "PurchaseRequestStatus_new" AS ENUM ('SUPPLIER_OUTSOURCING', 'MATERIALS_APPROVAL', 'CANVASSING', 'SUPPLIER_SELECTION', 'PURCHASE_ORDER');
ALTER TABLE "PurchaseRequest" ALTER COLUMN "status" TYPE "PurchaseRequestStatus_new" USING ("status"::text::"PurchaseRequestStatus_new");
ALTER TYPE "PurchaseRequestStatus" RENAME TO "PurchaseRequestStatus_old";
ALTER TYPE "PurchaseRequestStatus_new" RENAME TO "PurchaseRequestStatus";
DROP TYPE "PurchaseRequestStatus_old";
COMMIT;
