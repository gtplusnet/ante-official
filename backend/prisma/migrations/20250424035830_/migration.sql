/*
  Warnings:

  - Added the required column `CutoffPeriodType` to the `CutoffDateRange` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "CutoffPeriodType" AS ENUM ('FIRST_PERIOD', 'LAST_PERIOD');

-- AlterTable
ALTER TABLE "CutoffDateRange" ADD COLUMN     "CutoffPeriodType" "CutoffPeriodType" NOT NULL;
