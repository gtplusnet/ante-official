/*
  Warnings:

  - You are about to drop the `Collaborators` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Collaborators" DROP CONSTRAINT "Collaborators_accountId_fkey";

-- DropForeignKey
ALTER TABLE "Collaborators" DROP CONSTRAINT "Collaborators_taskId_fkey";

-- DropTable
DROP TABLE "Collaborators";
