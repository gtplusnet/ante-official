-- AlterTable
ALTER TABLE "_EmployeeTimekeepingToEmployeeTimekeepingComputed" ADD CONSTRAINT "_EmployeeTimekeepingToEmployeeTimekeepingComputed_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_EmployeeTimekeepingToEmployeeTimekeepingComputed_AB_unique";

-- CreateTable
CREATE TABLE "IndividualScheduleAssignment" (
    "id" SERIAL NOT NULL,
    "employeeId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "projectId" INTEGER,
    "shiftId" INTEGER,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedById" TEXT NOT NULL,
    "companyId" INTEGER NOT NULL,

    CONSTRAINT "IndividualScheduleAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "IndividualScheduleAssignment_date_companyId_idx" ON "IndividualScheduleAssignment"("date", "companyId");

-- CreateIndex
CREATE INDEX "IndividualScheduleAssignment_employeeId_date_idx" ON "IndividualScheduleAssignment"("employeeId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "IndividualScheduleAssignment_employeeId_date_companyId_key" ON "IndividualScheduleAssignment"("employeeId", "date", "companyId");

-- AddForeignKey
ALTER TABLE "IndividualScheduleAssignment" ADD CONSTRAINT "IndividualScheduleAssignment_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IndividualScheduleAssignment" ADD CONSTRAINT "IndividualScheduleAssignment_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IndividualScheduleAssignment" ADD CONSTRAINT "IndividualScheduleAssignment_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "Shift"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IndividualScheduleAssignment" ADD CONSTRAINT "IndividualScheduleAssignment_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IndividualScheduleAssignment" ADD CONSTRAINT "IndividualScheduleAssignment_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
