-- AlterTable
ALTER TABLE "EmployeeSalaryComputation" ADD COLUMN     "governmentContributionPagibigBasicCurrent" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "governmentContributionPagibigBasisPrevious" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "governmentContributionPhilhealthBasicCurrent" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "governmentContributionPhilhealthBasisPrevious" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "governmentContributionSSSBasicCurrent" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "governmentContributionSSSBasisrevious" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "taxableIncomeCurrent" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "taxableIncomePrevious" DOUBLE PRECISION NOT NULL DEFAULT 0;
