/*
  Warnings:

  - The values [SECOND_PERIOD] on the enum `DeductionPeriod` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "DeductionPeriod_new" AS ENUM ('FIRST_PERIOD', 'LAST_PERIOD', 'EVERY_PERIOD', 'NOT_DEDUCTED');
ALTER TABLE "PayrollGroup" ALTER COLUMN "deductionPeriodPagibig" DROP DEFAULT;
ALTER TABLE "PayrollGroup" ALTER COLUMN "deductionPeriodPhilhealth" DROP DEFAULT;
ALTER TABLE "PayrollGroup" ALTER COLUMN "deductionPeriodSSS" DROP DEFAULT;
ALTER TABLE "PayrollGroup" ALTER COLUMN "deductionPeriodWitholdingTax" DROP DEFAULT;
ALTER TABLE "PayrollGroup" ALTER COLUMN "deductionPeriodWitholdingTax" TYPE "DeductionPeriod_new" USING ("deductionPeriodWitholdingTax"::text::"DeductionPeriod_new");
ALTER TABLE "PayrollGroup" ALTER COLUMN "deductionPeriodSSS" TYPE "DeductionPeriod_new" USING ("deductionPeriodSSS"::text::"DeductionPeriod_new");
ALTER TABLE "PayrollGroup" ALTER COLUMN "deductionPeriodPhilhealth" TYPE "DeductionPeriod_new" USING ("deductionPeriodPhilhealth"::text::"DeductionPeriod_new");
ALTER TABLE "PayrollGroup" ALTER COLUMN "deductionPeriodPagibig" TYPE "DeductionPeriod_new" USING ("deductionPeriodPagibig"::text::"DeductionPeriod_new");
ALTER TYPE "DeductionPeriod" RENAME TO "DeductionPeriod_old";
ALTER TYPE "DeductionPeriod_new" RENAME TO "DeductionPeriod";
DROP TYPE "DeductionPeriod_old";
ALTER TABLE "PayrollGroup" ALTER COLUMN "deductionPeriodPagibig" SET DEFAULT 'EVERY_PERIOD';
ALTER TABLE "PayrollGroup" ALTER COLUMN "deductionPeriodPhilhealth" SET DEFAULT 'EVERY_PERIOD';
ALTER TABLE "PayrollGroup" ALTER COLUMN "deductionPeriodSSS" SET DEFAULT 'EVERY_PERIOD';
ALTER TABLE "PayrollGroup" ALTER COLUMN "deductionPeriodWitholdingTax" SET DEFAULT 'EVERY_PERIOD';
COMMIT;
