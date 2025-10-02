/*
  Warnings:

  - A unique constraint covering the columns `[lrn,companyId]` on the table `Student` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Student_lrn_key";

-- AlterTable
ALTER TABLE "Guardian" ADD COLUMN     "passwordHash" VARCHAR(255);

-- CreateIndex
CREATE UNIQUE INDEX "Student_lrn_companyId_key" ON "Student"("lrn", "companyId");
