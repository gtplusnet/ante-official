/*
  Warnings:

  - You are about to drop the column `userlevelAccess` on the `Role` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Role" DROP COLUMN "userlevelAccess";

-- CreateTable
CREATE TABLE "RoleUserLevel" (
    "id" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "userLevelId" INTEGER NOT NULL,

    CONSTRAINT "RoleUserLevel_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RoleUserLevel_id_key" ON "RoleUserLevel"("id");

-- AddForeignKey
ALTER TABLE "RoleUserLevel" ADD CONSTRAINT "RoleUserLevel_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoleUserLevel" ADD CONSTRAINT "RoleUserLevel_userLevelId_fkey" FOREIGN KEY ("userLevelId") REFERENCES "UserLevel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
