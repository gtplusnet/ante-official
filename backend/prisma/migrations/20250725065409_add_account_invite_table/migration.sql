-- AlterTable
ALTER TABLE "Account" ADD COLUMN     "isInviteAccepted" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "AccountInvite" (
    "id" TEXT NOT NULL,
    "email" VARCHAR(100) NOT NULL,
    "firstName" VARCHAR(100) NOT NULL,
    "lastName" VARCHAR(100) NOT NULL,
    "roleId" TEXT NOT NULL,
    "parentAccountId" TEXT,
    "inviteToken" VARCHAR(100) NOT NULL,
    "inviteTokenExpiry" TIMESTAMP(3) NOT NULL,
    "invitedById" TEXT NOT NULL,
    "companyId" INTEGER NOT NULL,
    "isAccepted" BOOLEAN NOT NULL DEFAULT false,
    "acceptedAt" TIMESTAMP(3),
    "accountId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccountInvite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AccountInvite_id_key" ON "AccountInvite"("id");

-- CreateIndex
CREATE UNIQUE INDEX "AccountInvite_inviteToken_key" ON "AccountInvite"("inviteToken");

-- CreateIndex
CREATE UNIQUE INDEX "AccountInvite_accountId_key" ON "AccountInvite"("accountId");

-- CreateIndex
CREATE INDEX "AccountInvite_inviteToken_idx" ON "AccountInvite"("inviteToken");

-- CreateIndex
CREATE INDEX "AccountInvite_email_idx" ON "AccountInvite"("email");

-- CreateIndex
CREATE INDEX "AccountInvite_companyId_idx" ON "AccountInvite"("companyId");

-- AddForeignKey
ALTER TABLE "AccountInvite" ADD CONSTRAINT "AccountInvite_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountInvite" ADD CONSTRAINT "AccountInvite_parentAccountId_fkey" FOREIGN KEY ("parentAccountId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountInvite" ADD CONSTRAINT "AccountInvite_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountInvite" ADD CONSTRAINT "AccountInvite_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountInvite" ADD CONSTRAINT "AccountInvite_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
