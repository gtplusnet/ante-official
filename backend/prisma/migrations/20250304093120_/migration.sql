-- AlterTable
ALTER TABLE "Collection" ADD COLUMN     "accomplishmentReferenceId" INTEGER,
ADD COLUMN     "referenceId" INTEGER NOT NULL DEFAULT 0;

-- AddForeignKey
ALTER TABLE "Collection" ADD CONSTRAINT "Collection_accomplishmentReferenceId_fkey" FOREIGN KEY ("accomplishmentReferenceId") REFERENCES "ProjectAccomplishment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
