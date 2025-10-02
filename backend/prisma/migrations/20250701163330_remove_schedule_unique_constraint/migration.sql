-- DropIndex
DROP INDEX "Schedule_scheduleCode_companyId_isDeleted_key";

-- CreateIndex
CREATE INDEX "Schedule_scheduleCode_companyId_idx" ON "Schedule"("scheduleCode", "companyId");
