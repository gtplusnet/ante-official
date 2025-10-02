/*
  Warnings:

  - A unique constraint covering the columns `[employeeSalaryComputationId,deductionPlanId]` on the table `EmployeeSalaryComputationDeductions` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "EmployeeSalaryComputationDeductions_employeeSalaryComputati_key" ON "EmployeeSalaryComputationDeductions"("employeeSalaryComputationId", "deductionPlanId");
