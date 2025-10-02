/*
  Warnings:

  - You are about to drop the column `deductionBasisPhilHealth` on the `PayrollGroup` table. All the data in the column will be lost.
  - Added the required column `deductionBasisPhilhealth` to the `PayrollGroup` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PayrollGroup" DROP COLUMN "deductionBasisPhilHealth",
ADD COLUMN     "deductionBasisPhilhealth" "DeductionPeriod" NOT NULL;
