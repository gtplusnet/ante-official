-- AlterTable
ALTER TABLE "CalendarCategory"
ADD COLUMN "accountId" TEXT;

-- CreateIndex
CREATE INDEX "CalendarCategory_accountId_idx" ON "CalendarCategory"("accountId");

-- AddForeignKey
ALTER TABLE "CalendarCategory"
ADD CONSTRAINT "CalendarCategory_accountId_fkey"
FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- DropIndex (old unique constraint)
DROP INDEX IF EXISTS "CalendarCategory_name_companyId_key";

-- CreateIndex (new unique constraint with accountId)
CREATE UNIQUE INDEX "CalendarCategory_name_accountId_companyId_key"
ON "CalendarCategory"("name", "accountId", "companyId");
