-- CreateEnum
CREATE TYPE "LeaveRenewalType" AS ENUM ('HIRING_ANNIVERSARY', 'START_OF_YEAR', 'MONTHLY', 'CUSTOM_DATE');

-- CreateTable
CREATE TABLE "LeaveTypeConfiguration" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "parentId" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeaveTypeConfiguration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeavePlan" (
    "id" SERIAL NOT NULL,
    "leaveTypeConfigurationId" INTEGER NOT NULL,
    "planName" TEXT NOT NULL,
    "canCarryOver" BOOLEAN NOT NULL DEFAULT false,
    "maxCarryOverCredits" INTEGER,
    "canConvertToCash" BOOLEAN NOT NULL DEFAULT false,
    "maxCashConversionCredits" INTEGER,
    "canFileSameDay" BOOLEAN NOT NULL DEFAULT false,
    "allowLateFiling" BOOLEAN NOT NULL DEFAULT true,
    "advanceFilingDays" INTEGER,
    "maxConsecutiveDays" INTEGER,
    "canFileAgainstFutureCredits" BOOLEAN NOT NULL DEFAULT false,
    "maxAdvanceFilingDays" INTEGER,
    "isAttachmentMandatory" BOOLEAN NOT NULL DEFAULT false,
    "totalUpfrontCredits" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "monthlyAccrualCredits" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "workingDaysPerMonth" INTEGER NOT NULL DEFAULT 22,
    "renewalType" "LeaveRenewalType" NOT NULL DEFAULT 'HIRING_ANNIVERSARY',
    "customRenewalDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeavePlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeLeavePlan" (
    "id" SERIAL NOT NULL,
    "leavePlanId" INTEGER NOT NULL,
    "accountId" TEXT NOT NULL,
    "effectiveDate" TIMESTAMP(3) NOT NULL,
    "currentCredits" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "usedCredits" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "carriedCredits" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmployeeLeavePlan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LeaveTypeConfiguration_code_key" ON "LeaveTypeConfiguration"("code");

-- CreateIndex
CREATE INDEX "LeaveTypeConfiguration_parentId_idx" ON "LeaveTypeConfiguration"("parentId");

-- CreateIndex
CREATE INDEX "LeaveTypeConfiguration_code_idx" ON "LeaveTypeConfiguration"("code");

-- CreateIndex
CREATE INDEX "LeavePlan_leaveTypeConfigurationId_idx" ON "LeavePlan"("leaveTypeConfigurationId");

-- CreateIndex
CREATE INDEX "EmployeeLeavePlan_accountId_idx" ON "EmployeeLeavePlan"("accountId");

-- CreateIndex
CREATE INDEX "EmployeeLeavePlan_leavePlanId_idx" ON "EmployeeLeavePlan"("leavePlanId");

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeLeavePlan_leavePlanId_accountId_key" ON "EmployeeLeavePlan"("leavePlanId", "accountId");

-- AddForeignKey
ALTER TABLE "LeaveTypeConfiguration" ADD CONSTRAINT "LeaveTypeConfiguration_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "LeaveTypeConfiguration"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeavePlan" ADD CONSTRAINT "LeavePlan_leaveTypeConfigurationId_fkey" FOREIGN KEY ("leaveTypeConfigurationId") REFERENCES "LeaveTypeConfiguration"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeLeavePlan" ADD CONSTRAINT "EmployeeLeavePlan_leavePlanId_fkey" FOREIGN KEY ("leavePlanId") REFERENCES "LeavePlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeLeavePlan" ADD CONSTRAINT "EmployeeLeavePlan_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "EmployeeData"("accountId") ON DELETE RESTRICT ON UPDATE CASCADE;
