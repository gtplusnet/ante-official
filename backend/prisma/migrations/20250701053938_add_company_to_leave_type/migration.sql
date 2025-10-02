/*
  Warnings:

  - A unique constraint covering the columns `[code,companyId]` on the table `LeaveTypeConfiguration` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "LeaveTypeConfiguration_code_key";

-- AlterTable
ALTER TABLE "LeaveTypeConfiguration" ADD COLUMN     "companyId" INTEGER;

-- CreateIndex
CREATE INDEX "LeaveTypeConfiguration_companyId_idx" ON "LeaveTypeConfiguration"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "LeaveTypeConfiguration_code_companyId_key" ON "LeaveTypeConfiguration"("code", "companyId");

-- AddForeignKey
ALTER TABLE "LeaveTypeConfiguration" ADD CONSTRAINT "LeaveTypeConfiguration_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;
