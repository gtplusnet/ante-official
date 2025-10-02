/*
  Warnings:

  - Added the required column `monthlyAccrualCredits` to the `EmployeeLeavePlan` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalAnnualCredits` to the `EmployeeLeavePlan` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "EmployeeLeavePlan" ADD COLUMN     "customRenewalDate" TIMESTAMP(3),
ADD COLUMN     "monthlyAccrualCredits" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "renewalType" "LeaveRenewalType" NOT NULL DEFAULT 'HIRING_ANNIVERSARY',
ADD COLUMN     "totalAnnualCredits" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "workingDaysPerMonth" INTEGER NOT NULL DEFAULT 22;

-- CreateTable
CREATE TABLE "LeaveCreditHistory" (
    "id" SERIAL NOT NULL,
    "employeeLeavePlanId" INTEGER NOT NULL,
    "transactionType" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "balanceBefore" DECIMAL(10,2) NOT NULL,
    "balanceAfter" DECIMAL(10,2) NOT NULL,
    "reason" TEXT NOT NULL,
    "referenceId" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeaveCreditHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LeaveCreditHistory_employeeLeavePlanId_idx" ON "LeaveCreditHistory"("employeeLeavePlanId");

-- CreateIndex
CREATE INDEX "LeaveCreditHistory_createdAt_idx" ON "LeaveCreditHistory"("createdAt");

-- AddForeignKey
ALTER TABLE "LeaveCreditHistory" ADD CONSTRAINT "LeaveCreditHistory_employeeLeavePlanId_fkey" FOREIGN KEY ("employeeLeavePlanId") REFERENCES "EmployeeLeavePlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
