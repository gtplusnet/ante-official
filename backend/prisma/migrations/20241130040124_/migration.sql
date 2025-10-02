-- CreateEnum
CREATE TYPE "TaskAssignMode" AS ENUM ('SELF', 'OTHER', 'ROLE_GROUP');

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "assignMode" "TaskAssignMode" NOT NULL DEFAULT 'SELF';
