-- AlterTable
ALTER TABLE "Notifications" ADD COLUMN     "showDialogId" TEXT,
ADD COLUMN     "showDialogModule" TEXT DEFAULT 'none';
