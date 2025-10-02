/*
  Warnings:

  - Changed the type of `cutoffType` on the `Cutoff` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "CutoffType" AS ENUM ('WEEKLY', 'SEMIMONTHLY', 'MONTHLY');

-- AlterTable
ALTER TABLE "Cutoff" DROP COLUMN "cutoffType",
ADD COLUMN     "cutoffType" "CutoffType" NOT NULL;

-- DropEnum
DROP TYPE "CutOffType";
