/*
  Warnings:

  - A unique constraint covering the columns `[companyId,module,path]` on the table `MediaFolder` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "MediaFolder_companyId_idx";

-- DropIndex
DROP INDEX "MediaFolder_companyId_path_key";

-- AlterTable
ALTER TABLE "MediaFolder" ADD COLUMN     "module" "ModuleType" NOT NULL DEFAULT 'CMS';

-- CreateIndex
CREATE INDEX "MediaFolder_companyId_module_idx" ON "MediaFolder"("companyId", "module");

-- CreateIndex
CREATE UNIQUE INDEX "MediaFolder_companyId_module_path_key" ON "MediaFolder"("companyId", "module", "path");
