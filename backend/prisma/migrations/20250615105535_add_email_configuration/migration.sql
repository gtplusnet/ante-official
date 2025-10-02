-- CreateEnum
CREATE TYPE "EmailProtocol" AS ENUM ('POP3', 'IMAP');

-- CreateEnum
CREATE TYPE "EmailProvider" AS ENUM ('GMAIL', 'OUTLOOK', 'YAHOO', 'CUSTOM');

-- AlterEnum
ALTER TYPE "ScopeList" ADD VALUE 'SETTINGS_EMAIL_ACCESS';

-- CreateTable
CREATE TABLE "EmailConfiguration" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "emailProvider" "EmailProvider" NOT NULL DEFAULT 'CUSTOM',
    "emailProtocol" "EmailProtocol" NOT NULL,
    "incomingServer" TEXT NOT NULL,
    "incomingPort" INTEGER NOT NULL,
    "incomingSSL" BOOLEAN NOT NULL DEFAULT true,
    "outgoingServer" TEXT NOT NULL,
    "outgoingPort" INTEGER NOT NULL,
    "outgoingSSL" BOOLEAN NOT NULL DEFAULT true,
    "emailAddress" TEXT NOT NULL,
    "emailPassword" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailConfiguration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EmailConfiguration_id_key" ON "EmailConfiguration"("id");

-- CreateIndex
CREATE UNIQUE INDEX "EmailConfiguration_accountId_key" ON "EmailConfiguration"("accountId");

-- AddForeignKey
ALTER TABLE "EmailConfiguration" ADD CONSTRAINT "EmailConfiguration_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
