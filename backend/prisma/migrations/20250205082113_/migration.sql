/*
  Warnings:

  - You are about to drop the column `description` on the `Equipment` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Equipment" DROP COLUMN "description",
ADD COLUMN     "serialCode" TEXT;
