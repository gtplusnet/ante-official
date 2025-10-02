/*
  Warnings:

  - You are about to drop the `RoleScope` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Scope` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "RoleScope" DROP CONSTRAINT "RoleScope_roleID_fkey";

-- DropForeignKey
ALTER TABLE "RoleScope" DROP CONSTRAINT "RoleScope_scopeID_fkey";

-- DropForeignKey
ALTER TABLE "Scope" DROP CONSTRAINT "Scope_parentID_fkey";

-- DropTable
DROP TABLE "RoleScope";

-- DropTable
DROP TABLE "Scope";
