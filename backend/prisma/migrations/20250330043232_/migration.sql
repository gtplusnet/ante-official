/*
  Warnings:

  - You are about to drop the `EmployeeImportation` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "EmployeeImportation" DROP CONSTRAINT "EmployeeImportation_fileId_fkey";

-- DropForeignKey
ALTER TABLE "EmployeeImportation" DROP CONSTRAINT "EmployeeImportation_queueId_fkey";

-- AlterTable
ALTER TABLE "Queue" ADD COLUMN     "fileId" INTEGER;

-- DropTable
DROP TABLE "EmployeeImportation";

-- AddForeignKey
ALTER TABLE "Queue" ADD CONSTRAINT "Queue_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "Files"("id") ON DELETE CASCADE ON UPDATE CASCADE;
