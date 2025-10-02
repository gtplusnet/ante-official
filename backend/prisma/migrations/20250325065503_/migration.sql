/*
  Warnings:

  - Changed the type of `lateDeductionType` on the `PayrollGroup` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `undertimeDeductionType` on the `PayrollGroup` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "DeductionType" AS ENUM ('BASED_ON_SALARY', 'NOT_DEDUCTED', 'CUSTOM');

-- AlterTable
ALTER TABLE "PayrollGroup" DROP COLUMN "lateDeductionType",
ADD COLUMN     "lateDeductionType" "DeductionType" NOT NULL,
DROP COLUMN "undertimeDeductionType",
ADD COLUMN     "undertimeDeductionType" "DeductionType" NOT NULL;

-- DropEnum
DROP TYPE "deductionType";
