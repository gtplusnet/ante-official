-- AlterTable
ALTER TABLE "EmployeeSalaryComputation" ADD COLUMN     "governmentContributionPhilhealthEmployeeShare" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "governmentContributionPhilhealthEmployerShare" DOUBLE PRECISION NOT NULL DEFAULT 0;
