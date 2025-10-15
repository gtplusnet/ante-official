-- Migration: Remove branchId from CashierData and add companyId
-- This migration restructures CashierData to use device's branch context instead of storing branch per cashier

-- Step 1: Add companyId column (nullable initially) - Skip if exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'CashierData' AND column_name = 'companyId') THEN
    ALTER TABLE "CashierData" ADD COLUMN "companyId" INTEGER;
  END IF;
END $$;

-- Step 2: Populate companyId from the branch's company (only if branchId column exists and companyId is NULL)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name = 'CashierData' AND column_name = 'branchId') THEN
    EXECUTE '
      UPDATE "CashierData"
      SET "companyId" = (
        SELECT "companyId"
        FROM "Project"
        WHERE "Project"."id" = "CashierData"."branchId"
      )
      WHERE "companyId" IS NULL AND "branchId" IS NOT NULL
    ';
  END IF;
END $$;

-- Step 3: Make companyId NOT NULL after population (skip if already NOT NULL)
DO $$
BEGIN
  ALTER TABLE "CashierData" ALTER COLUMN "companyId" SET NOT NULL;
EXCEPTION
  WHEN others THEN
    -- Column might already be NOT NULL, ignore error
    NULL;
END $$;

-- Step 4: Create foreign key constraint (skip if exists)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints
                 WHERE constraint_name = 'CashierData_companyId_fkey'
                 AND table_name = 'CashierData') THEN
    ALTER TABLE "CashierData" ADD CONSTRAINT "CashierData_companyId_fkey"
      FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- Step 5: Drop old branch-related indexes if they exist
DROP INDEX IF EXISTS "CashierData_branchId_idx";
DROP INDEX IF EXISTS "idx_cashier_branch_active";

-- Step 6: Drop foreign key constraint for branchId if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints
             WHERE constraint_name = 'CashierData_branchId_fkey'
             AND table_name = 'CashierData') THEN
    ALTER TABLE "CashierData" DROP CONSTRAINT "CashierData_branchId_fkey";
  END IF;
END $$;

-- Step 7: Drop branchId column if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name = 'CashierData' AND column_name = 'branchId') THEN
    ALTER TABLE "CashierData" DROP COLUMN "branchId";
  END IF;
END $$;

-- Step 8: Create new indexes for companyId (skip if exist)
CREATE INDEX IF NOT EXISTS "CashierData_companyId_idx" ON "CashierData"("companyId");
CREATE INDEX IF NOT EXISTS "idx_cashier_company_active" ON "CashierData"("companyId", "isActive");
