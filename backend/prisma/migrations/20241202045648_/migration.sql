/*
  Warnings:

  - Added the required column `encoding` to the `Files` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fieldName` to the `Files` table without a default value. This is not possible if the table is not empty.
  - Added the required column `mimetype` to the `Files` table without a default value. This is not possible if the table is not empty.
  - Added the required column `originalname` to the `Files` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Files" ADD COLUMN     "encoding" TEXT NOT NULL,
ADD COLUMN     "fieldName" TEXT NOT NULL,
ADD COLUMN     "mimetype" TEXT NOT NULL,
ADD COLUMN     "originalname" TEXT NOT NULL;
