-- AlterTable
ALTER TABLE "EmployeeSalaryComputation" ADD COLUMN     "governmentContributionPhilhealthBasis" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "governmentContributionPhilhealthMaximum" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "governmentContributionPhilhealthMinimum" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "governmentContributionPhilhealthPercentage" DOUBLE PRECISION NOT NULL DEFAULT 0;
