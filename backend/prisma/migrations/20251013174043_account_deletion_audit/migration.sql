-- AlterTable: Change parent account foreign key from CASCADE to SET NULL
ALTER TABLE "Account" DROP CONSTRAINT IF EXISTS "Account_parentAccountId_fkey";
ALTER TABLE "Account" ADD CONSTRAINT "Account_parentAccountId_fkey"
  FOREIGN KEY ("parentAccountId") REFERENCES "Account"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable: AccountDeletionLog for audit trail
CREATE TABLE "AccountDeletionLog" (
    "id" TEXT NOT NULL,
    "deletedAccountId" TEXT NOT NULL,
    "deletedUsername" TEXT NOT NULL,
    "deletedEmail" TEXT NOT NULL,
    "deletedByAccountId" TEXT,
    "deletedByUsername" TEXT,
    "reason" TEXT,
    "deletionType" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "AccountDeletionLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AccountDeletionLog_deletedAccountId_idx" ON "AccountDeletionLog"("deletedAccountId");
CREATE INDEX "AccountDeletionLog_deletedAt_idx" ON "AccountDeletionLog"("deletedAt");
