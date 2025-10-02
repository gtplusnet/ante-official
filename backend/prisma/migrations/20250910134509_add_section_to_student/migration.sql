-- AlterTable
ALTER TABLE "Student" ADD COLUMN "sectionId" TEXT;

-- CreateIndex
CREATE INDEX "Student_sectionId_idx" ON "Student"("sectionId");

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "SchoolSection"("id") ON DELETE SET NULL ON UPDATE CASCADE;