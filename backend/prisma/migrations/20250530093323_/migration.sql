/*
  Warnings:

  - A unique constraint covering the columns `[module,targetId,companyId]` on the table `Discussion` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `companyId` to the `Discussion` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Discussion_module_targetId_key";

-- AlterTable
ALTER TABLE "Discussion" ADD COLUMN     "companyId" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Discussion_module_targetId_companyId_key" ON "Discussion"("module", "targetId", "companyId");

-- AddForeignKey
ALTER TABLE "Discussion" ADD CONSTRAINT "Discussion_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
