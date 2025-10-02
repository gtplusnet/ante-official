-- AlterTable
ALTER TABLE "Task" ADD COLUMN "companyId" INTEGER;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "Task_companyId_idx" ON "Task"("companyId");

-- Update existing tasks with company from their creators
UPDATE "Task" t
SET "companyId" = a."companyId"
FROM "Account" a
WHERE t."createdById" = a."id" AND t."companyId" IS NULL;