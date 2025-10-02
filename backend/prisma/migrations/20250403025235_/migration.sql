/*
  Warnings:

  - A unique constraint covering the columns `[accountId,date]` on the table `EmployeeTimekeeping` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "EmployeeTimekeeping_accountId_date_key" ON "EmployeeTimekeeping"("accountId", "date");
