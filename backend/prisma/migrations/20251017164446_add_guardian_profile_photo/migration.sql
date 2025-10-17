-- AlterTable
ALTER TABLE "Guardian" ADD COLUMN "profilePhotoId" INTEGER;

-- AddForeignKey
ALTER TABLE "Guardian" ADD CONSTRAINT "Guardian_profilePhotoId_fkey" FOREIGN KEY ("profilePhotoId") REFERENCES "Files"("id") ON DELETE SET NULL ON UPDATE CASCADE;

