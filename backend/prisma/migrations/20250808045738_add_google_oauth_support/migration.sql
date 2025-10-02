/*
  Warnings:

  - A unique constraint covering the columns `[googleId]` on the table `Account` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "AuthProvider" AS ENUM ('LOCAL', 'GOOGLE');

-- AlterTable
ALTER TABLE "Account" ADD COLUMN     "authProvider" "AuthProvider" NOT NULL DEFAULT 'LOCAL',
ADD COLUMN     "googleId" VARCHAR(255),
ALTER COLUMN "password" DROP NOT NULL,
ALTER COLUMN "key" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Account_googleId_key" ON "Account"("googleId");

-- CreateIndex
CREATE INDEX "Account_googleId_idx" ON "Account"("googleId");
