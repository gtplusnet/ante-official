/*
  Warnings:

  - A unique constraint covering the columns `[email]` on the table `Guardian` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[email,companyId]` on the table `Guardian` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `dateOfBirth` to the `Guardian` table without a default value. This is not possible if the table is not empty.
  - Added the required column `key` to the `Guardian` table without a default value. This is not possible if the table is not empty.
  - Added the required column `password` to the `Guardian` table without a default value. This is not possible if the table is not empty.
  - Made the column `email` on table `Guardian` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Guardian" ADD COLUMN     "dateOfBirth" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "key" BYTEA NOT NULL,
ADD COLUMN     "lastLogin" TIMESTAMP(3),
ADD COLUMN     "password" TEXT NOT NULL,
ADD COLUMN     "searchKeyword" TEXT,
ALTER COLUMN "email" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Guardian_email_key" ON "Guardian"("email");

-- CreateIndex
CREATE INDEX "Guardian_email_idx" ON "Guardian"("email");

-- CreateIndex
CREATE INDEX "Guardian_searchKeyword_idx" ON "Guardian"("searchKeyword");

-- CreateIndex
CREATE UNIQUE INDEX "Guardian_email_companyId_key" ON "Guardian"("email", "companyId");
