-- CreateEnum
CREATE TYPE "DeductionBasis" AS ENUM ('DEFAULT', 'BASIC_PAY', 'PRO_RATED_BASIC_PAY', 'GROSS_PAY');

-- AlterTable
ALTER TABLE "PayrollGroup" ADD COLUMN     "deductionBasisSSS" "DeductionType" NOT NULL DEFAULT 'NOT_DEDUCTED';
