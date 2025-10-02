-- AlterTable
ALTER TABLE "TaskProjectNotifications" ADD COLUMN     "senderId" TEXT;

-- AddForeignKey
ALTER TABLE "TaskProjectNotifications" ADD CONSTRAINT "TaskProjectNotifications_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;
