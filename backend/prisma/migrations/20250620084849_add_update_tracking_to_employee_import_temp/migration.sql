-- AlterTable
ALTER TABLE "EmployeeImportTemp" ADD COLUMN     "existingAccountId" TEXT,
ADD COLUMN     "isUpdate" BOOLEAN NOT NULL DEFAULT false;
