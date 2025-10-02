-- CreateEnum
CREATE TYPE "AttendanceConflictAction" AS ENUM ('IGNORED', 'RESOLVED');

-- CreateTable
CREATE TABLE "AttendanceConflictIgnore" (
    "id" SERIAL NOT NULL,
    "conflictId" INTEGER NOT NULL,
    "ignoredByAccountId" TEXT NOT NULL,
    "action" "AttendanceConflictAction" NOT NULL DEFAULT 'IGNORED',
    "ignoredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AttendanceConflictIgnore_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AttendanceConflictIgnore_ignoredByAccountId_idx" ON "AttendanceConflictIgnore"("ignoredByAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "AttendanceConflictIgnore_conflictId_ignoredByAccountId_key" ON "AttendanceConflictIgnore"("conflictId", "ignoredByAccountId");

-- AddForeignKey
ALTER TABLE "AttendanceConflictIgnore" ADD CONSTRAINT "AttendanceConflictIgnore_conflictId_fkey" FOREIGN KEY ("conflictId") REFERENCES "AttendanceConflict"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceConflictIgnore" ADD CONSTRAINT "AttendanceConflictIgnore_ignoredByAccountId_fkey" FOREIGN KEY ("ignoredByAccountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
