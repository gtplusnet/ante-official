/*
  Warnings:

  - The primary key for the `_EmployeeTimekeepingToEmployeeTimekeepingComputed` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[A,B]` on the table `_EmployeeTimekeepingToEmployeeTimekeepingComputed` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "_EmployeeTimekeepingToEmployeeTimekeepingComputed" DROP CONSTRAINT "_EmployeeTimekeepingToEmployeeTimekeepingComputed_AB_pkey";

-- CreateIndex
CREATE UNIQUE INDEX "_EmployeeTimekeepingToEmployeeTimekeepingComputed_AB_unique" ON "_EmployeeTimekeepingToEmployeeTimekeepingComputed"("A", "B");
