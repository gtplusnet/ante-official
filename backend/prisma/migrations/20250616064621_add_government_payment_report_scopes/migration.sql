-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ScopeList" ADD VALUE 'MANPOWER_REPORTS_SSS_ACCESS';
ALTER TYPE "ScopeList" ADD VALUE 'MANPOWER_REPORTS_PHILHEALTH_ACCESS';
ALTER TYPE "ScopeList" ADD VALUE 'MANPOWER_REPORTS_PAGIBIG_ACCESS';
ALTER TYPE "ScopeList" ADD VALUE 'MANPOWER_REPORTS_TAX_ACCESS';
