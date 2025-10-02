/*
  Warnings:

  - The values [ALLOWANCE] on the enum `AllowanceType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "AllowanceType_new" AS ENUM ('DEMINIMIS', 'TAXABLE', 'NON_TAXABLE');
ALTER TABLE "AllowanceConfiguration" ALTER COLUMN "category" TYPE "AllowanceType_new" USING ("category"::text::"AllowanceType_new");
ALTER TYPE "AllowanceType" RENAME TO "AllowanceType_old";
ALTER TYPE "AllowanceType_new" RENAME TO "AllowanceType";
DROP TYPE "AllowanceType_old";
COMMIT;
