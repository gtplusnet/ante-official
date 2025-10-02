/*
  Warnings:

  - A unique constraint covering the columns `[facebookId]` on the table `Account` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
ALTER TYPE "AuthProvider" ADD VALUE 'FACEBOOK';

-- AlterTable
ALTER TABLE "Account" ADD COLUMN     "facebookId" VARCHAR(255);

-- CreateIndex
CREATE UNIQUE INDEX "Account_facebookId_key" ON "Account"("facebookId");
