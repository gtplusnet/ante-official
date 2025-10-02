-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "leadBoardStage" TEXT NOT NULL DEFAULT 'opportunity',
ADD COLUMN     "projectBoardStage" TEXT NOT NULL DEFAULT 'planning';
