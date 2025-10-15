-- CreateEnum
CREATE TYPE "SaleStatus" AS ENUM ('PENDING', 'PROCESSED', 'COMPLETED', 'VOID', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'QR_CODE', 'GCASH', 'PAYMAYA', 'BANK_TRANSFER', 'CHECK');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ScopeList" ADD VALUE 'MANPOWER_CASHIER_MANAGEMENT_ACCESS';
ALTER TYPE "ScopeList" ADD VALUE 'MANPOWER_CASHIER_MANAGEMENT_CREATE';
ALTER TYPE "ScopeList" ADD VALUE 'MANPOWER_CASHIER_MANAGEMENT_UPDATE';
ALTER TYPE "ScopeList" ADD VALUE 'MANPOWER_CASHIER_MANAGEMENT_DELETE';

-- DropForeignKey
ALTER TABLE "Account" DROP CONSTRAINT "Account_parentAccountId_fkey";

-- DropIndex
DROP INDEX "EmployeeTimekeepingRaw_deviceId_idx";

-- DropIndex
DROP INDEX "idx_guardian_is_active";

-- DropIndex
DROP INDEX "idx_guardian_notification_guardian_id";

-- DropIndex
DROP INDEX "idx_guardian_notification_read_at";

-- DropIndex
DROP INDEX "ManpowerDevice_companyId_idx";

-- DropIndex
DROP INDEX "ManpowerDevice_isActive_idx";

-- DropIndex
DROP INDEX "idx_school_attendance_company_id";

-- DropIndex
DROP INDEX "idx_school_attendance_person_type";

-- DropIndex
DROP INDEX "idx_school_attendance_timestamp";

-- DropIndex
DROP INDEX "idx_school_notification_guardian_id";

-- DropIndex
DROP INDEX "idx_school_notification_read";

-- DropIndex
DROP INDEX "idx_school_notification_timestamp";

-- DropIndex
DROP INDEX "idx_student_is_active";

-- DropIndex
DROP INDEX "idx_student_guardian_guardian_id";

-- DropIndex
DROP INDEX "idx_student_guardian_student_id";

-- DropIndex
DROP INDEX "Task_companyId_idx";

-- AlterTable
ALTER TABLE "SchoolSection" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- DropTable
DROP TABLE "AccountDeletionLog";

-- CreateTable
CREATE TABLE "LaborerData" (
    "accountId" TEXT NOT NULL,
    "branchId" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Sale" (
    "id" TEXT NOT NULL,
    "saleNumber" TEXT NOT NULL,
    "subtotal" DOUBLE PRECISION NOT NULL,
    "discountAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total" DOUBLE PRECISION NOT NULL,
    "paymentAmount" DOUBLE PRECISION NOT NULL,
    "changeAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cashierId" TEXT NOT NULL,
    "laborerId" TEXT,
    "customerId" TEXT,
    "branchId" INTEGER NOT NULL,
    "status" "SaleStatus" NOT NULL DEFAULT 'PENDING',
    "isClaimed" BOOLEAN NOT NULL DEFAULT false,
    "isVoid" BOOLEAN NOT NULL DEFAULT false,
    "voidReason" TEXT,
    "voidById" TEXT,
    "voidedAt" TIMESTAMP(3),
    "cashierName" TEXT NOT NULL,
    "laborerName" TEXT,
    "customerName" TEXT,
    "customerEmail" TEXT,
    "branchName" TEXT NOT NULL,
    "remarks" TEXT,
    "pointsEarned" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SaleItem" (
    "id" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "itemId" TEXT,
    "parentSaleItemId" TEXT,
    "itemName" TEXT NOT NULL,
    "itemImage" TEXT,
    "itemType" "ItemType" NOT NULL DEFAULT 'INDIVIDUAL_PRODUCT',
    "quantity" INTEGER NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "subtotal" DOUBLE PRECISION NOT NULL,
    "discountType" TEXT,
    "discountPercentage" DOUBLE PRECISION,
    "discountAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalAfterDiscount" DOUBLE PRECISION NOT NULL,
    "isIncluded" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SaleItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalePayment" (
    "id" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "referenceNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SalePayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LaborerData_accountId_key" ON "LaborerData"("accountId");

-- CreateIndex
CREATE INDEX "LaborerData_branchId_idx" ON "LaborerData"("branchId");

-- CreateIndex
CREATE INDEX "idx_laborer_branch_active" ON "LaborerData"("branchId", "isActive");

-- CreateIndex
CREATE INDEX "idx_laborer_created" ON "LaborerData"("createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "Sale_saleNumber_key" ON "Sale"("saleNumber");

-- CreateIndex
CREATE INDEX "Sale_saleNumber_idx" ON "Sale"("saleNumber");

-- CreateIndex
CREATE INDEX "Sale_cashierId_idx" ON "Sale"("cashierId");

-- CreateIndex
CREATE INDEX "Sale_laborerId_idx" ON "Sale"("laborerId");

-- CreateIndex
CREATE INDEX "Sale_branchId_idx" ON "Sale"("branchId");

-- CreateIndex
CREATE INDEX "Sale_status_idx" ON "Sale"("status");

-- CreateIndex
CREATE INDEX "Sale_createdAt_idx" ON "Sale"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "SaleItem_saleId_idx" ON "SaleItem"("saleId");

-- CreateIndex
CREATE INDEX "SaleItem_itemId_idx" ON "SaleItem"("itemId");

-- CreateIndex
CREATE INDEX "SaleItem_parentSaleItemId_idx" ON "SaleItem"("parentSaleItemId");

-- CreateIndex
CREATE INDEX "SalePayment_saleId_idx" ON "SalePayment"("saleId");

-- CreateIndex
CREATE INDEX "idx_employee_company_active" ON "EmployeeData"("branchId", "isActive");

-- CreateIndex
CREATE INDEX "idx_employee_created" ON "EmployeeData"("createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "SchoolSection_name_gradeLevelId_schoolYear_companyId_key" ON "SchoolSection"("name", "gradeLevelId", "schoolYear", "companyId");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_parentAccountId_fkey" FOREIGN KEY ("parentAccountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LaborerData" ADD CONSTRAINT "LaborerData_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LaborerData" ADD CONSTRAINT "LaborerData_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_cashierId_fkey" FOREIGN KEY ("cashierId") REFERENCES "CashierData"("accountId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_laborerId_fkey" FOREIGN KEY ("laborerId") REFERENCES "LaborerData"("accountId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_voidById_fkey" FOREIGN KEY ("voidById") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleItem" ADD CONSTRAINT "SaleItem_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleItem" ADD CONSTRAINT "SaleItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleItem" ADD CONSTRAINT "SaleItem_parentSaleItemId_fkey" FOREIGN KEY ("parentSaleItemId") REFERENCES "SaleItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalePayment" ADD CONSTRAINT "SalePayment_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "TaskOrderContext_userId_taskId_viewType_groupingMode_groupingVa" RENAME TO "TaskOrderContext_userId_taskId_viewType_groupingMode_groupi_key";

-- RenameIndex
ALTER INDEX "TaskOrderContext_userId_viewType_groupingMode_groupingValue_ord" RENAME TO "TaskOrderContext_userId_viewType_groupingMode_groupingValue_idx";

-- RenameIndex
ALTER INDEX "TaskOrderContext_viewType_groupingMode_groupingValue_orderIndex" RENAME TO "TaskOrderContext_viewType_groupingMode_groupingValue_orderI_idx";

