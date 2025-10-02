-- CreateEnum
CREATE TYPE "WinProbability" AS ENUM ('UNKNOWN', 'VERY_HIGH', 'HIGH', 'MEDIUM', 'LOW', 'VERY_LOW');

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "personInChargeId" TEXT,
ADD COLUMN     "winProbability" "WinProbability" NOT NULL DEFAULT 'UNKNOWN';

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_personInChargeId_fkey" FOREIGN KEY ("personInChargeId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;
