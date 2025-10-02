/*
  Warnings:

  - You are about to drop the column `holidayName` on the `LocalHoliday` table. All the data in the column will be lost.
  - Added the required column `name` to the `LocalHoliday` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "LocalHoliday" DROP COLUMN "holidayName",
ADD COLUMN     "name" TEXT NOT NULL;
