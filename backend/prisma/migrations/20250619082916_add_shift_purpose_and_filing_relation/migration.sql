/*
  Warnings:

  - A unique constraint covering the columns `[filingId]` on the table `Shift` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "ShiftPurpose" AS ENUM ('REGULAR', 'EMPLOYEE_ADJUSTMENT', 'TEAM_OVERRIDE');

-- AlterTable
ALTER TABLE "Shift" ADD COLUMN     "filingId" INTEGER,
ADD COLUMN     "purpose" "ShiftPurpose" NOT NULL DEFAULT 'REGULAR';

-- CreateIndex
CREATE UNIQUE INDEX "Shift_filingId_key" ON "Shift"("filingId");

-- AddForeignKey
ALTER TABLE "Shift" ADD CONSTRAINT "Shift_filingId_fkey" FOREIGN KEY ("filingId") REFERENCES "PayrollFiling"("id") ON DELETE CASCADE ON UPDATE CASCADE;
