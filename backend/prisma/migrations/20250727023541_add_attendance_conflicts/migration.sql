-- CreateEnum
CREATE TYPE "AttendanceConflictType" AS ENUM ('MISSING_LOG', 'MISSING_TIME_OUT');

-- CreateTable
CREATE TABLE "AttendanceConflict" (
    "id" SERIAL NOT NULL,
    "accountId" TEXT NOT NULL,
    "employeeTimekeepingId" INTEGER,
    "conflictType" "AttendanceConflictType" NOT NULL,
    "conflictDate" TIMESTAMP(3) NOT NULL,
    "dateString" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "shiftInfo" JSONB,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AttendanceConflict_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AttendanceConflict_dateString_isResolved_idx" ON "AttendanceConflict"("dateString", "isResolved");

-- CreateIndex
CREATE INDEX "AttendanceConflict_accountId_isResolved_idx" ON "AttendanceConflict"("accountId", "isResolved");

-- CreateIndex
CREATE UNIQUE INDEX "AttendanceConflict_accountId_dateString_conflictType_key" ON "AttendanceConflict"("accountId", "dateString", "conflictType");

-- AddForeignKey
ALTER TABLE "AttendanceConflict" ADD CONSTRAINT "AttendanceConflict_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceConflict" ADD CONSTRAINT "AttendanceConflict_employeeTimekeepingId_fkey" FOREIGN KEY ("employeeTimekeepingId") REFERENCES "EmployeeTimekeeping"("id") ON DELETE CASCADE ON UPDATE CASCADE;
