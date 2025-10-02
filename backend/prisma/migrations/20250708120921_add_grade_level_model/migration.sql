-- CreateEnum
CREATE TYPE "EducationLevel" AS ENUM ('NURSERY', 'KINDERGARTEN', 'ELEMENTARY', 'JUNIOR_HIGH', 'SENIOR_HIGH', 'COLLEGE');

-- AlterEnum
ALTER TYPE "SystemModule" ADD VALUE 'SCHOOL';

-- CreateTable
CREATE TABLE "GradeLevel" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "educationLevel" "EducationLevel" NOT NULL,
    "sequence" INTEGER NOT NULL,
    "ageRangeMin" INTEGER,
    "ageRangeMax" INTEGER,
    "description" TEXT,
    "companyId" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GradeLevel_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GradeLevel_companyId_idx" ON "GradeLevel"("companyId");

-- CreateIndex
CREATE INDEX "GradeLevel_educationLevel_idx" ON "GradeLevel"("educationLevel");

-- CreateIndex
CREATE UNIQUE INDEX "GradeLevel_code_companyId_key" ON "GradeLevel"("code", "companyId");

-- AddForeignKey
ALTER TABLE "GradeLevel" ADD CONSTRAINT "GradeLevel_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;
