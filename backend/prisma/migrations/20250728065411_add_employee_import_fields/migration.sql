/*
  Warnings:

  - You are about to drop the column `employeeStatus` on the `EmployeeImportTemp` table. All the data in the column will be lost.
  - Added the required column `employmentStatus` to the `EmployeeImportTemp` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "EmployeeImportTemp" DROP COLUMN "employeeStatus",
ADD COLUMN     "bankAccountNumber" TEXT,
ADD COLUMN     "bankName" TEXT,
ADD COLUMN     "birthdate" TIMESTAMP(3),
ADD COLUMN     "city" TEXT,
ADD COLUMN     "civilStatus" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "employmentStatus" TEXT NOT NULL,
ADD COLUMN     "hdmfNumber" TEXT,
ADD COLUMN     "phcNumber" TEXT,
ADD COLUMN     "postalCode" TEXT,
ADD COLUMN     "sex" TEXT,
ADD COLUMN     "sssNumber" TEXT,
ADD COLUMN     "stateProvince" TEXT,
ADD COLUMN     "street" TEXT,
ADD COLUMN     "tinNumber" TEXT,
ADD COLUMN     "zipCode" TEXT;
