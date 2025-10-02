/*
  Warnings:

  - You are about to drop the column `date` on the `EmployeeTimekeepingLogs` table. All the data in the column will be lost.
  - Added the required column `timekeepingCategory` to the `EmployeeTimekeepingLogs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `EmployeeTimekeepingLogs` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TimekeepingCategory" AS ENUM ('REGULAR', 'OVERTIME', 'UNDERTIME', 'NIGHT_DIFFERENTIAL', 'NIGHT_DIFFERENTIAL_OVERTIME');

-- CreateEnum
CREATE TYPE "BreakdownType" AS ENUM ('EARLY_IN', 'LATE_OUT', 'MID_OVERTIME', 'LATE', 'EARLY_OUT', 'WORK_TIME', 'NIGHT_DIFFERENTIAL');

-- AlterTable
ALTER TABLE "EmployeeTimekeepingLogs" DROP COLUMN "date",
ADD COLUMN     "timekeepingCategory" "TimekeepingCategory" NOT NULL,
ADD COLUMN     "type" "BreakdownType" NOT NULL;
