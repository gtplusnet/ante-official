-- AlterTable
ALTER TABLE "EmployeeSalaryComputation" ADD COLUMN     "governmentContributionPagibigBasis" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "governmentContributionPagibigEmployeeShare" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "governmentContributionPagibigEmployerShare" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "governmentContributionPagibigMaximumEEShare" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "governmentContributionPagibigMaximumERShare" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "governmentContributionPagibigMinimumPercentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "governmentContributionPagibigMinimumShare" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "governmentContributionPagibigPercentage" DOUBLE PRECISION NOT NULL DEFAULT 0;
