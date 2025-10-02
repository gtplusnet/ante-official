/*
  Warnings:

  - The values [TAXABLE,NON_TAXABLE] on the enum `AllowanceType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "AllowanceType_new" AS ENUM ('ALLOWANCE', 'DEMINIMIS');
ALTER TABLE "AllowanceConfiguration" ALTER COLUMN "category" TYPE "AllowanceType_new" USING ("category"::text::"AllowanceType_new");
ALTER TYPE "AllowanceType" RENAME TO "AllowanceType_old";
ALTER TYPE "AllowanceType_new" RENAME TO "AllowanceType";
DROP TYPE "AllowanceType_old";
COMMIT;

-- AlterTable
ALTER TABLE "AllowanceConfiguration" ADD COLUMN     "taxBasis" "TaxBasis" NOT NULL DEFAULT 'TAXABLE';
