-- AlterTable
ALTER TABLE "EmployeeTimekeepingRaw" ADD COLUMN "taskId" INTEGER;
ALTER TABLE "EmployeeTimekeepingRaw" ADD COLUMN "taskTitle" TEXT;
ALTER TABLE "EmployeeTimekeepingRaw" ADD COLUMN "projectId" INTEGER;

-- AlterEnum
ALTER TYPE "TimekeepingSource" ADD VALUE 'TIMER';

-- CreateIndex
CREATE INDEX "EmployeeTimekeepingRaw_accountId_taskId_idx" ON "EmployeeTimekeepingRaw"("accountId", "taskId");

-- CreateIndex
CREATE INDEX "EmployeeTimekeepingRaw_accountId_createdAt_idx" ON "EmployeeTimekeepingRaw"("accountId", "createdAt");

-- CreateIndex
CREATE INDEX "EmployeeTimekeepingRaw_accountId_source_idx" ON "EmployeeTimekeepingRaw"("accountId", "source");

-- AddForeignKey
ALTER TABLE "EmployeeTimekeepingRaw" ADD CONSTRAINT "EmployeeTimekeepingRaw_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeTimekeepingRaw" ADD CONSTRAINT "EmployeeTimekeepingRaw_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;