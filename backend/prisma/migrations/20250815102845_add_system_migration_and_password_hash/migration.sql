-- CreateEnum
CREATE TYPE "MigrationStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'ROLLED_BACK', 'SKIPPED');

-- AlterTable
ALTER TABLE "Account" ADD COLUMN     "passwordHash" VARCHAR(255);

-- CreateTable
CREATE TABLE "SystemMigration" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "MigrationStatus" NOT NULL DEFAULT 'PENDING',
    "executedAt" TIMESTAMP(3),
    "executedBy" TEXT,
    "environment" TEXT NOT NULL,
    "errorMessage" TEXT,
    "metadata" JSONB,
    "rollbackable" BOOLEAN NOT NULL DEFAULT false,
    "rolledBackAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemMigration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SystemMigration_name_key" ON "SystemMigration"("name");
