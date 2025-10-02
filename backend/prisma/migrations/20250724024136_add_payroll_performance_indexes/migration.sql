-- CreateIndex
CREATE INDEX "Account_firstName_idx" ON "Account"("firstName");

-- CreateIndex
CREATE INDEX "Account_lastName_idx" ON "Account"("lastName");

-- CreateIndex
CREATE INDEX "Account_companyId_idx" ON "Account"("companyId");

-- CreateIndex
CREATE INDEX "Account_firstName_lastName_idx" ON "Account"("firstName", "lastName");

-- CreateIndex
CREATE INDEX "CutoffDateRange_status_idx" ON "CutoffDateRange"("status");

-- CreateIndex
CREATE INDEX "CutoffDateRange_startDate_endDate_idx" ON "CutoffDateRange"("startDate", "endDate");

-- CreateIndex
CREATE INDEX "CutoffDateRange_processingDate_cutoffId_status_idx" ON "CutoffDateRange"("processingDate", "cutoffId", "status");

-- CreateIndex
CREATE INDEX "EmployeeData_employeeCode_idx" ON "EmployeeData"("employeeCode");

-- CreateIndex
CREATE INDEX "EmployeeData_payrollGroupId_idx" ON "EmployeeData"("payrollGroupId");

-- CreateIndex
CREATE INDEX "EmployeeData_branchId_idx" ON "EmployeeData"("branchId");

-- CreateIndex
CREATE INDEX "EmployeeTimekeeping_date_idx" ON "EmployeeTimekeeping"("date");

-- CreateIndex
CREATE INDEX "EmployeeTimekeeping_employeeTimekeepingCutoffId_idx" ON "EmployeeTimekeeping"("employeeTimekeepingCutoffId");

-- CreateIndex
CREATE INDEX "EmployeeTimekeeping_employeeTimekeepingCutoffId_date_source_idx" ON "EmployeeTimekeeping"("employeeTimekeepingCutoffId", "date", "sourceType");

-- CreateIndex
CREATE INDEX "EmployeeTimekeepingCutoff_accountId_idx" ON "EmployeeTimekeepingCutoff"("accountId");

-- CreateIndex
CREATE INDEX "EmployeeTimekeepingCutoff_cutoffDateRangeId_idx" ON "EmployeeTimekeepingCutoff"("cutoffDateRangeId");
