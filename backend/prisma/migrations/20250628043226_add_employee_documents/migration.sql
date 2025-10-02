-- CreateEnum
CREATE TYPE "EmployeeDocumentCategory" AS ENUM ('EMPLOYMENT', 'GOVERNMENT_LEGAL', 'EDUCATION_PROFESSIONAL', 'MEDICAL_HEALTH', 'PERFORMANCE_DISCIPLINARY', 'COMPENSATION_BENEFITS', 'EXIT_DOCUMENTS', 'OTHER');

-- CreateTable
CREATE TABLE "EmployeeDocument" (
    "id" SERIAL NOT NULL,
    "accountId" TEXT NOT NULL,
    "fileId" INTEGER NOT NULL,
    "category" "EmployeeDocumentCategory" NOT NULL,
    "documentType" TEXT NOT NULL,
    "description" TEXT,
    "expiryDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmployeeDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeDocument_fileId_key" ON "EmployeeDocument"("fileId");

-- AddForeignKey
ALTER TABLE "EmployeeDocument" ADD CONSTRAINT "EmployeeDocument_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "EmployeeData"("accountId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeDocument" ADD CONSTRAINT "EmployeeDocument_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "Files"("id") ON DELETE CASCADE ON UPDATE CASCADE;
