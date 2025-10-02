/*
  Warnings:

  - The values [EARLY_IN,LATE_OUT,MID_OVERTIME,EARLY_OUT] on the enum `BreakdownType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "BreakdownType_new" AS ENUM ('UNDEFINED', 'LATE', 'WORK_TIME', 'NIGHT_DIFFERENTIAL', 'NIGHT_DIFFERENTIAL_OVERTIME', 'OVERTIME', 'UNDERTIME');
ALTER TABLE "EmployeeTimekeepingLogs" ALTER COLUMN "type" TYPE "BreakdownType_new" USING ("type"::text::"BreakdownType_new");
ALTER TYPE "BreakdownType" RENAME TO "BreakdownType_old";
ALTER TYPE "BreakdownType_new" RENAME TO "BreakdownType";
DROP TYPE "BreakdownType_old";
COMMIT;
