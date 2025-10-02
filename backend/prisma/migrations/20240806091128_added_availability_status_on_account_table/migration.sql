-- CreateEnum
CREATE TYPE "Status" AS ENUM ('Deployed', 'Floating');

-- AlterTable
ALTER TABLE "Account" ADD COLUMN     "status" "Status" NOT NULL DEFAULT 'Floating';
