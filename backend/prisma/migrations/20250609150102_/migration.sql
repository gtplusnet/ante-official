/*
  Warnings:

  - You are about to drop the `UserLevelModel` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "UserLevelModel" DROP CONSTRAINT "UserLevelModel_companyId_fkey";

-- DropTable
DROP TABLE "UserLevelModel";

-- DropEnum
DROP TYPE "UserLevel";

-- CreateTable
CREATE TABLE "UserLevel" (
    "id" SERIAL NOT NULL,
    "label" TEXT NOT NULL,
    "systemModule" "SystemModule" NOT NULL,
    "companyId" INTEGER NOT NULL,
    "scope" "ScopeList"[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserLevel_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "UserLevel" ADD CONSTRAINT "UserLevel_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
