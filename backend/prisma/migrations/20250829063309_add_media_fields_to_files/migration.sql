-- CreateEnum
CREATE TYPE "ProcessingStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- AlterTable
ALTER TABLE "Files" ADD COLUMN     "accessCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "alternativeText" TEXT,
ADD COLUMN     "blurPlaceholder" TEXT,
ADD COLUMN     "caption" TEXT,
ADD COLUMN     "companyId" INTEGER,
ADD COLUMN     "dominantColor" TEXT,
ADD COLUMN     "duration" DOUBLE PRECISION,
ADD COLUMN     "folderId" INTEGER,
ADD COLUMN     "height" INTEGER,
ADD COLUMN     "lastAccessedAt" TIMESTAMP(3),
ADD COLUMN     "processingError" TEXT,
ADD COLUMN     "processingStatus" "ProcessingStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "variants" JSONB,
ADD COLUMN     "width" INTEGER;

-- CreateTable
CREATE TABLE "MediaFolder" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "parentId" INTEGER,
    "path" TEXT NOT NULL,
    "companyId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MediaFolder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MediaFolder_companyId_idx" ON "MediaFolder"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "MediaFolder_companyId_path_key" ON "MediaFolder"("companyId", "path");

-- CreateIndex
CREATE INDEX "Files_companyId_type_idx" ON "Files"("companyId", "type");

-- CreateIndex
CREATE INDEX "Files_companyId_folderId_idx" ON "Files"("companyId", "folderId");

-- CreateIndex
CREATE INDEX "Files_companyId_processingStatus_idx" ON "Files"("companyId", "processingStatus");

-- CreateIndex
CREATE INDEX "Files_companyId_createdAt_idx" ON "Files"("companyId", "createdAt");

-- AddForeignKey
ALTER TABLE "Files" ADD CONSTRAINT "Files_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Files" ADD CONSTRAINT "Files_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "MediaFolder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaFolder" ADD CONSTRAINT "MediaFolder_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "MediaFolder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaFolder" ADD CONSTRAINT "MediaFolder_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
