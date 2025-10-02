-- AlterTable
ALTER TABLE "EmployeeData" ADD COLUMN     "bankAccountNumber" TEXT,
ADD COLUMN     "bankName" TEXT,
ADD COLUMN     "biometricsNumber" TEXT;

-- AlterTable
ALTER TABLE "Role" ADD COLUMN     "department" TEXT;
