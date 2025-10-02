/*
  Warnings:

  - A unique constraint covering the columns `[cutoffId,accountId,dateRangeCode]` on the table `EmployeeTimekeepingCutoff` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "EmployeeTimekeepingCutoff_cutoffId_accountId_dateRangeCode_key" ON "EmployeeTimekeepingCutoff"("cutoffId", "accountId", "dateRangeCode");
