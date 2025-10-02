/*
  Warnings:

  - You are about to drop the column `deductionConfigurationId` on the `EmployeeSalaryComputationDeductions` table. All the data in the column will be lost.
  - Added the required column `deductionPlanId` to the `EmployeeSalaryComputationDeductions` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "EmployeeSalaryComputationDeductions" DROP CONSTRAINT "EmployeeSalaryComputationDeductions_deductionConfiguration_fkey";

-- AlterTable
ALTER TABLE "EmployeeSalaryComputationDeductions" DROP COLUMN "deductionConfigurationId",
ADD COLUMN     "deductionPlanId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "EmployeeSalaryComputationDeductions" ADD CONSTRAINT "EmployeeSalaryComputationDeductions_deductionPlanId_fkey" FOREIGN KEY ("deductionPlanId") REFERENCES "DeductionPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
