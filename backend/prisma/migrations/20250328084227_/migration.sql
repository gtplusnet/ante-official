/*
  Warnings:

  - You are about to drop the column `deductionBasisPagibig` on the `PayrollGroup` table. All the data in the column will be lost.
  - You are about to drop the column `deductionBasisPhic` on the `PayrollGroup` table. All the data in the column will be lost.
  - You are about to drop the column `deductionBasisPhilhealth` on the `PayrollGroup` table. All the data in the column will be lost.
  - You are about to drop the column `deductionBasisSSS` on the `PayrollGroup` table. All the data in the column will be lost.
  - You are about to drop the column `deductionBasisWitholdingTax` on the `PayrollGroup` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "PayrollGroup" DROP COLUMN "deductionBasisPagibig",
DROP COLUMN "deductionBasisPhic",
DROP COLUMN "deductionBasisPhilhealth",
DROP COLUMN "deductionBasisSSS",
DROP COLUMN "deductionBasisWitholdingTax",
ADD COLUMN     "deductionPeriodPagibig" "DeductionPeriod" NOT NULL DEFAULT 'EVERY_PERIOD',
ADD COLUMN     "deductionPeriodPhic" "DeductionPeriod" NOT NULL DEFAULT 'EVERY_PERIOD',
ADD COLUMN     "deductionPeriodPhilhealth" "DeductionPeriod" NOT NULL DEFAULT 'EVERY_PERIOD',
ADD COLUMN     "deductionPeriodSSS" "DeductionPeriod" NOT NULL DEFAULT 'EVERY_PERIOD',
ADD COLUMN     "deductionPeriodWitholdingTax" "DeductionPeriod" NOT NULL DEFAULT 'EVERY_PERIOD';
