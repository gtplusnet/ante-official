/*
  Warnings:

  - You are about to drop the column `title` on the `Conversation` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[accountId]` on the table `Conversation` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Conversation" DROP COLUMN "title";

-- CreateIndex
CREATE UNIQUE INDEX "Conversation_accountId_key" ON "Conversation"("accountId");
