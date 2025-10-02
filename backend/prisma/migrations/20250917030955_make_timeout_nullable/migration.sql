-- Make timeOut field nullable in EmployeeTimekeepingRaw
ALTER TABLE "EmployeeTimekeepingRaw"
ALTER COLUMN "timeOut" DROP NOT NULL;