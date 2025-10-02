-- CreateEnum
CREATE TYPE "ModuleType" AS ENUM ('PROJECTS', 'ASSETS', 'CALENDAR', 'MANPOWER', 'CRM', 'TREASURY', 'CMS', 'SCHOOL');

-- AlterTable
ALTER TABLE "Files" ADD COLUMN     "module" "ModuleType" NOT NULL DEFAULT 'CMS';

-- CreateIndex
CREATE INDEX "Files_companyId_module_idx" ON "Files"("companyId", "module");

-- CreateIndex
CREATE INDEX "Files_companyId_module_folderId_idx" ON "Files"("companyId", "module", "folderId");

-- CreateIndex
CREATE INDEX "Files_module_processingStatus_idx" ON "Files"("module", "processingStatus");
