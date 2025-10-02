/*
  Warnings:

  - The `key` column on the `BoardLane` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "BoardLaneKeys" AS ENUM ('BACKLOG', 'IN_PROGRESS', 'DONE');

-- DropIndex
DROP INDEX "BoardLane_key_key";

-- AlterTable
ALTER TABLE "BoardLane" DROP COLUMN "key",
ADD COLUMN     "key" "BoardLaneKeys";
