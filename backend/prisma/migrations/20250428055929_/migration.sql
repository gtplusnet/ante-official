-- DropForeignKey
ALTER TABLE "EmployeeTimekeeping" DROP CONSTRAINT "EmployeeTimekeeping_overrideId_fkey";

-- AddForeignKey
ALTER TABLE "EmployeeTimekeeping" ADD CONSTRAINT "EmployeeTimekeeping_overrideId_fkey" FOREIGN KEY ("overrideId") REFERENCES "EmployeeTimekeepingOverride"("id") ON DELETE SET NULL ON UPDATE CASCADE;
