/*
  Warnings:

  - A unique constraint covering the columns `[scheduleCode,companyId]` on the table `Schedule` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Schedule_scheduleCode_companyId_key" ON "Schedule"("scheduleCode", "companyId");
