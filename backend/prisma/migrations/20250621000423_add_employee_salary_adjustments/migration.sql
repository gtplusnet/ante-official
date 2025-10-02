-- CreateEnum
CREATE TYPE "SalaryAdjustmentType" AS ENUM ('ALLOWANCE', 'DEDUCTION');

-- CreateTable
CREATE TABLE "EmployeeSalaryAdjustment" (
    "id" SERIAL NOT NULL,
    "accountId" TEXT NOT NULL,
    "cutoffDateRangeId" TEXT NOT NULL,
    "adjustmentType" "SalaryAdjustmentType" NOT NULL,
    "configurationId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmployeeSalaryAdjustment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EmployeeSalaryAdjustment_accountId_idx" ON "EmployeeSalaryAdjustment"("accountId");

-- CreateIndex
CREATE INDEX "EmployeeSalaryAdjustment_cutoffDateRangeId_idx" ON "EmployeeSalaryAdjustment"("cutoffDateRangeId");

-- CreateIndex
CREATE INDEX "EmployeeSalaryAdjustment_configurationId_idx" ON "EmployeeSalaryAdjustment"("configurationId");

-- AddForeignKey
ALTER TABLE "EmployeeSalaryAdjustment" ADD CONSTRAINT "EmployeeSalaryAdjustment_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeSalaryAdjustment" ADD CONSTRAINT "EmployeeSalaryAdjustment_cutoffDateRangeId_fkey" FOREIGN KEY ("cutoffDateRangeId") REFERENCES "CutoffDateRange"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
