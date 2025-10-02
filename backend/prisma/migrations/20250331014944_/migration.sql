-- AlterEnum
ALTER TYPE "ProjectStatus" ADD VALUE 'BRANCH';

-- AlterTable
ALTER TABLE "Project" ALTER COLUMN "clientId" DROP NOT NULL;
