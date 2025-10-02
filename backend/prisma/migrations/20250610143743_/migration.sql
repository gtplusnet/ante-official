-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ScopeList" ADD VALUE 'SETTINGS_COMPANY_ACCESS';
ALTER TYPE "ScopeList" ADD VALUE 'SETTINGS_BRANCHES_ACCESS';
ALTER TYPE "ScopeList" ADD VALUE 'SETTINGS_USER_ACCESS';
ALTER TYPE "ScopeList" ADD VALUE 'SETTINGS_ROLE_GROUP_ACCESS';
ALTER TYPE "ScopeList" ADD VALUE 'SETTINGS_ROLES_ACCESS';
ALTER TYPE "ScopeList" ADD VALUE 'SETTINGS_USER_LEVEL_ACCESS';
ALTER TYPE "ScopeList" ADD VALUE 'SETTINGS_DEVELOPER_PROMOTION_ACCESS';
