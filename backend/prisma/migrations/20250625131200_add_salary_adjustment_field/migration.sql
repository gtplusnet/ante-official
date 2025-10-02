/*
  Warnings:

  - A unique constraint covering the columns `[scheduleCode,companyId,isDeleted]` on the table `Schedule` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Schedule_scheduleCode_companyId_key";

-- CreateIndex
CREATE UNIQUE INDEX "Schedule_scheduleCode_companyId_isDeleted_key" ON "Schedule"("scheduleCode", "companyId", "isDeleted");
