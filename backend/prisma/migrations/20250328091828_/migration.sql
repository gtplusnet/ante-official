/*
  Warnings:

  - The `deductionBasisSSS` column on the `PayrollGroup` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "DeductionTargetBasis" AS ENUM ('BASIC_SALARY', 'BASIC_PAY', 'PRO_RATED_BASIC_PAY', 'GROSS_PAY');

-- AlterTable
ALTER TABLE "PayrollGroup" ADD COLUMN     "deductionBasisPhilhealth" "DeductionTargetBasis" NOT NULL DEFAULT 'BASIC_SALARY',
DROP COLUMN "deductionBasisSSS",
ADD COLUMN     "deductionBasisSSS" "DeductionTargetBasis" NOT NULL DEFAULT 'BASIC_SALARY';

-- DropEnum
DROP TYPE "DeductionBasis";
