/*
  Warnings:

  - A unique constraint covering the columns `[employeeTimekeepingCutoffId,date]` on the table `EmployeeTimekeeping` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "EmployeeTimekeeping_employeeTimekeepingCutoffId_date_key" ON "EmployeeTimekeeping"("employeeTimekeepingCutoffId", "date");
