/*
  Warnings:

  - You are about to drop the column `isError` on the `QueueLogs` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "QueueLogStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- AlterTable
ALTER TABLE "QueueLogs" DROP COLUMN "isError",
ADD COLUMN     "status" "QueueLogStatus" NOT NULL DEFAULT 'PENDING';
