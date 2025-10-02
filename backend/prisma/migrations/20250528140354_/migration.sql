-- CreateTable
CREATE TABLE "EmployeeSalaryComputationDeductions" (
    "id" SERIAL NOT NULL,
    "employeeSalaryComputationId" INTEGER NOT NULL,
    "deductionConfigurationId" INTEGER NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isPosted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmployeeSalaryComputationDeductions_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "EmployeeSalaryComputationDeductions" ADD CONSTRAINT "EmployeeSalaryComputationDeductions_employeeSalaryComputat_fkey" FOREIGN KEY ("employeeSalaryComputationId") REFERENCES "EmployeeSalaryComputation"("employeeTimekeepingCutoffId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeSalaryComputationDeductions" ADD CONSTRAINT "EmployeeSalaryComputationDeductions_deductionConfiguration_fkey" FOREIGN KEY ("deductionConfigurationId") REFERENCES "DeductionConfiguration"("id") ON DELETE CASCADE ON UPDATE CASCADE;
