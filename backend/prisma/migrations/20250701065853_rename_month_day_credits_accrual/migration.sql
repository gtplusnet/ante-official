/*
  Warnings:

  - You are about to drop the column `workingDaysPerMonth` on the `EmployeeLeavePlan` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "EmployeeLeavePlan" DROP COLUMN "workingDaysPerMonth",
ADD COLUMN     "monthDayCreditsAccrual" INTEGER NOT NULL DEFAULT 22;

-- AlterTable
ALTER TABLE "LeavePlan" ADD COLUMN     "customRenewalDate" TIMESTAMP(3),
ADD COLUMN     "renewalType" "LeaveRenewalType" NOT NULL DEFAULT 'HIRING_ANNIVERSARY';
