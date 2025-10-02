/*
  Warnings:

  - You are about to drop the column `gradeLevelId` on the `Student` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Student" DROP CONSTRAINT "Student_gradeLevelId_fkey";

-- DropIndex
DROP INDEX "Student_gradeLevelId_idx";

-- AlterTable
ALTER TABLE "Student" DROP COLUMN "gradeLevelId";
