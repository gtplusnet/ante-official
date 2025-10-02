/*
  Warnings:

  - You are about to drop the column `salary` on the `EmployeeContract` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `EmployeeContract` table. All the data in the column will be lost.
  - Added the required column `employmentStatus` to the `EmployeeContract` table without a default value. This is not possible if the table is not empty.
  - Added the required column `monthlyRate` to the `EmployeeContract` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "EmploymentStatus" AS ENUM ('REGULAR', 'CONTRACTTUAL', 'PROBATIONARY', 'TRAINEE');

-- AlterTable
ALTER TABLE "EmployeeContract" DROP COLUMN "salary",
DROP COLUMN "type",
ADD COLUMN     "employmentStatus" "EmploymentStatus" NOT NULL,
ADD COLUMN     "monthlyRate" DOUBLE PRECISION NOT NULL;

-- CreateTable
CREATE TABLE "EmployeeData" (
    "accountId" TEXT NOT NULL,
    "payrollGroupId" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeData_accountId_key" ON "EmployeeData"("accountId");

-- AddForeignKey
ALTER TABLE "EmployeeData" ADD CONSTRAINT "EmployeeData_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeData" ADD CONSTRAINT "EmployeeData_payrollGroupId_fkey" FOREIGN KEY ("payrollGroupId") REFERENCES "PayrollGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
