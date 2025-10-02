-- AlterTable
ALTER TABLE "Account" ADD COLUMN "supabaseUserId" VARCHAR(255),
ADD COLUMN "supabaseEmail" VARCHAR(255);

-- AlterTable
ALTER TABLE "AccountToken" ADD COLUMN "supabaseAccessToken" TEXT,
ADD COLUMN "supabaseRefreshToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Account_supabaseUserId_key" ON "Account"("supabaseUserId");