/*
  Warnings:

  - You are about to drop the `TaskProjectNotifications` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "TaskProjectNotifications" DROP CONSTRAINT "TaskProjectNotifications_notificationsId_fkey";

-- DropForeignKey
ALTER TABLE "TaskProjectNotifications" DROP CONSTRAINT "TaskProjectNotifications_projectId_fkey";

-- DropForeignKey
ALTER TABLE "TaskProjectNotifications" DROP CONSTRAINT "TaskProjectNotifications_receiverId_fkey";

-- DropForeignKey
ALTER TABLE "TaskProjectNotifications" DROP CONSTRAINT "TaskProjectNotifications_senderId_fkey";

-- DropForeignKey
ALTER TABLE "TaskProjectNotifications" DROP CONSTRAINT "TaskProjectNotifications_taskId_fkey";

-- DropTable
DROP TABLE "TaskProjectNotifications";

-- CreateTable
CREATE TABLE "AccountNotifications" (
    "id" SERIAL NOT NULL,
    "notificationsId" INTEGER,
    "receiverId" TEXT,
    "senderId" TEXT,
    "projectId" INTEGER,
    "hasRead" BOOLEAN NOT NULL DEFAULT false,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccountNotifications_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "AccountNotifications" ADD CONSTRAINT "AccountNotifications_notificationsId_fkey" FOREIGN KEY ("notificationsId") REFERENCES "Notifications"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountNotifications" ADD CONSTRAINT "AccountNotifications_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountNotifications" ADD CONSTRAINT "AccountNotifications_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountNotifications" ADD CONSTRAINT "AccountNotifications_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;
