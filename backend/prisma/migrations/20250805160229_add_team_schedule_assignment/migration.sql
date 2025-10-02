-- CreateTable
CREATE TABLE "TeamScheduleAssignment" (
    "id" SERIAL NOT NULL,
    "teamId" INTEGER NOT NULL,
    "date" TEXT NOT NULL,
    "projectId" INTEGER,
    "shiftId" INTEGER,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedById" TEXT NOT NULL,
    "companyId" INTEGER NOT NULL,

    CONSTRAINT "TeamScheduleAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TeamScheduleAssignment_date_companyId_idx" ON "TeamScheduleAssignment"("date", "companyId");

-- CreateIndex
CREATE INDEX "TeamScheduleAssignment_teamId_date_idx" ON "TeamScheduleAssignment"("teamId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "TeamScheduleAssignment_teamId_date_companyId_key" ON "TeamScheduleAssignment"("teamId", "date", "companyId");

-- AddForeignKey
ALTER TABLE "TeamScheduleAssignment" ADD CONSTRAINT "TeamScheduleAssignment_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamScheduleAssignment" ADD CONSTRAINT "TeamScheduleAssignment_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamScheduleAssignment" ADD CONSTRAINT "TeamScheduleAssignment_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "Shift"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamScheduleAssignment" ADD CONSTRAINT "TeamScheduleAssignment_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamScheduleAssignment" ADD CONSTRAINT "TeamScheduleAssignment_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
