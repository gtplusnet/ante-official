/*
  Warnings:

  - You are about to drop the column `accountId` on the `EmployeeTimekeeping` table. All the data in the column will be lost.
  - Added the required column `employeeTimekeepingCutoffId` to the `EmployeeTimekeeping` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "EmployeeTimekeeping" DROP CONSTRAINT "EmployeeTimekeeping_accountId_fkey";

-- DropIndex
DROP INDEX "EmployeeTimekeeping_accountId_date_key";

-- AlterTable
ALTER TABLE "EmployeeTimekeeping" DROP COLUMN "accountId",
ADD COLUMN     "employeeTimekeepingCutoffId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "EmployeeTimekeeping" ADD CONSTRAINT "EmployeeTimekeeping_employeeTimekeepingCutoffId_fkey" FOREIGN KEY ("employeeTimekeepingCutoffId") REFERENCES "EmployeeTimekeepingCutoff"("id") ON DELETE CASCADE ON UPDATE CASCADE;
