-- Migration: Revert CashierData to remove companyId
-- This migration removes the redundant companyId field from CashierData
-- Company is already accessible through CashierData -> Account -> Company

-- Step 1: Drop company-related indexes if they exist
DROP INDEX IF EXISTS "CashierData_companyId_idx";
DROP INDEX IF EXISTS "idx_cashier_company_active";

-- Step 2: Drop foreign key constraint for companyId if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints
             WHERE constraint_name = 'CashierData_companyId_fkey'
             AND table_name = 'CashierData') THEN
    ALTER TABLE "CashierData" DROP CONSTRAINT "CashierData_companyId_fkey";
  END IF;
END $$;

-- Step 3: Drop companyId column if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name = 'CashierData' AND column_name = 'companyId') THEN
    ALTER TABLE "CashierData" DROP COLUMN "companyId";
  END IF;
END $$;
