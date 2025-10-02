/*
  Warnings:

  - Added the required column `contractFileId` to the `EmployeeContract` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `EmployeeContract` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "EmployeeContract" ADD COLUMN     "contractFileId" INTEGER NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AddForeignKey
ALTER TABLE "EmployeeContract" ADD CONSTRAINT "EmployeeContract_contractFileId_fkey" FOREIGN KEY ("contractFileId") REFERENCES "Files"("id") ON DELETE CASCADE ON UPDATE CASCADE;
