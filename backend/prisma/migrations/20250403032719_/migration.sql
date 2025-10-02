/*
  Warnings:

  - The values [REGULAR] on the enum `TimekeepingCategory` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "TimekeepingCategory_new" AS ENUM ('WORK_TIME', 'OVERTIME', 'UNDERTIME', 'NIGHT_DIFFERENTIAL', 'NIGHT_DIFFERENTIAL_OVERTIME');
ALTER TABLE "EmployeeTimekeepingLogs" ALTER COLUMN "timekeepingCategory" TYPE "TimekeepingCategory_new" USING ("timekeepingCategory"::text::"TimekeepingCategory_new");
ALTER TYPE "TimekeepingCategory" RENAME TO "TimekeepingCategory_old";
ALTER TYPE "TimekeepingCategory_new" RENAME TO "TimekeepingCategory";
DROP TYPE "TimekeepingCategory_old";
COMMIT;
